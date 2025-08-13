import { ConfirmChannel } from "amqplib";
import { ExchangeOptions, QueueOptions } from "../rabbitmq.types";
export interface ITopology {
  assert(channel: ConfirmChannel, exchange: ExchangeOptions, queue?: QueueOptions, routingKey?: string | string[]): Promise<void>;
}
