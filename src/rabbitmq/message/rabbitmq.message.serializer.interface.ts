export interface IMessageSerializer {
  buffer(payload: unknown): Buffer;
  parse(buffer: Buffer): unknown;
  contentType(): string;
}
