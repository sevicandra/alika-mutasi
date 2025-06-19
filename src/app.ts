import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";
import router from "./routes";
import logger from "morgan";
import { appConfig } from "@/config/app.config";
import  redisClient  from "@/config/redis.config";
import "./register-alias";
import methodOverride from "method-override";
dotenv.config();
const port = appConfig.port;
const publicPath = path.join(__dirname, "../public");
const app = express();
redisClient.connect();
app.use(express.json());
app.use(logger("dev"));
app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(publicPath));
app.use(methodOverride("_method"));

app.use("/", router)

app.listen(port, () => {
  console.log(`${appConfig.name} Server is up on port ${port}`);
});

export default app;