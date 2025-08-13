export type ExchangeType = "direct" | "topic" | "fanout" | "headers";

export interface ExchangeOptions {
  name: string;
  type: ExchangeType;
  durable?: boolean;
  routeless_exchange?: string;
}

export interface DeadLetterOptions {
  exchange: string;
  type?: ExchangeType; // default 'direct'
  queue?: string; // recomendado
  routingKey?: string; // default: routingKey principal
  durable?: boolean;
}

export interface QueueOptions {
  name: string;
  durable?: boolean;
  routingKey?: string | string[];
  messageTtlMs?: number;
  maxLength?: number;
  deadLetter: DeadLetterOptions;
}

export interface PublisherOptions {
  exchange: ExchangeOptions;
  routingKey?: string | string[];
  queues?: QueueOptions[]; // opcional: assert topologia
  confirm?: boolean; // default: true
  mandatory?: boolean; // default: true
  connectRetries?: number; // default: 5
}

export interface PublishOptions {
  routingKey?: string;
  expirationMs?: number;
  persistent?: boolean; // default: true
  headers?: Record<string, unknown>;
  appId?: string;
  correlationId?: string;
  contentTypeOverride?: string; // se quiser forçar
}

export interface PublishResult {
  messageId: string;
  routed: boolean; // false quando 'returned' (unroutable) com mandatory=true
  confirmed: boolean; // true quando waitForConfirms conclui
}
