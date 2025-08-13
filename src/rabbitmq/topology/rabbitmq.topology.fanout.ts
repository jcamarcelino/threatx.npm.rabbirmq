import { ConfirmChannel } from "amqplib";
import { ITopology } from "./rabbitmq.topology.interface";
import { ExchangeOptions, QueueOptions } from "../rabbitmq.types";
import { Logger } from "../rabbitmq.logger";

export class FanoutTopology implements ITopology {
  constructor(private readonly logger: Logger = console) {}

  async assert(channel: ConfirmChannel, exchange: ExchangeOptions, queue?: QueueOptions): Promise<void> {
    await channel.assertExchange(exchange.name, exchange.type, {
      durable: exchange.durable ?? true,
    });

    if (!queue) return;

    const dlx = {
      type: queue.deadLetter.type ?? "direct",
      durable: queue.deadLetter.durable ?? true,
      routingKey: queue.deadLetter.routingKey ?? "",
    };

    await channel.assertExchange(queue.deadLetter.exchange, dlx.type, {
      durable: true,
    });

    if (queue.deadLetter.queue) {
      await channel.assertQueue(queue.deadLetter.queue, {
        durable: dlx.durable,
      });
      await channel.bindQueue(queue.deadLetter.queue, queue.deadLetter.exchange, dlx.routingKey);
    }

    const args: Record<string, unknown> = {
      "x-dead-letter-exchange": queue.deadLetter.exchange,
    };
    if (dlx.routingKey) args["x-dead-letter-routing-key"] = dlx.routingKey;
    if (typeof queue.messageTtlMs === "number") args["x-message-ttl"] = queue.messageTtlMs;
    if (typeof queue.maxLength === "number") args["x-max-length"] = queue.maxLength;

    const opts = {
      durable: queue.type == "quorum" ? true : queue.durable ?? true,
      arguments: {
        "x-queue-type": queue.type ?? "classic",
        ...args,
      },
    };

    await channel.assertQueue(queue.name, opts);
    await channel.bindQueue(queue.name, exchange.name, "");

    this.logger.info("[Rabbit] fanout topology asserted", {
      exchange: exchange.name,
      queue: queue.name,
    });
  }
}
