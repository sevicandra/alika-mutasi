import axios from "axios";
import { alikaConfig } from "@/config/alika.config";
import jwkToPem from "jwk-to-pem";

export class AlikaService {
  private static publicKey: string | null = null;
  private static publicKeyExpiration: number = 0;
  static async getPublicKey() {
    try {
      const currentTime = Date.now() / 1000;
      if (this.publicKey && currentTime < this.publicKeyExpiration) {
        return this.publicKey;
      }
      const response = await axios.get(
        `${alikaConfig.BASE_URI}/.well-known/jwks.json`
      );
      const jwk = response.data.keys[0];
      const pem = jwkToPem(jwk);
      this.publicKey = pem;
      this.publicKeyExpiration = currentTime + 3600;
      return this.publicKey;
    } catch (error) {
      console.error("Error getting public key:", error);
      throw new Error("Failed to get public key");
    }
  }
}
