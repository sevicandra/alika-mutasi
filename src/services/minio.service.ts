import { minioClient, minioConfig } from "../config/minio.config";

export class MinioService {
  public async uploadFile(file: any, fileName: string) {
    try {
      const result = await minioClient.putObject(
        minioConfig.bucket,
        fileName,
        file
      );
      return result;
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        const code = (error as any).code;
        switch (code) {
          case "NoSuchKey":
            console.error("Object not found in MinIO");
            throw new Error("Object not found in MinIO");
            break;
          case "AccessDenied":
            console.error("Permission denied");
            throw new Error("Permission denied");
            break;
          default:
            console.error("Unhandled MinIO error:", code);
            throw new Error("Unhandled MinIO error: " + code);
        }
      } else {
        console.error("Unknown error occurred:", error);
        throw new Error("Unknown error occurred: " + error);
      }
    }
  }

  public async downloadFile(fileName: string) {
    try {
      const result = await minioClient.getObject(minioConfig.bucket, fileName);
      return result;
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        const code = (error as any).code;
        switch (code) {
          case "NoSuchKey":
            console.error("Object not found in MinIO");
            throw new Error("Object not found in MinIO");
            break;
          case "AccessDenied":
            console.error("Permission denied");
            throw new Error("Permission denied");
            break;
          default:
            console.error("Unhandled MinIO error:", code);
            throw new Error("Unhandled MinIO error: " + code);
        }
      } else {
        console.error("Unknown error occurred:", error);
        throw new Error("Unknown error occurred: " + error);
      }
    }
  }

  public async deleteFile(fileName: string) {
    try {
      const result = await minioClient.removeObject(
        minioConfig.bucket,
        fileName
      );
      return result;
    } catch (error: unknown) {
      if (error instanceof Error && "code" in error) {
        const code = (error as any).code;
        switch (code) {
          case "NoSuchKey":
            console.error("Object not found in MinIO");
            break;
          case "AccessDenied":
            console.error("Permission denied");
            break;
          default:
            console.error("Unhandled MinIO error:", code);
        }
      } else {
        console.error("Unknown error occurred:", error);
      }
    }
  }
}
