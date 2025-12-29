const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

const KEY_PATH = path.join(__dirname, "..", "secrets", "oauth_client.json");
const raw = fs.readFileSync(KEY_PATH, "utf8");
const json = JSON.parse(raw);

const cfg = json.web || json.installed;
if (!cfg?.client_id || !cfg?.client_secret) {
  console.error("oauth_client.json içinde client_id/client_secret bulunamadı.");
  process.exit(1);
}

const CLIENT_ID = cfg.client_id;
const CLIENT_SECRET = cfg.client_secret;

const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n1) Bu URL'yi aç ve izin ver (ishgirisimselrad@gmail.com ile):\n");
console.log(authUrl);
console.log("\n2) Yönlendirme URL'sinden sadece code değerini al (script zaten temizliyor).\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("CODE (veya komple URL): ", async (input) => {
  const cleaned = input.trim().replace(/^code=/, "").split("code=")[1]?.split("&")[0]
    || input.trim().split("&")[0].replace(/^code=/, "");

  try {
    const { tokens } = await oauth2.getToken(cleaned);
    console.log("\nREFRESH TOKEN:\n", tokens.refresh_token);
  } catch (e) {
    console.error("\nHata:", e.message);
  } finally {
    rl.close();
  }
});
