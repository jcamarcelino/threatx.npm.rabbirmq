import { IMessageSerializer } from "./rabbitmq.message.serializer.interface";

export class JsonSerializer implements IMessageSerializer {
  buffer(payload: unknown): Buffer {
    if (Buffer.isBuffer(payload)) return payload;
    return Buffer.from(JSON.stringify(payload));
  }

  contentType(): string {
    return "application/json";
  }

  parse(buffer: Buffer): unknown {
    return JSON.parse(buffer.toString());
  }
}
