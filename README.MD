# Gym & Membership Management System (GHM)

A REST API for managing gym operations, memberships, payments, staff, trainers, attendance, and training sessions. The backend is built with **Node.js**, **Express 5**, and **MongoDB/Mongoose**.

The repository's implementation includes role-protected API routes, JWT authentication, membership purchase and renewal workflows, staff payment review, trainer session management, member gym-pass generation, and scheduled membership expiry/reminder processing.

> **Project status:** This README documents the backend code in this repository. It does not claim that a frontend, physical turnstile integration, or payment-provider API integration is included.

## Contents

- [Features](#features)
- [Roles and access](#roles-and-access)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Data models](#data-models)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database seeding](#database-seeding)
- [Scheduled membership maintenance](#scheduled-membership-maintenance)
- [Security notes](#security-notes)
- [Available scripts](#available-scripts)
- [Known implementation notes](#known-implementation-notes)
- [Contributing](#contributing)
- [License](#license)

## Features

### Authentication and accounts

- Member registration and login.
- JWT authentication using either the `token` cookie or an `Authorization: Bearer <token>` header.
- Logout endpoint that clears the authentication cookie.
- Role-based authorization for member, staff, trainer, and admin areas.
- Rate limits for login, registration, check-in, and general API traffic.

### Memberships and payments

- Public listing of available membership plans.
- Member purchase requests and renewal requests.
- Payment review by staff: approve, decline, and mark refunds as completed.
- Member payment history and subscription listing.
- Membership freeze and resume operations.
- Membership status values include `active`, `expired`, `frozen`, `pending`, `upcoming`, and `cancelled`.

### Gym operations

- Admin management of training programs, shifts, and membership plans.
- Staff member-account creation and manual attendance check-in.
- Attendance retrieval for a specified date.
- Member attendance history.
- Member gym-pass QR token generation.

### Trainer operations

- View assigned shifts.
- View today's sessions.
- Update session information, including status and workout-related fields supported by the service/model.

### Feedback and notifications

- Members can submit feedback.
- Admins can retrieve feedback records.
- Email notifications for membership expiry and upcoming expiry reminders, using Nodemailer.

## Roles and access

The API applies role checks in the route layer.

| Role      | Access                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `member`  | Member profile, plans, subscriptions, payments, gym pass, attendance, membership freeze/resume, and feedback |
| `staff`   | Member account creation, payment review, refunds, manual check-in, and attendance lookup                     |
| `trainer` | Assigned shifts and sessions                                                                                 |
| `admin`   | Admin management endpoints; also admitted to member, staff, and trainer route groups                         |

Registration is exposed at `POST /api/auth/register`. The account role and profile data are validated by the registration validators and service layer. Do not assume public registration grants administrative privileges.

## Technology stack

| Area                | Technology                                               |
| ------------------- | -------------------------------------------------------- |
| Runtime             | Node.js                                                  |
| HTTP framework      | Express 5                                                |
| Database / ODM      | MongoDB, Mongoose                                        |
| Authentication      | Passport.js, passport-jwt, JSON Web Tokens               |
| Password hashing    | bcryptjs                                                 |
| Sessions package    | express-session, connect-mongo (listed dependencies)     |
| Security middleware | Helmet, express-rate-limit                               |
| Validation          | express-validator                                        |
| HTTP logging        | Morgan                                                   |
| Cookies / CORS      | cookie-parser, cors                                      |
| Scheduled jobs      | node-cron                                                |
| Email               | Nodemailer                                               |
| Development         | Nodemon, ESLint                                          |
| Tests               | Node.js test runner command configured in `package.json` |

## Architecture

The application follows a layered Express structure:

1. **Routes** define URL paths, HTTP methods, authentication, role checks, and validation middleware.
2. **Controllers** handle HTTP request/response behavior.
3. **Services** contain business operations and database interactions.
4. **Mongoose models** define MongoDB collections, fields, validation, indexes, and relationships.
5. **Middleware and utilities** provide authentication, error handling, token helpers, email delivery, and shared functions.

The application is mounted under `/api`. The server connects to MongoDB, runs the seed routine, starts the HTTP listener, and starts the scheduled membership job.

## Project structure

```text
GHM/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   ├── email.js
│   │   ├── env.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── members.controller.js
│   │   ├── staff.controller.js
│   │   └── trainer.controller.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── migrations/             # Mongoose model definitions
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.router.js
│   │   ├── index.js
│   │   ├── member.routes.js
│   │   ├── staff.routes.js
│   │   └── trainer.routes.js
│   ├── schedule/
│   │   └── updatepurchases.js
│   ├── seed/
│   │   └── databse.seed.js
│   ├── services/
│   ├── utils/
│   ├── validator/
│   ├── app.js
│   └── server.js
├── .env.example
├── eslint.config.js
├── package-lock.json
├── package.json
└── README.MD
```

## Data models

The Mongoose models currently defined in `src/migrations/` are:

| Model / collection                           | Purpose                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `Users` (`users`)                            | Shared identity, credentials, contact information, and role             |
| `Member` (`members`)                         | Member profile linked to a user                                         |
| `Staff` (`staff`)                            | Staff profile linked to a user                                          |
| `Trainer` (`trainers`)                       | Trainer profile, specialization, experience, and employment details     |
| `Training` (`trainings`)                     | Training title, category, description, and level                        |
| `Shifts` (`shifts`)                          | Trainer assignment, room, period, days, times, and capacity             |
| `MembershipPlans` (`membershipplans`)        | Plan tier, price, duration, and optional training/shift references      |
| `Payments` (`payments`)                      | Payment request, transaction reference, method, status, and reviewer    |
| `MembershipPurchase` (`membershippurchases`) | Member plan purchase, dates, status, freeze data, and payment reference |
| `Checkins` (`chekins`)                       | Attendance check-in timestamps                                          |
| `Sessions` (`sessions`)                      | Member/trainer session, schedule, status, calories, and notes           |
| `Feedbacks` (`feedbacks`)                    | Member-submitted feedback                                               |

### Membership plan tiers

The plan schema accepts these tier values:

- `normal`
- `vip`
- `vvip`

The plan model stores a title, description, duration in days, price, and optional references to a training program and shift. A plan also has an `isActive` flag.

### Payment methods and statuses

Payment methods accepted by the payment schema are `CBE`, `BOA`, `Dashen`, `teleBirr`, and `manual`.

Payment statuses include `pending`, `processing`, `verified`, `failed`, `cancelled`, `refund_pending`, and `refunded`.

**Important:** The code records and reviews payment information. The presence of bank/mobile-money method names does not mean the repository integrates directly with those providers' payment APIs.

## API reference

All endpoints are prefixed with `/api`. Endpoints under `/member`, `/staff`, `/admin`, and `/trainer` require authentication and the role described above.

### Health and identity

| Method | Endpoint             | Access               | Description                                             |
| ------ | -------------------- | -------------------- | ------------------------------------------------------- |
| `GET`  | `/api/health`        | Public               | Health check                                            |
| `GET`  | `/api/me`            | Authenticated        | Return the authenticated user                           |
| `POST` | `/api/auth/register` | Public, rate-limited | Register an account                                     |
| `POST` | `/api/auth/login`    | Public, rate-limited | Log in and issue a JWT                                  |
| `POST` | `/api/auth/logout`   | Public route         | Clear the authentication cookie                         |
| `POST` | `/api/auth/chekin`   | Staff, admin         | Generate a session/check-in through the auth controller |

### Member endpoints

Base path: `/api/member` — available to `member` and `admin`.

| Method   | Endpoint                        | Description                                      |
| -------- | ------------------------------- | ------------------------------------------------ |
| `GET`    | `/api/member/plans`             | List available membership plans                  |
| `GET`    | `/api/member/my-subscriptions`  | Get the member's subscriptions                   |
| `GET`    | `/api/member/payment-history`   | Get payment history                              |
| `GET`    | `/api/member/gym-pass`          | Generate/retrieve a gym-pass QR token and expiry |
| `POST`   | `/api/member/purchasePlan`      | Submit a plan purchase/payment request           |
| `POST`   | `/api/member/requestRenewal`    | Submit a renewal request                         |
| `GET`    | `/api/member/profile`           | Get the member profile                           |
| `PATCH`  | `/api/member/profile`           | Update the member profile                        |
| `GET`    | `/api/member/attendance`        | Get member attendance (`page` query supported)   |
| `DELETE` | `/api/member/payments/:id`      | Cancel a member payment request                  |
| `POST`   | `/api/member/membership/freeze` | Request membership freeze (`days` in body)       |
| `POST`   | `/api/member/membership/resume` | Resume a frozen membership                       |
| `POST`   | `/api/member/feedback`          | Submit feedback                                  |

### Staff endpoints

Base path: `/api/staff` — available to `staff` and `admin`.

| Method  | Endpoint                      | Description                                    |
| ------- | ----------------------------- | ---------------------------------------------- |
| `POST`  | `/api/staff/create-member`    | Register a member account                      |
| `GET`   | `/api/staff/payments`         | List pending payments (`page` query supported) |
| `GET`   | `/api/staff/renewal-requests` | List renewal requests (`page` query supported) |
| `PATCH` | `/api/staff/approve-payment`  | Approve a payment                              |
| `PATCH` | `/api/staff/decline-payment`  | Decline a payment                              |
| `PATCH` | `/api/staff/refund-payment`   | Mark a payment as refunded                     |
| `POST`  | `/api/staff/checkin`          | Record a manual check-in                       |
| `GET`   | `/api/staff/attendance/:date` | Retrieve attendance for the supplied date      |

### Trainer endpoints

Base path: `/api/trainer` — available to `trainer` and `admin`.

| Method  | Endpoint                      | Description                            |
| ------- | ----------------------------- | -------------------------------------- |
| `GET`   | `/api/trainer/shifts`         | Get the authenticated trainer's shifts |
| `GET`   | `/api/trainer/sessions/today` | Get the trainer's sessions for today   |
| `PATCH` | `/api/trainer/sessions/:id`   | Update a trainer session               |

### Admin endpoints

Base path: `/api/admin` — admin only.

| Method   | Endpoint                          | Description                                        |
| -------- | --------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/admin/createtraning`        | Create a training program                          |
| `DELETE` | `/api/admin/deletetraning`        | Delete a training program                          |
| `DELETE` | `/api/admin/deletePlan`           | Deactivate/remove a membership plan                |
| `POST`   | `/api/admin/createshift`          | Create a shift                                     |
| `POST`   | `/api/admin/createMembershipPlan` | Create a membership plan                           |
| `DELETE` | `/api/admin/deleteshift`          | Remove/deactivate a shift                          |
| `GET`    | `/api/admin/users`                | List users (`page` query supported)                |
| `GET`    | `/api/admin/checkins`             | List check-ins (`page` query supported)            |
| `GET`    | `/api/admin/purchases`            | List membership purchases (`page` query supported) |
| `GET`    | `/api/admin/plans`                | List membership plans (`page` query supported)     |
| `GET`    | `/api/admin/payments`             | List payments (`page` query supported)             |
| `GET`    | `/api/admin/shifts`               | List shifts (`page` query supported)               |
| `GET`    | `/api/admin/trainings`            | List training programs (`page` query supported)    |
| `GET`    | `/api/admin/feedbacks`            | List feedback (`page` query supported)             |

> The route names above preserve the current source paths, including the spelling of `/createtraning`. They can be renamed in a future API version, but clients must use the paths that exist in this code.

### Authentication

After login, the API returns a JWT and sets a `token` cookie. For clients that do not use cookies, send the token as:

```http
Authorization: Bearer YOUR_JWT
```

The JWT strategy reads the token from the `token` cookie first, then from the Bearer authorization header.

## Getting started

### Prerequisites

- Node.js (use a current supported LTS release)
- npm
- A running MongoDB instance or MongoDB connection URI
- SMTP credentials if email notifications are required

### 1. Clone the repository

```bash
git clone https://github.com/abuki-dev/GHM.git
cd GHM
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the values described below. Use new, strong secrets for your own environment; do not copy example placeholders into production.

### 4. Start MongoDB

Make sure MongoDB is running and that `MONGODB_URI` points to the intended database.

### 5. Start the server

Development mode (automatic restart):

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

By default, the server listens on `http://localhost:3000`. The health endpoint is:

```text
GET http://localhost:3000/api/health
```

The server connects to MongoDB and invokes the seed routine before listening for requests.

## Environment variables

The application reads configuration from `.env` through `src/config/env.js`.

| Variable         | Required                     | Description                                                           |
| ---------------- | ---------------------------- | --------------------------------------------------------------------- |
| `NODE_ENV`       | No                           | Runtime mode; defaults to `development`                               |
| `PORT`           | No                           | HTTP port; defaults to `3000`                                         |
| `MONGODB_URI`    | Yes                          | MongoDB connection URI                                                |
| `JWT_SECRET`     | Yes                          | JWT signing/verification secret; code requires at least 32 characters |
| `SESSION_SECRET` | No in current env validation | Session secret included in the example configuration                  |
| `GYMPASS_SECRET` | No in current env validation | Separate gym-pass secret included in the example configuration        |
| `CLIENT_ORIGIN`  | No                           | CORS allowed origin; defaults to `http://localhost:3000`              |
| `EMAIL_USER`     | No                           | SMTP account username/address                                         |
| `EMAIL_PASS`     | No                           | SMTP account password or app password                                 |

Example `.env` template:

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/GHM
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
SESSION_SECRET=replace-with-a-long-random-session-secret
GYMPASS_SECRET=replace-with-a-separate-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
```

`MONGODB_URI` and `JWT_SECRET` are validated during configuration loading. Email configuration is needed for successful email delivery. Keep `.env` out of version control and never publish real credentials.

## Database seeding

On server startup, `src/seed/databse.seed.js` checks whether an admin user already exists. If one exists, it skips seeding. Otherwise, it creates sample users and related records for admin, staff, trainers, members, shifts, training programs, membership plans, payments, purchases, check-ins, sessions, and feedback.

The seed file contains development/demo account credentials. Treat these as public test credentials, never use them in a deployed environment, and change/remove seeded accounts before exposing the application.

## Scheduled membership maintenance

The server starts a `node-cron` job configured for **00:05 every day** in the `Africa/Addis_Ababa` timezone.

The job in `src/schedule/updatepurchases.js`:

- Resumes frozen purchases whose freeze end date has passed.
- Updates active purchases whose end date has passed to `expired`.
- Sends an expiry email for recently expired purchases when an email address is available.
- Sends membership-expiry reminders at 5, 3, and 1 day(s) before expiry.
- Records successful reminders to avoid sending the same reminder repeatedly.

Email delivery depends on valid SMTP configuration.

## Security notes

- Do not commit `.env` or expose JWT, database, SMTP, or gym-pass secrets.
- Use unique, high-entropy secrets in each environment.
- Use HTTPS and secure cookie settings when deploying behind a public domain.
- Restrict MongoDB network access and use a database user with least-privilege permissions.
- Review CORS origins before deployment.
- Change or disable demo seed credentials before production use.
- The application applies Helmet, request-size limits, CORS, and rate limiting; these controls do not replace deployment-level security review.

## Available scripts

| Command        | Description                                         |
| -------------- | --------------------------------------------------- |
| `npm start`    | Start the server with Node.js                       |
| `npm run dev`  | Start the server with Nodemon                       |
| `npm run lint` | Run ESLint against `src` and `tests`                |
| `npm test`     | Run Node's test runner against `tests/**/*.test.js` |

The package scripts reference a `tests/` directory. Add test files matching `tests/**/*.test.js` before relying on the test command as a project test suite.

## Known implementation notes

These are documentation-relevant observations from the current source snapshot:

- The repository is a backend API; no frontend application is included in the tracked source tree.
- The README's former PostgreSQL DDL section did not match the implementation. The current application uses MongoDB and Mongoose schemas.
- `express-session` and `connect-mongo` are dependencies, but the current request pipeline authenticates requests with Passport JWT and does not install an Express session middleware.
- The gym-pass endpoint generates a token for the member; the repository does not include a physical QR scanner/turnstile device integration.
- Payment methods are stored as payment metadata and transaction references; no direct CBE, BOA, Dashen, or teleBirr gateway client is present in the reviewed code.
- The existing seed routine uses fixed demonstration credentials. These are for local development only.
- Some route paths preserve legacy spelling, such as `/createtraning` and `/auth/chekin`.

## Contributing

1. Create a branch for your change.
2. Keep route, controller, service, and model responsibilities separated.
3. Validate incoming request data and enforce role permissions for protected operations.
4. Update or add tests for changed behavior.
5. Run linting and the test command before opening a pull request.
6. Document API changes and any new environment variables.

## License

This project declares the **ISC License** in `package.json`.
