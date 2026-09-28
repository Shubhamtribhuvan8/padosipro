# Design

## Architecture

The phone app is an Expo React Native client for Android and iOS. It talks only to this repository's Express API. SQLite (`node:sqlite`) keeps users, OTP rows, profiles, the service catalogue, and requests in one file.

Sign-in is mobile number plus email, then a 6-digit email code. There is no password. The JWT (7 days) is stored in Expo SecureStore on device, and in localStorage when the same UI is opened on the web. OTP codes are random 6-digit values; the database stores a SHA-256 hash with a server pepper, never the code. A code lasts 10 minutes, accepts 5 wrong attempts, is single use, and cannot be resent for 30 seconds.

After the code is accepted the client opens home. A request is a category, a service, an urgency (Standard, Same day, Express, or Scheduled), and a short note. Home lists those requests. Account can save a name, address, and an optional business name. The mobile number is already collected at sign-in.

Mail goes out through Nodemailer. `EMAIL_*` and `SMTP_*` are the same settings. Gmail is used when `EMAIL_USER` is set. Docker Compose sends mail to Mailpit instead. If SMTP is unreachable, the API still completes sign-in setup and prints the code in the server log so the demo can continue.

## Trade-offs

The original brief asked for email and password. The public portal, and this build, use mobile plus email and a passwordless code, because that is the account flow people actually see.

Business name is optional. A household that is not a business should not be blocked. Address can be filled in later on the account screen; the Lifestyle Manager already has the mobile number from sign-in.

SQLite is the demo database instead of PostgreSQL so there is no extra service to install. The catalogue is seeded in code: 16 categories and their services, including the groups marked Soon. Descriptions are written for this demo.

Colour and type follow the portal: cream `#FAFAF7`, ink `#101828`, muted `#667085`, green `#155C49`. The proprietary typeface is not copied; Manrope is the stand-in. The mark in the app is the supplied PadosiPro logo.

## Left out

Household members, wallet top-up, and live chat with the Lifestyle Manager are shown as coming soon, matching the portal. Push notifications, refresh-token rotation, and a second mail provider are not in this build. Railway's hobby plan blocks outbound SMTP, so production email delivery needs a host that allows port 465.
