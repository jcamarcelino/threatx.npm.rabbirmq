import { ConfirmChannel } from "amqplib";
import { ITopology } from "./rabbitmq.topology.interface";
import { ExchangeOptions, QueueOptions } from "../rabbitmq.types";
import { Logger } from "../rabbitmq.logger";

export class FanoutTopology implements ITopology {
  constructor(private readonly logger: Logger = console) {}

  async assert(channel: ConfirmChannel, exchange: ExchangeOptions, queue?: QueueOptions): Promise<void> {
    // Exchange do tipo fanout
    await channel.assertExchange(exchange.name, exchange.type, {
      durable: exchange.durable ?? true,
    });

    if (!queue) return;

    const dlxType = queue.deadLetter.type ?? "direct";
    const dlqDurable = queue.deadLetter.durable ?? true;
    const dlqRoutingKey = queue.deadLetter.routingKey ?? "";

    // DLX
    await channel.assertExchange(queue.deadLetter.exchange, dlxType, {
      durable: true,
    });

    // DLQ (opcional)
    if (queue.deadLetter.queue) {
      await channel.assertQueue(queue.deadLetter.queue, {
        durable: dlqDurable,
      });
      await channel.bindQueue(queue.deadLetter.queue, queue.deadLetter.exchange, dlqRoutingKey);
    }

    // Args da fila principal
    const args: Record<string, unknown> = {
      "x-dead-letter-exchange": queue.deadLetter.exchange,
    };
    if (dlqRoutingKey) args["x-dead-letter-routing-key"] = dlqRoutingKey;
    if (typeof queue.messageTtlMs === "number") args["x-message-ttl"] = queue.messageTtlMs;
    if (typeof queue.maxLength === "number") args["x-max-length"] = queue.maxLength;

    // Fila principal
    await channel.assertQueue(queue.name, {
      durable: queue.durable ?? true,
      arguments: args,
    });

    // Binding da fila ao exchange fanout (sem routingKey)
    await channel.bindQueue(queue.name, exchange.name, "");

    this.logger.info("[Rabbit] fanout topology asserted", {
      exchange: exchange.name,
      queue: queue.name,
    });
  }
}
