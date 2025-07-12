import fs from "fs";
export const eSignConfig = {
  BASE_URI: process.env.ESIGN_URI || "",
  CLIENT_ID: process.env.ESIGN_AUTH_ID_FILE
    ? fs.readFileSync(process.env.ESIGN_AUTH_ID_FILE, "utf8").trim()
    : process.env.ESIGN_AUTH_ID || "",
  CLIENT_PASSWORD: process.env.ESIGN_AUTH_PASSWORD_FILE
    ? fs.readFileSync(process.env.ESIGN_AUTH_PASSWORD_FILE, "utf8").trim()
    : process.env.ESIGN_AUTH_PASSWORD || "",
};
