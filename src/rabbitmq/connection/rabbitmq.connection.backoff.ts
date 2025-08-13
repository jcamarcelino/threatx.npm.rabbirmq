import { IExponentialBackoff } from "./rabbitmq.connection.backoff.interface";

export class ExponentialBackoff implements IExponentialBackoff {
  constructor(private readonly baseMs = 200, private readonly factor = 2, private readonly maxMs = 10_000, private readonly jitter = true) {}

  dalay(attempt: number): number {
    const raw = Math.min(this.baseMs * Math.pow(this.factor, Math.max(0, attempt - 1)), this.maxMs);
    if (!this.jitter) return raw;
    const delta = Math.random() * raw * 0.2; // ±20%
    return Math.max(0, Math.floor(raw - raw * 0.1 + delta));
  }

  reset(): void {
    /* noop */
  }
}
