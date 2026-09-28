import dotenv from "dotenv";
import { createApp } from "./app.js";
import { assertConfig, loadConfig } from "./config.js";
import { openDatabase } from "./db.js";
import { createMailer } from "./mail.js";

dotenv.config();

const config = loadConfig();
assertConfig(config);
const db = openDatabase(config.databasePath);
const mailer = createMailer({ config });
const app = createApp({ db, config, mailer });

app.listen(config.port, () => {
  const delivery = config.smtpHost
    ? `SMTP ${config.smtpHost}:${config.smtpPort}`
    : `local outbox ${config.outboxDir} (OTP also printed below when a code is sent)`;
  console.log(`PadosiPro API listening on http://localhost:${config.port}`);
  console.log(`Mail: ${delivery}`);
});
