import { ConfirmChannel, ConsumeMessage } from "amqplib";
import { RabbitConnection } from "../connection/rabbitmq.connection";
import { JsonSerializer, IMessageSerializer } from "../message/rabbitmq.message.index";
import { Logger } from "../rabbitmq.logger";
import { ExchangeOptions, QueueOptions } from "../rabbitmq.types";
import { ITopology, DirectTopology, FanoutTopology } from "../topology/rabbitmq.topology.index";

export interface ConsumerOptions {
  exchange: ExchangeOptions;
  queue: QueueOptions;
  routingKey?: string;
  prefetch?: number;
  autoAck?: boolean;
}

export class RabbitConsumer {
  private channel?: ConfirmChannel;
  private readonly topology: ITopology;

  constructor(
    private readonly connection: RabbitConnection,
    private readonly options: ConsumerOptions,
    private readonly logger: Logger = console,
    private readonly serializer: IMessageSerializer = new JsonSerializer()
  ) {
    this.topology = options.exchange.type === "fanout" ? new FanoutTopology(logger) : new DirectTopology(logger);
  }

  private getChannelOrThrow(): ConfirmChannel {
    if (!this.channel) throw new Error("Channel not initialized.");
    return this.channel;
  }

  async connect(): Promise<void> {
    await this.connection.connect();
    this.channel = this.connection.channel();
    if (!this.channel) throw new Error("Channel not available after connect()");

    const routingKey = this.options.routingKey ?? this.options.queue.routingKey ?? "";
    await this.topology.assert(this.channel, this.options.exchange, this.options.queue, routingKey);

    if (this.options.prefetch) {
      this.channel.prefetch(this.options.prefetch);
    }
  }

  async consume(handler: (msg: unknown, raw: ConsumeMessage) => Promise<void>): Promise<void> {
    const channel = this.getChannelOrThrow();
    const { queue } = this.options;

    await channel.consume(
      queue.name,
      async (msg) => {
        if (!msg) return;

        try {
          const payload = this.serializer.parse(msg.content);
          await handler(payload, msg);

          if (!this.options.autoAck) {
            channel.ack(msg);
          }
        } catch (err) {
          this.logger.error("[Rabbit] Error processing message", err);
          if (!this.options.autoAck) {
            channel.nack(msg, false, false); // dead-letter
          }
        }
      },
      { noAck: this.options.autoAck ?? false }
    );
  }
}
