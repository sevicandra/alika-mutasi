import dotenv from "dotenv";
import fs from "fs";
import { Client } from "minio";
dotenv.config();

export const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || "",
  port: parseInt(process.env.MINIO_PORT || "0"),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY_FILE
    ? fs.readFileSync(process.env.MINIO_ACCESS_KEY_FILE, "utf8").trim()
    : (process.env.MINIO_ACCESS_KEY as string),
  secretKey: process.env.MINIO_SECRET_KEY_FILE
    ? fs.readFileSync(process.env.MINIO_SECRET_KEY_FILE, "utf8").trim()
    : (process.env.MINIO_SECRET_KEY as string),
  bucket: process.env.MINIO_BUCKET || "",
};

export const minioClient = new Client({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: false,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey,
});
