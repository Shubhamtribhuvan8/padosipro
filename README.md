# PadosiPro

A native household app for the PadosiPro request journey: sign in with an Indian mobile number and email, confirm a 6-digit email code, then ask for help. The mobile UI is React Native (Expo) for Android and iOS. The API is Node.js and Express with SQLite. The live site at app.padosipro.com is a visual reference only. This project does not call that API.

## What you get

- Account creation and login with mobile (+91, 10 digits) and email. There is no password.
- A 6-digit email code, valid for 10 minutes, single use, at most 5 wrong attempts, and a 30-second resend wait. Only a hash of the code is stored.
- Real email. Locally this uses the Gmail SMTP settings in `backend/.env`, or Mailpit when you run Docker. The hosted API sends through the Gmail HTTPS API, because Railway's hobby plan blocks SMTP.
- Home, then a request: category, service, urgency, a short note, and confirmation.
- Sixteen categories and their services, including the ones marked Soon.
- Account: name, address, and an optional business name. Business name is optional because many households are not a business. The mobile number is already collected at sign-in.

## Prerequisites

- Node.js 22 or newer (the API uses the built-in `node:sqlite` module)
- npm
- Expo Go on a phone, or Android Studio / Xcode for an emulator
- Docker, only if you want the one-command stack with Mailpit

## Run the API

From the repository root:

```bash
cd backend
cp .env.example .env
npm install
npm test
npm start
```

The API listens on http://localhost:4000.

With `SMTP_HOST` left empty, each verification code is printed in the API terminal and saved under `backend/outbox/`. That is the local mail catcher for a demo without Docker.

### One command with Docker

From the repository root:

```bash
docker compose up --build
```

- API: http://localhost:4000
- Mailpit inbox: http://localhost:8025

Docker sets `NODE_ENV=production` and sends mail to Mailpit, so the code is in the Mailpit UI rather than the API log. Change `JWT_SECRET` and `OTP_PEPPER` in `docker-compose.yml` before any shared deployment.

## Run the app

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the machine the phone can reach:

| Where the app runs | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Android emulator | `http://10.0.2.2:4000` |
| iOS simulator | `http://localhost:4000` |
| Physical phone on the same Wi-Fi | `http://<your-lan-ip>:4000` |

Restart Expo after changing `.env`. The Android package allows cleartext HTTP so a local demo API works. Do not ship that setting against a public server.

In Expo Go, scan the QR code. Press `a` for an Android emulator or `i` for the iOS simulator (macOS only).

A browser preview of the same UI is available with `npx expo start --web`. Point it at `http://localhost:4000` (the default on web and the iOS simulator).

### Flow to try

1. Enter a 10-digit mobile number and email, then tap Get OTP. With Gmail configured, the code arrives by email. Otherwise read it from the API log, `backend/outbox/`, or Mailpit.
2. Enter the code. The eye on the field shows or hides the digits. Wrong codes show the attempts left. After 5 failures, request a new code. Resend waits 30 seconds. Codes expire after 10 minutes.
3. You land on home. Pick a category and a service, choose Standard, Same day, Express, or Scheduled, add a note, and send the request.
4. Open the request from home, or the account screen for name, address, and an optional business name.
5. Sign out and open the app again. The same mobile and email, plus a new code, signs you back in.

## Build an Android APK

An IPA needs a Mac and a paid Apple Developer account. Android is enough for review.

Cloud build (Expo account required):

```bash
cd mobile
npx eas-cli login
npx eas-cli build -p android --profile preview
```

`eas.json` sets `buildType` to `apk`, so the artifact is an installable APK rather than an AAB.

Local build (Android SDK, JDK 17+, and `ANDROID_HOME` required):

```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK is written to `mobile/android/app/build/outputs/apk/release/`. Before a release build, put the LAN or public API URL in `mobile/.env` as `EXPO_PUBLIC_API_URL`, because a release binary cannot reach `localhost` on your computer unless you planned for that.

## Environment

See `backend/.env.example` and `mobile/.env.example`. Do not commit real secrets. Development defaults exist only so `npm start` works before you copy the example file. Production mode refuses to boot without `JWT_SECRET` and `OTP_PEPPER`.

## Tests

```bash
cd backend && npm test
```

Covers OTP hashing, expiry, the 5-attempt lock, the 30-second resend cooldown, phone-and-email sign-in, and saving a request.

The preview APK talks to `https://padosipro-api-production.up.railway.app`. That host blocks outbound SMTP on the hobby plan, so production does not connect to `smtp.gmail.com`. It sends through the Gmail API over HTTPS when `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN` are set on the service. Those values stay out of git. Local Gmail SMTP and Mailpit are unchanged. A code is printed in the API log only when no mail transport is configured, or when the send itself fails.
