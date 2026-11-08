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
- Firebase App Hosting configuration (confirm the active hosting target before release)

## Available application surfaces

- Public landing page, vacancy search, job details, login, and registration
- Student dashboard, job discovery, application submission, status timeline, documents, and profile
- Employer dashboard, vacancy management, applicant review, status decisions, and department profile
- Administrator dashboard, user approval, vacancy approval, application oversight, and audit logs

## Local development

Use the Node 22 patch in `.nvmrc` and install from the lockfile with `npm ci`. For a credential-free local test, use the disposable Firebase emulator suite in the [v2 verification and release runbook](docs/v2-release.md).

For a configured development project, copy `.env.example` to an ignored `.env.local`. Set the browser Firebase values, the matching server project, the canonical `APP_ORIGIN`, and the trusted ingress header. Prefer Application Default Credentials for the server. Run `npm run dev` and open the configured origin. Do not copy live credentials into the emulator environment.

## Firebase configuration and access

Use separate Firebase projects for development, staging, and production. Auth uses verified email and Firebase Email/Password, with MFA required for administrator access. Ordinary portal sessions last up to five days; privileged administrator sessions last up to eight hours. Pending employers can see their approval status after verifying their email. Approval grants the trusted employer claim.

Firestore and Storage deny direct browser access. Next.js checks the current account and resource relationship before serving private records or files. Only the student and the employer linked to an application can access its conversation. Submitted documents are retained with the application.

The existing operator scripts require an explicitly verified nonproduction target before use. The isolated test suite creates its own synthetic accounts and files.

## Validation and deployment

Follow the [v2 verification and release runbook](docs/v2-release.md) for checks, staging configuration, rules and index ordering, and rollback. Confirm the live provider and exact target before deploying.
