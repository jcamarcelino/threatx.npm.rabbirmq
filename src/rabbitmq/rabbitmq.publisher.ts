import { ConfirmChannel, Options } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { RabbitConnection } from "./connection/rabbitmq.connection";
import { JsonSerializer, IMessageSerializer } from "./message/rabbitmq.message.index";
import { Logger } from "./rabbitmq.logger";
import { ExchangeOptions, PublisherOptions, PublishOptions, PublishResult } from "./rabbitmq.types";
import { ITopology, DirectTopology, FanoutTopology } from "./topology/rabbitmq.topology.index";

export class RabbitPublisher {
  private channel?: ConfirmChannel;
  private readonly exchange: ExchangeOptions;
  private readonly routingKey: string | string[];
  private readonly mandatory: boolean;
  private readonly confirm: boolean;
  private readonly topology: ITopology;

  constructor(
    private readonly connection: RabbitConnection,
    opts: PublisherOptions,
    private readonly logger: Logger = console,
    private readonly serializer: IMessageSerializer = new JsonSerializer()
  ) {
    this.exchange = { durable: true, ...opts.exchange };
    this.routingKey = opts.routingKey ?? "";
    this.mandatory = opts.mandatory ?? true;
    this.confirm = opts.confirm ?? true;

    this.topology = this.exchange.type === "fanout" ? new FanoutTopology(logger) : new DirectTopology(logger);

    void this.assert(opts);
  }

  private async assert(opts: PublisherOptions): Promise<void> {
    await this.connection.connect();
    this.channel = this.connection.channel();
    if (!this.channel) throw new Error("Channel not available after connect()");

    this.channel.on("return", (msg) => {
      this.logger.warn("[Rabbit] message returned (unroutable)", {
        exchange: msg.fields.exchange,
        routingKey: msg.fields.routingKey,
        messageId: msg.properties.messageId,
      });
    });

    if (opts.queues?.length) {
      for (const queue of opts.queues) {
        const routingKey = queue.routingKey ?? this.routingKey;
        await this.topology.assert(this.channel, this.exchange, queue, routingKey);
      }
    }
  }

  private getChannelOrThrow(): ConfirmChannel {
    if (!this.channel) throw new Error("Channel not initialized. Did you call connect/ensureReady?");
    return this.channel;
  }

  async publish(payload: unknown, options?: PublishOptions): Promise<PublishResult[]> {
    const channel = this.getChannelOrThrow();
    const routingKeys = Array.isArray(options?.routingKey) ? options.routingKey : [options?.routingKey ?? this.routingKey];
    const buffer = this.serializer.buffer(payload);
    const contentType = options?.contentTypeOverride ?? this.serializer.contentType();
    const persistent = options?.persistent ?? true;

    const propsBase: Options.Publish = {
      contentType,
      deliveryMode: persistent ? 2 : undefined,
      timestamp: Date.now(),
      headers: options?.headers,
      appId: options?.appId,
      correlationId: options?.correlationId,
      expiration: typeof options?.expirationMs === "number" ? String(options.expirationMs) : undefined,
    };

    const results: PublishResult[] = [];

    for (const routingKey of routingKeys) {
      const messageId = uuidv4();
      const props: Options.Publish = { ...propsBase, messageId };

      let returned = false;
      const onReturn = (msg: any) => {
        if (msg?.properties?.messageId === messageId) {
          returned = true;
          channel.removeListener("return", onReturn);
        }
      };
      channel.on("return", onReturn);

      const published = channel.publish(this.exchange.name, routingKey, buffer, {
        mandatory: this.mandatory,
        ...props,
      });

      if (!published) {
        await new Promise<void>((resolve) => channel.once("drain", resolve));
      }

      if (this.confirm) {
        await channel.waitForConfirms();
      }

      channel.removeListener("return", onReturn);

      results.push({
        messageId,
        routed: !returned,
        confirmed: this.confirm,
      });
    }

    return results;
  }
}
