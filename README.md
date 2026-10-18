# APU CareerHub

APU CareerHub is a web-based on-campus employment portal for Asia Pacific University. It gives students one place to discover vacancies, submit applications and private documents, and track application progress. Employers can manage vacancies and review applicants, while administrators control approvals and system access.

## Technology stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Next.js Server Actions and Route Handlers
- Firebase Cloud Firestore
- Firebase Authentication
- Firebase Cloud Storage
- Firebase Security Rules
- Vercel

## Available application surfaces

- Public landing page, vacancy search, job details, login, and registration
- Student dashboard, job discovery, application submission, status timeline, documents, and profile
- Employer dashboard, vacancy management, applicant review, status decisions, and department profile
- Administrator dashboard, user approval, vacancy approval, application oversight, and audit logs

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add Firebase web and Admin SDK credentials.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

Firebase credentials are required. The portal does not use an authentication bypass or hardcoded frontend profiles. Without valid client and Admin SDK credentials, authentication and database-backed pages intentionally remain unavailable.

## Firebase configuration

Enable the following services in the Firebase project:

1. Authentication with Email/Password
2. Cloud Firestore
3. Cloud Storage

Deploy the version-controlled configuration:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Real authentication setup

Authentication uses Firebase Email/Password accounts plus a five-day, HTTP-only server session cookie. Passwords are managed only by Firebase Authentication and are never stored in Firestore. Every protected page and write action verifies the session, the Firestore profile, the active-account flag, and the trusted Firebase custom role claim.

After filling `.env.local`, set a temporary password of at least 12 characters:

```env
SEED_ACCOUNT_PASSWORD=replace-with-a-strong-temporary-password
```

Create or refresh two database-backed accounts for every role:

```bash
npm run seed:auth
```

The command creates these Firebase Authentication identities and matching `users/{uid}` Firestore profiles:

- Students: `student1@example.com`, `student2@example.com`
- Employers: `employer1@example.com`, `employer2@example.com`
- Administrators: `admin1@example.com`, `admin2@example.com`

Use the password from `SEED_ACCOUNT_PASSWORD`. Change or remove the seed password after preparing the initial accounts. The seed script is idempotent and does not place passwords in Firestore.

The portal uses Firebase custom claims for trusted roles:

- `student`
- `employer`
- `admin`

Self-registered employer accounts receive a non-privileged `pending_employer` claim and cannot access student or employer portals until an administrator approves the request and assigns the trusted `employer` claim.

## Security model

- Secure HTTP-only Firebase session cookies protect server-rendered portal pages.
- Every Server Action and Route Handler verifies identity, role, and ownership.
- Firestore and Storage Security Rules protect requests made through Firebase web SDKs.
- Firebase Admin SDK calls are treated as privileged and repeat authorization checks in server code.
- Documents are limited to PDF, DOC, or DOCX files smaller than 5 MB.
- Direct Cloud Storage access and direct document-metadata writes are closed; authorized Route Handlers mediate document operations.
- Students can rename documents and delete unused documents. A document attached to any application is retained and cannot be deleted.
- Students explicitly choose which owned document to submit, and the server verifies that exact document before creating the application.
- Application documents use student- and application-specific protected paths and private, non-cacheable downloads.
- Status changes and high-value administrative actions create audit records.

## Validation

```bash
npm run lint
npm run build
```

The production build uses Next.js with webpack because it is reliable in restricted local environments and remains fully compatible with Vercel.

## Deployment

Import the GitHub repository into Vercel and configure every variable listed in `.env.example`. Keep `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` server-only. Add the deployed Vercel domain to Firebase Authentication's authorized domains before testing production sign-in.
