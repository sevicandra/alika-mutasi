import { v4, v7 } from "uuid";

export class UUID {
  static v4(): string {
    return v4();
  }

  static v7(): string {
    return v7();
  }
}
