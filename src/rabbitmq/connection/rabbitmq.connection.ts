import amqp, { Connection, ConfirmChannel, ChannelModel } from "amqplib";
import { IExponentialBackoff } from "./rabbitmq.connection.backoff.interface";
import { Logger } from "../rabbitmq.logger";
import { ExponentialBackoff } from "./rabbitmq.connection.backoff";

export class RabbitConnection {
  private connection?: ChannelModel;
  private _channel?: ConfirmChannel;

  constructor(
    private readonly uri: string,
    private readonly backoff: IExponentialBackoff = new ExponentialBackoff(),
    private readonly logger: Logger = console,
    private readonly retries = 5
  ) {}

  channel(): ConfirmChannel | undefined {
    return this._channel;
  }

  async connect(): Promise<void> {
    if (this.connection && this._channel) return;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        this.connection = await amqp.connect(this.uri);
        this.connection.on("error", (err) => this.logger.error("[Rabbit] connection error", err));
        this.connection.on("close", () => {
          this.logger.warn("[Rabbit] connection closed");
          this._channel = undefined;
          this.connection = undefined;
        });

        this._channel = await this.connection.createConfirmChannel();
        this._channel.on("error", (err) => this.logger.error("[Rabbit] channel error", err));
        this._channel.on("close", () => this.logger.warn("[Rabbit] channel closed"));

        this.logger.info("[Rabbit] connected & confirm channel created");
        return;
      } catch (err) {
        const delay = this.backoff.dalay(attempt);
        this.logger.warn(`[Rabbit] connect attempt ${attempt}/${this.retries} failed. Retrying in ${delay}ms`, err);
        if (attempt < this.retries) await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error("[Rabbit] Could not connect after max attempts");
  }

  async close(): Promise<void> {
    try {
      await this._channel?.close();
    } catch {}
    try {
      await this.connection?.close();
    } catch {}
    this._channel = undefined;
    this.connection = undefined;
    this.logger.info("[Rabbit] closed");
  }
}
