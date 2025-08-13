import { ConfirmChannel } from "amqplib";
import { ITopology } from "./rabbitmq.topology.interface";
import { ExchangeOptions, QueueOptions } from "../rabbitmq.types";
import { Logger } from "../rabbitmq.logger";

export class DirectTopology implements ITopology {
  constructor(private readonly logger: Logger = console) {}

  async assert(channel: ConfirmChannel, exchange: ExchangeOptions, queue?: QueueOptions, routingKey: string | string[] = ""): Promise<void> {
    // Exchange principal
    const _args: Record<string, unknown> = {};
    if (exchange.routeless_exchange) {
      _args["routeless-exchange"] = exchange.routeless_exchange;
    }
    await channel.assertExchange(exchange.name, exchange.type, {
      durable: exchange.durable ?? true,
      arguments: Object.keys(_args).length ? _args : undefined,
    });

    if (!queue) return;

    const dlxType = queue.deadLetter.type ?? "direct";
    const dlqDurable = queue.deadLetter.durable ?? true;
    const dlqRoutingKey = queue.deadLetter.routingKey ?? (Array.isArray(routingKey) ? routingKey[0] : routingKey);

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

    // Binding da fila principal ao exchange com múltiplos routingKeys
    const keys = Array.isArray(routingKey) ? routingKey : [routingKey];
    for (const key of keys) {
      await channel.bindQueue(queue.name, exchange.name, key);
    }

    this.logger.info("[Rabbit] topology asserted", {
      exchange: exchange.name,
      queue: queue.name,
      routingKeys: keys,
    });
  }
}
