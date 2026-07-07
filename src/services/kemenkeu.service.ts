import axios from "axios";
import { redisService } from "@/services/redis-service";
import logger from "@/utils/Logger.utils";
import {
  AuthenticationError,
  ExternalServiceError,
  NotFoundError,
  TimeoutError,
} from "@/utils/errors";
import { appConfig } from "@/config/app.config";
import { ServiceKemenkeuConfig } from "@/config/serviceKemenkeu.config";
import { Keluarga, Profile, Profile2 } from "@/types/serviceKemenkeu";

const API_TIMEOUT = 5000;

export class KemenkeuService {
  private static token: string | null = null;
  private static tokenExpiration: number = 0;
  static async getAccessToken(): Promise<string> {
    const currentTime = Date.now() / 1000;
    if (this.token && currentTime < this.tokenExpiration) {
      return this.token;
    }
    try {
      const response = await axios.postForm(
        ServiceKemenkeuConfig.TOKEN_URI,
        {
          grant_type: ServiceKemenkeuConfig.GRANT_TYPE,
          client_id: ServiceKemenkeuConfig.CLIENT_ID,
          client_secret: ServiceKemenkeuConfig.CLIENT_SECRET,
          scope: ServiceKemenkeuConfig.SCOPE,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.token = response.data.access_token as string;
      this.tokenExpiration = currentTime + response.data.expires_in;
      return this.token;
    } catch (error) {
      console.error("Error requesting OAuth2 token:", error);
      throw new Error("Failed to get access token");
    }
  }

  static async getProfil({ nip }: { nip: string }): Promise<Profile> {
    try {
      const cacheKey = `${appConfig.NAME}:KemenkeuService:Profil:${nip}`;
      const cachedProfil = await redisService.get<Profile>(cacheKey);
      if (cachedProfil) {
        return cachedProfil;
      }

      const response = await axios.get(
        `${ServiceKemenkeuConfig.BASE_URI}/hris/profil/Pegawai/GetByNip/${nip}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          timeout: API_TIMEOUT,
        }
      );

      if (!response.data?.Data) {
        throw new ExternalServiceError("KemenkeuService", "Invalid Profil response format");
      }

      const profil = response.data.Data as Profile;

      await redisService.set(cacheKey, profil, 60 * 60);

      return profil;
    } catch (error) {
      if (
        error instanceof ExternalServiceError ||
        error instanceof TimeoutError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          logger.error("Profil API timeout", { nip });
          throw new TimeoutError("Kemenkeu Profil Service");
        }
        if (error.response?.status === 404) {
          logger.warn("Profil not found", { nip });
          throw new NotFoundError(`Profile for NIP: ${nip}`);
        }
      }

      logger.error("Failed to get Profil from Kemenkeu", {
        nip,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ExternalServiceError("KemenkeuService", "Failed to get Profil");
    }
  }

  static async getKeluarga({ nip }: { nip: string }): Promise<Keluarga[]> {
    try {
      const cacheKey = `${appConfig.NAME}:KemenkeuService:Keluarga:${nip}`;
      const cachedKeluarga = await redisService.get<Keluarga[]>(cacheKey);
      if (cachedKeluarga) {
        return cachedKeluarga;
      }

      const response = await axios.get(
        `${ServiceKemenkeuConfig.BASE_URI}/hris/keluarga/Riwayat/GetKeluargaByNip/${nip}?limit=0`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          timeout: API_TIMEOUT,
        }
      );

      if (!response.data?.Data) {
        throw new ExternalServiceError("KemenkeuService", "Invalid Keluarga response format");
      }

      const keluarga = response.data.Data as Keluarga[];

      await redisService.set(cacheKey, keluarga, 60 * 60);

      return keluarga;
    } catch (error) {
      if (
        error instanceof ExternalServiceError ||
        error instanceof TimeoutError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        logger.error("Keluarga API timeout", { nip });
        throw new TimeoutError("Kemenkeu Keluarga Service");
      }

      logger.error("Failed to get Keluarga from Kemenkeu", {
        nip,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ExternalServiceError("KemenkeuService", "Failed to get Keluarga");
    }
  }

  static async getProfilHris2({ nip }: { nip: string }): Promise<Profile2> {
    try {
      const cacheKey = `${appConfig.NAME}:KemenkeuService:Profil2:${nip}`;
      const cachedProfil = await redisService.get<Profile2>(cacheKey);
      if (cachedProfil) {
        return cachedProfil;
      }

      const response = await axios.get(
        `${ServiceKemenkeuConfig.BASE_URI2}/HrisProfil/2.0/api/Profile/GetPegawai?nip=${nip}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          timeout: API_TIMEOUT,
        }
      );

      if (!response.data?.data) {
        throw new ExternalServiceError("KemenkeuService", "Invalid Profil2 response format");
      }

      const profil = response.data.data as Profile2;

      await redisService.set(cacheKey, profil, 60 * 60);

      return profil;
    } catch (error) {
      if (
        error instanceof ExternalServiceError ||
        error instanceof TimeoutError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        logger.error("Profil2 API timeout", { nip });
        throw new TimeoutError("Kemenkeu Profil2 Service");
      }

      logger.error("Failed to get Profil2 from Kemenkeu", {
        nip,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ExternalServiceError("KemenkeuService", "Failed to get Profil");
    }
  }

  static async getDaftarPegawai({ kdsatker }: { kdsatker: string }): Promise<Profile[]> {
    try {
      const cacheKey = `${appConfig.NAME}:KemenkeuService:DaftarPegawai:${kdsatker}`;
      const cachedDaftarPegawai = await redisService.get<Profile[]>(cacheKey);
      if (cachedDaftarPegawai) {
        return cachedDaftarPegawai;
      }
      const response = await axios.get(
        `${ServiceKemenkeuConfig.BASE_URI}/hris/profil/pegawai/getByKodeSatker?kdSatker=${kdsatker}`,
        {
          headers: {
            Authorization: `Bearer ${await this.getAccessToken()}`,
          },
          timeout: API_TIMEOUT,
        }
      );

      if (!response.data?.Data) {
        throw new ExternalServiceError("KemenkeuService", "Invalid Profil response format");
      }

      const profil = response.data.Data as Profile[];

      await redisService.set(cacheKey, profil, 60 * 60);

      return profil;
    } catch (error) {
      if (
        error instanceof ExternalServiceError ||
        error instanceof TimeoutError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        logger.error("Daftar Pegawai API timeout", { kdsatker });
        throw new TimeoutError("Kemenkeu Daftar Pegawai Service");
      }

      logger.error("Failed to get Daftar Pegawai from Kemenkeu", {
        kdsatker,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ExternalServiceError("KemenkeuService", "Failed to get Profil");
    }
  }
}
