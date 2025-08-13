export interface IExponentialBackoff {
  dalay(attempt: number): number;
  reset(): void;
}
