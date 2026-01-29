import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

interface appConfigInterface {
  NAME: string;
  ENV: "development" | "production" | "test";
  URL: string;
  PORT: number;
  VERSION: string;
  TIMEZONE: string;
  LOCALE: string;
  LEVEL_LOG: string;
}

const envSchema = z.object({
  NAME: z.string().min(1).default("alika"),
  ENV: z.enum(["development", "production", "test"]).default("development"),
  URL: z.string().min(1),
  PORT: z.number().min(1).max(65535).default(3000),
  VERSION: z.string().min(1).default("1.0.0"),
  TIMEZONE: z.string().min(1).default("Asia/Jakarta"),
  LOCALE: z.string().min(1).default("id"),
  LEVEL_LOG: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
});

let config: appConfigInterface;
try {
  config = envSchema.parse({
    NAME: process.env.APP_NAME,
    ENV: process.env.NODE_ENV,
    URL: process.env.APP_URL,
    PORT: process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000,
    VERSION: process.env.VERSION,
    TIMEZONE: process.env.TIMEZONE,
    LOCALE: process.env.LOCALE,
    LEVEL_LOG: process.env.LEVEL_LOG,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Environment configuration error:");
    error.issues.forEach((err) => {
      console.error(`  - ${err.path}: ${err.message}`);
    });
  }
  process.exit(1);
}

const appConfig = config;

export { appConfig };
