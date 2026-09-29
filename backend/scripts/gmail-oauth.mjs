import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const redirectUri = "http://127.0.0.1:53682/oauth2callback";
const scope = "https://www.googleapis.com/auth/gmail.send";
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET, then run this again.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end();
    return;
  }
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(error || "Missing code");
    server.close();
    process.exit(1);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await tokenResponse.json();
  if (!token.refresh_token) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end(token.error_description || "Google did not return a refresh token.");
    console.error(token);
    server.close();
    process.exit(1);
  }

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".gmail-oauth.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        GMAIL_CLIENT_ID: clientId,
        GMAIL_CLIENT_SECRET: clientSecret,
        GMAIL_REFRESH_TOKEN: token.refresh_token,
      },
      null,
      2,
    ),
  );
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("PadosiPro can send mail. You can close this tab.");
  console.log(`Saved refresh token to ${out}`);
  server.close();
});

server.listen(53682, "127.0.0.1", () => {
  console.log(authUrl.toString());
});
