# APU CareerHub — Complete Website and System Documentation

**System:** APU On-Campus Employment Portal  
**Application name:** APU CareerHub  
**Audit date:** 29 August 2026  
**Audit basis:** Direct inspection of the application source code, routes, Firebase configuration, security rules, server actions, API handlers, UI components, data types, and operational scripts  
**Project version:** `0.1.0`

---

## 1. Document purpose

This document is the technical and functional reference for the complete APU CareerHub website. It explains:

- the purpose and scope of the portal;
- the implemented technology stack and architecture;
- every public, student, employer, administrator, and API route;
- the permissions and workflows available to each role;
- the complete set of system use cases;
- the Firebase Authentication, Firestore, and Cloud Storage design;
- the vacancy and application state models;
- validation, authorization, audit, notification, and file-security behavior;
- project configuration, local operation, deployment, and maintenance;
- the findings of the source-code audit, including current limitations.

This is an **as-built document**. Features described as implemented are supported by the current code. Section 20 separately identifies controls or states that exist in the interface or type model but are not yet connected to a complete workflow.

### 1.1 Security boundary of the accompanying archive

The project archive contains the website source code, public assets, Firebase rules and indexes, scripts, dependency manifests, and this documentation. It intentionally does **not** contain:

- `.env.local` or other live secrets;
- Firebase Admin private keys;
- the local `node_modules` dependency installation;
- `.next` build output;
- Git history;
- local logs, caches, or operating-system metadata;
- live Firebase Authentication users, Firestore records, or Cloud Storage files.

Live Firebase data remains in the configured Firebase project. This is necessary to prevent credentials, personal information, CVs, and other private runtime records from being copied into a portable archive.

---

## 2. System overview

APU CareerHub centralizes the on-campus employment process for Asia Pacific University. It replaces fragmented vacancy discovery and application handling with a single role-based web application.

The system supports three authenticated roles:

1. **Student** — finds approved vacancies, maintains a profile and private documents, applies online, and tracks application progress.
2. **Employer** — represents an approved APU department or employer, creates vacancies, submits them for approval, reviews applicants, and moves applications through a controlled status workflow.
3. **Administrator** — monitors portal activity, approves employers and vacancies, manages account access, reviews all applications, and inspects audit records. A specially authorized primary administrator can also create and manage other administrator accounts.

Unauthenticated visitors may view the landing page, browse published vacancies, inspect a published vacancy, sign in, or create a student/employer account. Administrator accounts cannot be self-registered.

### 2.1 Objective coverage

| Project objective | Current implementation |
|---|---|
| Centralized on-campus employment platform | One Next.js application with shared Firebase services and role portals |
| Authorized vacancy posting | Approved employers create drafts and submit vacancies; administrators approve or reject them |
| Student vacancy discovery | Public and student job explorers with live published records, search, category, and employment-type filtering |
| Online applications | Authenticated student application form with cover letter, selected CV, confirmation, duplicate prevention, and deadline enforcement |
| Secure document management | Private server-mediated upload/download through Firebase Cloud Storage; metadata in Firestore |
| Application status tracking | Student application list, detail page, and immutable status-history timeline |
| Employer application review | Ownership-scoped applicant list, protected profile/document access, and controlled status transitions |
| Administrative oversight | Live dashboard counts, employer approval, vacancy decisions, user access control, application overview, and audit logs |
| Secure access | Firebase Authentication, custom role claims, Firestore profiles, signed session cookies, backend role checks, Firestore rules, and closed Storage rules |
| Web and mobile access | Responsive public pages, dashboard sidebar/sheet navigation, flexible grids, wrapping tables/content, and mobile touch targets |

---

## 3. Technology stack

| Layer | Technology | Current role in the project |
|---|---|---|
| Web framework | Next.js 16.3.0, App Router | Routing, React Server Components, layouts, metadata, server actions, and route handlers |
| Language | TypeScript 5 | Strictly typed application code and domain models |
| UI runtime | React 19.2.8 / React DOM 19.2.8 | Server and client component rendering |
| Styling | Tailwind CSS 4 | Responsive layouts, visual system, states, and utilities |
| Components | shadcn 4.16.2, Base UI 1.7.0 | Accessible buttons, dialogs, dropdowns, sheets, tables, tabs, inputs, selects, and related primitives |
| Icons | Lucide React | Consistent interface iconography |
| Feedback | Sonner | Success and error toast notifications |
| Authentication | Firebase Authentication | Email/password users, password reset, custom claims, disabled accounts, and session token source |
| Database | Firebase Cloud Firestore | Users, jobs, applications, histories, document metadata, and audit logs |
| File storage | Firebase Cloud Storage | CVs/supporting documents and optional student profile pictures |
| Server Firebase access | Firebase Admin SDK 14.2.0 | Trusted token verification, session cookies, database operations, and protected file delivery |
| Client Firebase access | Firebase Web SDK 12.17.1 | Email/password authentication and live Firestore listeners |
| Deployment target | Vercel | Intended Next.js hosting platform |
| Source control | Git and GitHub | Version history and collaboration |

No separate Express server, ORM, Redux store, email framework, or secondary database is used.

---

## 4. Architecture

```text
Browser
  |
  |-- Public/server-rendered pages ------------------------------+
  |-- Firebase client authentication                             |
  |-- Client interactions and Firestore snapshot listeners       |
  v                                                              |
Next.js application on Vercel                                    |
  |                                                              |
  |-- Server Components: secure data reads and page rendering    |
  |-- Server Actions: profile, vacancy, application, admin writes|
  |-- Route Handlers: session, registration, uploads/downloads   |
  |                                                              |
  +--> Firebase Admin SDK ---------------------------------------+
         |-- Firebase Authentication: users, claims, passwords
         |-- Cloud Firestore: operational records and audit trail
         +-- Cloud Storage: private CVs and profile pictures

Firebase Web SDK
  |-- sign up/sign in/sign out/password reset
  +-- read-only live listeners allowed by Firestore rules
```

### 4.1 Request and trust model

1. Authentication begins in the browser using Firebase email/password authentication.
2. The browser sends a fresh Firebase ID token to a Next.js route handler.
3. The server verifies that token with Firebase Admin, checks the Firestore profile and trusted role claim, and creates an HTTP-only session cookie.
4. Server-rendered protected pages verify the cookie and the database profile on every uncached request.
5. Server Actions and protected APIs repeat role and ownership checks before writing or returning private information.
6. Direct Cloud Storage access is denied. Files are only served through authorized Next.js endpoints.

This gives the application two authorization checks for important data: identity/custom claims in Firebase Authentication and the current role/account state in Firestore.

---

## 5. Project inventory

At the time of audit, the application contained:

- **125 project files** when dependencies, build output, Git data, and `.env.local` are excluded;
- **101 files under `src/`**;
- **7,091 lines under `src/`**;
- **31 page routes**;
- **6 API route files** providing 10 HTTP operations;
- **19 reusable UI primitive files**;
- 4 server-action modules, 7 application-specific library/type modules, 3 operational scripts, 6 public assets, and Firebase rule/index configuration.

### 5.1 Audit validation result

On 29 August 2026, `npm run lint` completed without errors and the Firebase-connected `npm run build` completed successfully. The production build compiled the application, passed TypeScript checking, generated all pages, and reported every application route as a dynamic server-rendered route. Unauthenticated PATCH/DELETE requests to the document-management endpoint were also verified to return HTTP 401. The tightened Firestore rules were then deployed successfully to the configured Firebase project.

### 5.2 Top-level files

| File | Purpose |
|---|---|
| `.env.example` | Safe template listing required Firebase Web SDK, Admin SDK, storage, and seed variables |
| `.gitignore` | Prevents local dependencies, build output, secrets, and generated files from entering version control |
| `AGENTS.md`, `CLAUDE.md` | Repository guidance for development tools |
| `README.md` | Setup, Firebase configuration, sample-account seeding, security, and run instructions |
| `package.json` / `package-lock.json` | Scripts, exact dependency graph, and project metadata |
| `tsconfig.json` | Strict TypeScript configuration and `@/*` source alias |
| `next.config.ts` | Next.js configuration entry point; currently uses framework defaults |
| `eslint.config.mjs` | Next.js Core Web Vitals and TypeScript lint rules |
| `postcss.config.mjs` | Tailwind/PostCSS build integration |
| `components.json` | shadcn component configuration |
| `firebase.json` | Firestore/Storage configuration and local emulator ports |
| `firestore.rules` | Client-side Firestore access policy |
| `firestore.indexes.json` | Required composite Firestore indexes |
| `storage.rules` | Denies direct browser Storage access; files use protected server routes |

### 5.3 Source directories

| Directory | Responsibility |
|---|---|
| `src/app` | App Router pages, nested role layouts, route handlers, loading/404 UI, and server actions |
| `src/components` | Portal-specific components and shadcn/Base UI wrappers |
| `src/lib/auth` | Session validation and role enforcement |
| `src/lib/data` | Firestore reads, data mapping, formatting, and notification derivation |
| `src/lib/firebase` | Browser and Admin Firebase initialization |
| `src/types` | Shared domain types for users, jobs, applications, files, histories, notifications, and logs |
| `scripts` | Seed users, configure the primary administrator, and deploy Firestore rules |
| `public` | Favicon, Open Graph image, and public SVG assets |

---

## 6. Website route catalogue

### 6.1 Public and authentication pages

| Route | Access | Purpose and behavior |
|---|---|---|
| `/` | Public | Landing page; session-aware header; live published vacancy count/cards; job search; process, employer, and support sections |
| `/jobs` | Public | Loads published Firestore jobs and provides working client-side keyword, category, and employment-type filters |
| `/jobs/[id]` | Public, published jobs only | Vacancy description, responsibilities, requirements, skills, compensation, location, hours, deadline, and apply link; unpublished records return 404 |
| `/jobs/[id]/apply` | Student only | Secure application flow for a published job; non-students are redirected and missing/unpublished jobs return 404 |
| `/login` | Signed-out users | Firebase email/password sign-in and password-reset email; an existing server session redirects to its role dashboard |
| `/register` | Signed-out users | Creates student or employer Firebase users and Firestore profiles; an existing session redirects to its dashboard |
| Global `not-found` | Public | Branded 404 response with a link back to open jobs |

### 6.2 Student pages

| Route | Purpose |
|---|---|
| `/student` | Live overview: active applications, progressing applications, available jobs, recent activity, profile completion, skill-based recommendations, and published opportunity count |
| `/student/jobs` | Authenticated version of the live job explorer |
| `/student/applications` | Active and previous application tabs with live statuses and detail links |
| `/student/applications/[id]` | Owner-only application status timeline, job summary, and protected document downloads |
| `/student/documents` | Upload, list, download, rename, and safely delete unused private CV/supporting documents |
| `/student/profile` | Update academic/personal details and optionally upload, change, or remove a profile picture |
| `/student/account` | Update basic account information and change password |
| `/student/support` | Guidance plus an external Gmail link addressed to the configured support mailbox |

### 6.3 Employer pages

| Route | Purpose |
|---|---|
| `/employer` | Live recruitment overview: published vacancies, applicant count, awaiting-review count, recent applicants, and per-vacancy performance |
| `/employer/vacancies` | List all vacancies owned by the current employer and expose valid status-dependent actions |
| `/employer/vacancies/new` | Create a draft or complete vacancy and submit it for administrator approval |
| `/employer/vacancies/[id]` | Owner-only vacancy details and available actions |
| `/employer/vacancies/[id]/edit` | Owner-only editing for draft or rejected vacancies |
| `/employer/applications` | List applications only for vacancies owned by the current employer |
| `/employer/applications/[id]` | Owner-only applicant profile, cover letter, authorized profile picture/CV access, and application-status decision form |
| `/employer/profile` | Update department contact information and description |
| `/employer/account` | Update account information and change password |
| `/employer/support` | Role-specific support guidance and Gmail link |

### 6.4 Administrator pages

| Route | Purpose |
|---|---|
| `/admin` | Live system metrics, pending employer/vacancy approvals, record totals, and administration shortcuts |
| `/admin/users` | All-user, administrator, and pending-employer tabs; approve employers; activate/deactivate accounts; primary-admin creation controls |
| `/admin/vacancies` | All vacancy records; approve or reject pending vacancies |
| `/admin/applications` | Read-only cross-portal application overview |
| `/admin/audit-logs` | Displays the 100 latest recorded security and operational actions |
| `/admin/account` | Update administrator account information and change password |
| `/admin/support` | Administrator-specific support guidance and Gmail link |

### 6.5 API routes

| Method and route | Access | Function |
|---|---|---|
| `POST /api/session` | Fresh Firebase ID token | Validates token/profile/claim, creates five-day HTTP-only session, and records sign-in |
| `DELETE /api/session` | Current session if present | Records sign-out where possible and clears the session cookie |
| `POST /api/register-profile` | Fresh Firebase ID token | Creates the Firestore profile and trusted claim for student or pending employer registration |
| `POST /api/documents/upload` | Student | Validates and stores a CV/supporting document and writes its Firestore metadata |
| `GET /api/documents/download` | Owner student, administrator, or related employer | Authorizes then streams a private document as a non-cacheable attachment |
| `PATCH /api/documents/[id]` | Owning student | Validates and changes the document display name without moving or altering the protected file |
| `DELETE /api/documents/[id]` | Owning student | Deletes an unused document from Storage and Firestore; refuses deletion when any submitted application references it |
| `POST /api/profile/avatar` | Student | Validates image content, stores a private picture, updates the profile, and removes the previous image |
| `GET /api/profile/avatar` | Owner student, administrator, or employer related through an application | Authorizes and streams a non-cacheable profile picture |
| `DELETE /api/profile/avatar` | Student | Removes the optional picture fields/file and restores initials-based display |

---

## 7. Role and capability matrix

| Capability | Visitor | Student | Employer | Administrator | Primary administrator |
|---|:---:|:---:|:---:|:---:|:---:|
| View landing page and published jobs | Yes | Yes | Yes | Yes | Yes |
| Register own student account | Yes | — | — | — | — |
| Request employer account | Yes | — | — | — | — |
| Self-register administrator | No | No | No | No | No |
| Edit own account/password | — | Yes | Yes | Yes | Yes |
| Maintain student profile/photo/documents | — | Own | No | View when authorized | View when authorized |
| Apply to published vacancy | — | Own | No | No | No |
| Track student application | — | Own | Owned vacancies | All, overview | All, overview |
| Create and manage vacancy | — | No | Own | Review pending | Review pending |
| Review applicant documents | — | Own | Related applications | All | All |
| Change application status | — | No | Related applications | Backend action permits it; no admin detail UI | Same |
| Approve employer | — | No | No | Yes | Yes |
| Approve/reject vacancy | — | No | No | Yes | Yes |
| Activate/deactivate non-admin user | — | No | No | Yes | Yes |
| Activate/deactivate another administrator | — | No | No | No | Yes |
| Create administrator | — | No | No | No | Yes |
| View audit logs | — | No | No | Yes | Yes |

The primary-administrator privilege is represented by `canManageAdmins: true` in Firestore and is separate from the normal `admin` role.

---

## 8. Complete use-case catalogue

### UC-01 — Browse the public portal

- **Actor:** Visitor or any signed-in role.
- **Precondition:** None.
- **Flow:** Open `/`; view the portal purpose, current published jobs, process information, employer information, and support information.
- **Session variation:** Signed-in users see their name, sign-out control, and dashboard link instead of registration controls.
- **Postcondition:** No data changes.

### UC-02 — Search and filter published vacancies

- **Actor:** Visitor or student.
- **Precondition:** A vacancy has status `published`.
- **Flow:** Enter a landing-page query or open `/jobs`; filter by keyword, category, or employment type; inspect matching job cards.
- **Rules:** Keyword matching covers title, department, category, and skills. Only published jobs are loaded.
- **Postcondition:** No data changes.

### UC-03 — View a vacancy

- **Actor:** Visitor or signed-in user.
- **Flow:** Select a job card; view all stored vacancy details.
- **Alternative:** Missing, draft, rejected, closed, pending, or archived records return the branded 404 page.
- **Postcondition:** No data changes.

### UC-04 — Register a student

- **Actor:** Signed-out prospective student.
- **Precondition:** Firebase is configured; email does not already exist.
- **Flow:** Choose Student; enter name, email, password, student ID, and programme; Firebase Authentication creates the user; `/api/register-profile` verifies the fresh ID token, assigns the `student` claim, creates an active Firestore profile, and records `user.registered`; a server session is then created.
- **Alternative:** Invalid/duplicate credentials or incomplete student data returns a user-facing error and removes the partially created Auth user if profile creation fails.
- **Postcondition:** Real Auth account and `users/{uid}` record exist; user enters the student portal.

### UC-05 — Request an employer account

- **Actor:** Signed-out APU employer/contact.
- **Flow:** Choose Employer; enter contact and department details; Auth user and Firestore profile are created with pending employer state and `pending_employer` claim; the browser signs out and returns to login.
- **Postcondition:** Administrator sees an approval request. Employer cannot create a portal session until approved.

### UC-06 — Sign in

- **Actor:** Registered user.
- **Flow:** Firebase checks email/password; browser gets a fresh ID token; server verifies recent authentication, active profile, trusted role, and employer approval; server creates a five-day HTTP-only cookie and records `authentication.signed_in`; user is sent to the correct dashboard.
- **Alternatives:** Incorrect password, deactivated account, unapproved employer, mismatched claim/profile, missing profile, or required temporary-password change produces a controlled rejection/redirect.

### UC-07 — Reset a forgotten password

- **Actor:** Signed-out registered user.
- **Flow:** Enter email and choose “Forgot password”; Firebase sends its password-reset email.
- **Postcondition:** No application database fields change.

### UC-08 — Sign out

- **Actor:** Signed-in user.
- **Flow:** Choose Sign out; server records the event if it can verify the cookie, clears it, browser signs out of Firebase, and returns to `/login`.

### UC-09 — Update account settings

- **Actor:** Any signed-in role.
- **Flow:** Change full name/phone; server validates and updates `users/{uid}`; records `user.account_settings_updated`; revalidates the role layout.
- **Constraint:** Login email and role are read-only in this interface.

### UC-10 — Change password

- **Actor:** Any signed-in role, including a newly created administrator.
- **Flow:** Enter current and new password; server re-authenticates the current password through Firebase Identity Toolkit, enforces a 12–128 character mixed-character password, updates Firebase Authentication, clears `mustChangePassword`, and records `user.password_changed`.
- **Constraint:** Other protected actions are blocked while `mustChangePassword` is true.

### UC-11 — Maintain student profile

- **Actor:** Student.
- **Flow:** Update name, ID, programme, phone, introduction, skills, weekly availability, and available-from date; server writes Firestore immediately and records `user.profile_updated`.
- **Effect:** Completion percentage and skill-based job ordering update from stored data.

### UC-12 — Add or remove an optional student profile picture

- **Actor:** Student.
- **Precondition:** Signup is already complete; this field is not part of registration.
- **Flow:** From `/student/profile`, choose a JPEG/PNG/WebP image up to 3 MB; client previews it; server checks both MIME type and binary signature, writes a unique Cloud Storage object, updates protected profile fields, deletes the previous object, and records an audit event.
- **Alternative:** Student may never upload a picture or may remove it later; initials remain as the fallback.
- **Privacy:** Employer access requires an application belonging to that employer and student; administrators may view it.

### UC-13 — Upload and manage a CV/supporting document

- **Actor:** Student.
- **Flow:** Choose or drag a PDF/DOC/DOCX up to 5 MB; server stores it at a unique owner-scoped path, creates document metadata and an audit record, and refreshes the document list. The student may download the file, rename its displayed name while keeping the original extension, or delete it when unused.
- **Retention rule:** Before deletion, the server checks every application belonging to the student. A document referenced by `documentId` or `documentIds` is retained and the deletion request returns HTTP 409. This prevents an employer or administrator from losing a document that formed part of a submitted application.
- **Security:** Rename and delete infer the owner from the authenticated session; the client cannot select a different owner. The Storage path must remain under the student's protected prefix.

### UC-14 — Submit an application

- **Actor:** Student.
- **Preconditions:** Published vacancy, future deadline, at least one uploaded document, no existing application for the same student/job.
- **Flow:** Enter an 80+ character cover letter; explicitly choose one saved document; confirm accuracy/authorization; server verifies the vacancy, identity, selected document ownership, and protected Storage path; then creates the deterministic application ID, initial status history, audit record, and applicant-count increment in one batch.
- **Selection rule:** No document is preselected. The submit button remains disabled until the student actively chooses a CV/supporting document. The server rejects missing, invalid, deleted, or non-owned document IDs even if the browser request is modified.
- **Postcondition:** Employer and administrator dashboards update; student sees the submission confirmation and timeline.

### UC-15 — Track an application

- **Actor:** Application owner student.
- **Flow:** Open My applications; separate active from rejected/withdrawn records; open a record to view its ordered history, student-facing messages, job summary, and submitted document.
- **Security:** An application owned by another student returns 404.

### UC-16 — Maintain an employer department profile

- **Actor:** Approved employer.
- **Flow:** Update contact name, phone, department, and description; server updates Firestore and records `user.profile_updated`.

### UC-17 — Save a vacancy draft

- **Actor:** Approved employer.
- **Flow:** Enter at least a three-character title and choose Save draft; server creates or updates an owner-scoped job with status `draft`.
- **Alternative:** Drafts may contain incomplete fields and can be reopened later.

### UC-18 — Submit a vacancy for approval

- **Actor:** Approved employer.
- **Precondition:** Vacancy is new, draft, or rejected and contains all required data.
- **Flow:** Server validates title, category, type, location, work arrangement, compensation, hours, future deadline, openings, 80+ character description, responsibilities, and requirements; status becomes `pending_approval`; update/resubmission writes an audit event.
- **Postcondition:** Administrators receive a derived approval notification.

### UC-19 — Edit a vacancy

- **Actor:** Owning employer.
- **Precondition:** Status is `draft` or `rejected`.
- **Flow:** Open edit route, change fields, then save draft or submit.
- **Security:** Other employers receive 404; pending, published, closed, or archived jobs cannot be edited by the employer action.

### UC-20 — Close a published vacancy

- **Actor:** Owning employer.
- **Flow:** Choose Close vacancy; server confirms ownership and current `published` state, changes status to `closed`, records time/audit event, and revalidates dashboards/public job pages.
- **Effect:** It immediately disappears from published job discovery and active-vacancy metrics.

### UC-21 — Review applications for owned vacancies

- **Actor:** Approved employer.
- **Flow:** Open Applications; access only records with the employer's UID; open a record to view the applicant profile, cover letter, skills, authorized picture, and submitted CV.
- **Security:** The detail route and download APIs verify application ownership.

### UC-22 — Change application status

- **Actor:** Employer who owns the vacancy (or an administrator through the backend action).
- **Flow:** Choose one of the allowed next states; optionally add a student-facing message and private internal note; server verifies ownership and transition, updates the application, adds immutable history, records `application.status_changed`, and refreshes all role views.
- **Constraint:** Final states cannot be changed.

### UC-23 — Approve an employer

- **Actor:** Administrator.
- **Flow:** Open pending employer accounts; choose Approve; server confirms requested role, assigns the trusted `employer` custom claim, marks the profile approved, records approver/time, and adds `employer.approved` audit event.
- **Postcondition:** Employer can sign in and create vacancies.

### UC-24 — Approve or reject a pending vacancy

- **Actor:** Administrator.
- **Flow:** Open Vacancy oversight; choose approve or reject on a pending row; server re-checks `pending_approval`; approval publishes it while rejection returns it to the employer for editing; audit and live views update.

### UC-25 — Activate or deactivate an account

- **Actor:** Administrator; primary administrator required for another admin.
- **Flow:** Change account state; Firestore transaction prevents removal of the final active administrator; Firebase Auth is disabled/enabled; refresh tokens are revoked on deactivation; rollback restores Firestore if Auth update fails; audit event records the change.
- **Constraints:** Administrator cannot deactivate their own current account.

### UC-26 — Create another administrator

- **Actor:** Primary administrator only.
- **Flow:** Enter the authorized person's name, email, department, and confirmed strong temporary password; server creates a real Auth user, trusted `admin` claim, active Firestore profile with `mustChangePassword: true`, and `admin.created` audit event.
- **Security:** Temporary password is sent to Firebase Authentication only; it is not stored in Firestore or audit metadata. A failed profile write deletes the newly created Auth user.
- **Postcondition:** New administrator must replace the temporary password before performing protected actions.

### UC-27 — Review system activity

- **Actor:** Administrator.
- **Flow:** Use the live dashboard for counts and pending work; inspect all users/vacancies/applications; inspect the latest 100 audit events with actor names and action categories.

### UC-28 — Contact support

- **Actor:** Any signed-in role.
- **Flow:** Open the role's Help & support page; read guidance and safe-email reminders; follow the displayed link/button to Gmail addressed to `khanshuhaab1211@gmail.com`.
- **Postcondition:** No in-portal support record is created; communication occurs in Gmail.

---

## 9. Workflow state models

### 9.1 Employer-access workflow

```text
Registration
  -> Firebase Auth user
  -> Firestore requestedRole=employer, approved=false
  -> custom claim pending_employer
  -> administrator approval
  -> role=employer, approved=true, custom claim employer
  -> employer can create a secure session
```

### 9.2 Vacancy lifecycle

```text
new -> draft -> pending_approval -> published -> closed
                |                 
                +-> rejected -> edit -> pending_approval
```

Defined type state `archived` is reserved but has no connected server action in the current implementation.

| Current state | Employer actions | Administrator actions | Public visibility |
|---|---|---|---|
| `draft` | View, edit, submit | View in oversight | No |
| `pending_approval` | View/wait | Approve or reject | No |
| `rejected` | View, edit, resubmit | View | No |
| `published` | View, review applications, close | View | Yes |
| `closed` | View applications | View | No |
| `archived` | No connected action | No connected action | No |

### 9.3 Application lifecycle

```text
submitted -> under_review -> shortlisted -> interview -> offered
     |            |              |            |
     +----------> rejected <------+------------+

withdrawn exists in the domain/rules but has no current student action.
```

Allowed transitions are server-enforced:

| Current | Allowed next status |
|---|---|
| `submitted` | `under_review`, `rejected` |
| `under_review` | `shortlisted`, `rejected` |
| `shortlisted` | `interview`, `rejected` |
| `interview` | `offered`, `rejected` |
| `offered`, `rejected`, `withdrawn` | Final; none |

---

## 10. Firestore data design

### 10.1 `users/{uid}`

Stores the database-backed profile and access state corresponding to a Firebase Auth UID.

| Field group | Fields |
|---|---|
| Identity | `email`, `fullName`, `role`, `requestedRole` |
| Student | `studentId`, `programme`, `skills[]`, `availability`, `availableFrom` |
| Employer/admin | `department` |
| Shared profile | `phone`, `bio` |
| Profile picture | `avatarUrl`, `avatarStoragePath`, `avatarContentType`, `avatarUpdatedAt` |
| Access | `approved`, `accountActive`, `canManageAdmins`, `mustChangePassword` |
| Administration | `createdByAdmin`, `approvedBy`, `approvedAt`, `passwordChangedAt` |
| Timestamps | `createdAt`, `updatedAt` |

Passwords are never stored in Firestore. They remain in Firebase Authentication.

### 10.2 `jobs/{jobId}`

| Category | Fields |
|---|---|
| Ownership | `employerId`, `employerName`, `department` |
| Main details | `title`, `description`, `category`, `location` |
| Arrangement | `employmentType`, `workMode`, `compensation`, `hoursPerWeek`, `openings` |
| Content arrays | `responsibilities[]`, `requirements[]`, `skills[]` |
| Workflow | `status`, `applicationDeadline`, `applicants` |
| Decision metadata | `publishedAt`, `rejectedBy`, `rejectedAt`, `closedAt` |
| Timestamps | `createdAt`, `updatedAt` |

### 10.3 `applications/{applicationId}`

Application IDs use `${jobId}_${studentUid}`, which guarantees one application per student per vacancy without relying only on a query.

| Category | Fields |
|---|---|
| Relationships | `jobId`, `employerId`, `studentId` |
| Snapshot labels | `jobTitle`, `department`, `studentName`, `studentNumber`, `programme` |
| Contact snapshot | `studentEmail`, `studentPhone` |
| Submission | `coverLetter`, `documentId`, optional `documentIds` |
| Workflow | `currentStatus`, `submittedAt`, `updatedAt` |

The application keeps selected profile/job labels as a submission-time snapshot. Later profile changes do not rewrite all historical application labels.

### 10.4 `applications/{applicationId}/statusHistory/{historyId}`

Fields: `previousStatus`, `newStatus`, `changedBy`, `studentMessage`, `internalNote`, and `changedAt`.

History is append-only through application logic and immutable in Firestore client rules. Student views display the student message but not the private internal note.

### 10.5 `users/{uid}/documents/{documentId}`

Fields: `ownerId`, `applicationId`, `originalName`, `storagePath`, `mimeType`/`contentType`, `fileSize`/`size`, `uploadedAt`, `createdAt`, and optional `updatedAt` after rename.

The standard uploader stores documents with `applicationId: "profile"`. At application time the student explicitly selects one document, and the server saves that exact verified ID in the application. Renaming changes only `originalName`; it does not alter the Storage path or file bytes.

### 10.6 `auditLogs/{logId}`

Fields: `actorId`, `action`, `entityType`, `entityId`, optional `metadata`, and `createdAt`.

Recorded event families include authentication, registration/profile/password changes, profile picture changes, employer approval, administrator creation/management, vacancy updates/decisions, application submission/status changes, and account activation/deactivation.

### 10.7 Notifications

There is no notification collection. The bell derives up to eight recent notifications from live jobs, users, and applications:

- students receive application status notifications;
- employers receive new/updated applications and vacancy decision/status notifications;
- administrators receive pending vacancy and employer approval notifications.

The badge counts attention items. Because notifications are derived, there is currently no persisted read/unread state.

### 10.8 Composite indexes

Configured indexes cover:

- jobs by `status` + `applicationDeadline`;
- jobs by `employerId` + `createdAt`;
- applications by `studentId` + `submittedAt`;
- applications by `employerId` + `submittedAt`;
- applications by `employerId` + `currentStatus` + `submittedAt`.

---

## 11. Cloud Storage design

### 11.1 Object paths

```text
application-documents/{studentUid}/{applicationId-or-profile}/{uuid}-{safeFilename}
profile-pictures/{studentUid}/{uuid}.{jpg|png|webp}
```

### 11.2 Access model

`storage.rules` denies all direct client reads and writes. The trusted Next.js server uses Firebase Admin only after application-level authorization.

| File | Owner student | Related employer | Administrator | Unrelated user/public |
|---|---:|---:|---:|---:|
| CV/supporting document | Read/upload/rename; delete only when unused | Read only when application and selected document match | Read | Denied |
| Student profile picture | Read/upload/delete | Read only through a related application | Read | Denied |

Downloads use `Cache-Control: private, no-store`. Profile images additionally use `X-Content-Type-Options: nosniff`.

---

## 12. Authentication, sessions, and RBAC

### 12.1 Firebase Authentication

- Uses Email/Password provider.
- Passwords are hashed and managed by Firebase, not the application database.
- Browser persistence is local, but protected server pages rely on the HTTP-only session.
- Password reset uses Firebase's standard email workflow.
- Administrator creation uses the Admin SDK and a temporary password.

### 12.2 Session cookie

- Cookie name: `apu_session`.
- Duration: five days.
- Flags: HTTP-only, SameSite Lax, path `/`, Secure in production.
- Session creation requires an ID token authenticated within the last five minutes.
- Every server session lookup verifies revocation and reloads the Firestore profile.

### 12.3 Authorization controls

Authorization combines:

1. Firebase Auth custom claim `role`;
2. Firestore profile `role` equality;
3. `accountActive === true`;
4. `approved === true` for employers;
5. page-level role redirects;
6. server-action role checks;
7. record ownership checks for jobs, applications, documents, and pictures;
8. Firestore Security Rules for any permitted browser reads/listeners;
9. complete denial of direct Storage access.

### 12.4 Firestore client-rule summary

| Collection | Public | Student | Employer | Admin |
|---|---|---|---|---|
| Users | None | Own read/update with restricted protected fields | Own read/update with restrictions | Read/manage according to rules |
| Documents metadata | None | Own read; all mutations use authorized server routes | No direct access | Read; mutations use server logic |
| Jobs | Published read | Published read | Published or own read; own draft create and constrained own updates | Read/update/delete |
| Applications | None | Create/read own; constrained withdrawal fields in rules | Read/update applications for owned jobs | Read/update |
| Status history | None | Read own | Read/create for owned job application | Read/create |
| Audit logs | None | Denied | Denied | Read |
| Unknown paths | Denied | Denied | Denied | Denied unless explicitly matched |

The application normally performs writes through the Admin SDK. Security Rules remain important for client listeners and defense in depth.

---

## 13. Validation and business rules

### 13.1 Registration

- Only `student` and `employer` are accepted from public registration.
- Full name is required.
- Students require student ID and programme.
- Employers require department and always start pending approval.
- Public registration cannot assign administrator privileges.

### 13.2 Vacancies

- Draft title: at least 3 characters.
- Submitted title: at least 5 characters.
- Category, employment type, location, work arrangement, compensation, hours, deadline are required.
- Deadline is interpreted at 23:59:59 Malaysia time and must be in the future.
- Openings: integer from 1 to 100.
- Description: at least 80 characters.
- At least one responsibility and requirement.
- Employers can only edit their own draft/rejected vacancy.

### 13.3 Applications

- Cover letter: at least 80 characters.
- Vacancy must still be published and before deadline.
- Student may apply once per vacancy.
- Application form requires a saved document.
- Status transitions follow Section 9.3 and are checked again on the server.

### 13.4 Files

- Documents: PDF, DOC, or DOCX; maximum 5 MB; filename sanitized for storage path.
- Document display names: 1–180 characters, no control/path characters, and the original PDF/DOC/DOCX extension must be retained.
- Document deletion: owner only and blocked whenever an existing application references the document.
- Profile picture: JPEG, PNG, or WebP; maximum 3 MB; binary file signature must match declared MIME type.
- Storage objects use UUID-based paths to avoid collisions.

### 13.5 Passwords

- Public signup UI accepts Firebase passwords of at least 8 characters.
- Administrator temporary password and in-portal password changes require 12–128 characters with uppercase, lowercase, number, and symbol.
- Current password is verified before a change.

---

## 14. Server actions

| Module | Action | Authorized roles | Primary effect |
|---|---|---|---|
| `actions/profile.ts` | `updateProfileAction` | Student/employer/admin | Role-specific Firestore profile update |
| | `updateAccountSettingsAction` | All roles | Name/phone update |
| | `changePasswordAction` | All roles | Verify current password, update Auth, clear temporary-password requirement |
| `actions/vacancies.ts` | `createVacancyAction` | Approved employer | Create draft/pending job |
| | `updateVacancyAction` | Owning employer | Edit draft/rejected job and save/submit |
| | `submitVacancyForApprovalAction` | Owning employer | Validate stored draft and move to pending |
| | `closeVacancyAction` | Owning employer | Close a published job |
| `actions/applications.ts` | `submitApplicationAction` | Student | Create application/history/audit and increment applicants |
| | `updateApplicationStatusAction` | Related employer/admin | Enforce and record next application state |
| `actions/admin.ts` | `approveEmployerAction` | Admin | Approve profile and trusted claim |
| | `approveVacancyAction` | Admin | Publish pending job |
| | `rejectVacancyAction` | Admin | Reject pending job |
| | `setUserActiveAction` | Admin; primary for admin targets | Synchronize Firestore and disabled Auth state |
| | `createAdministratorAction` | Primary admin | Create Auth user, claim, profile, and audit record |

---

## 15. Live data and caching behavior

- Main dashboards are forced dynamic and read current Firestore data on request.
- Firestore read helpers use React request-level caching to avoid duplicate reads during one render, not long-lived stale application caching.
- `LiveDashboardUpdates` subscribes to role-relevant Firestore collections/documents with the browser SDK.
- After the initial listener snapshot, changes trigger a debounced `router.refresh()` after 500 ms while the page is visible.
- Server actions call `revalidatePath` across affected role layouts and public job pages.
- Employer active-vacancy metrics count only `published`, so closed vacancies do not remain in the open total.

---

## 16. UI, responsive design, and accessibility

### 16.1 Visual system

- Primary navy workspace color with rose/pink action accent.
- White/slate content surfaces, rounded cards, subtle borders/shadows, and consistent icon containers.
- Shared public header/footer, role dashboard shell, metric cards, status badges, cards, tables, dialogs, forms, and toasts.
- Open Graph metadata and image are configured for link previews.

### 16.2 Responsive behavior

- Desktop role navigation is a fixed 260 px sidebar.
- Mobile/tablet navigation becomes a Sheet opened from the header.
- Page grids collapse to a single column on smaller viewports.
- Job content, long words, badges, action groups, and cards allow wrapping rather than causing horizontal overflow.
- Forms switch from two columns to one column.
- Inputs and controls use mobile-friendly minimum touch heights.
- The global body clips accidental horizontal overflow.

### 16.3 Accessibility mechanisms

- Semantic headings, navigation landmarks, labels, form requirements, tables, lists, and buttons.
- Screen-reader-only labels for icon-only actions and table action columns.
- ARIA labels for notification state and upload/download controls.
- `aria-live` feedback for action results and live update time.
- Keyboard/focus behavior inherited from Base UI/shadcn primitives.
- Profile images have meaningful alternative text and initials fallback.
- Hydration warning suppression is limited to the root HTML element to tolerate browser-added attributes.

Formal WCAG conformance testing has not been recorded; manual keyboard, screen-reader, contrast, and zoom testing should still be completed before claiming a specific WCAG level.

---

## 17. Audit trail

The portal records important mutations rather than storing only final state. Representative event names are:

```text
authentication.signed_in
authentication.signed_out
user.registered
user.profile_updated
user.account_settings_updated
user.password_changed
user.profile_picture_updated
user.profile_picture_removed
document.uploaded
document.renamed
document.deleted
user.activated
user.deactivated
employer.approved
admin.created
admin.management_permission_configured
vacancy.updated
vacancy.submitted
vacancy.published
vacancy.rejected
vacancy.closed
application.submitted
application.status_changed
```

Client writes to `auditLogs` are denied. Application/server scripts write logs with the Admin SDK.

---

## 18. Configuration, local operation, and deployment

### 18.1 Required environment variables

Use `.env.example` as the source of names. The application expects:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
SEED_ACCOUNT_PASSWORD
PRIMARY_ADMIN_EMAIL (optional; script default exists)
```

The private key must preserve line breaks, commonly by storing escaped `\n` sequences inside the environment value.

### 18.2 Firebase services

Enable:

- Email/Password Firebase Authentication;
- Cloud Firestore;
- Cloud Storage.

Deploy Firestore rules, indexes, and Storage rules with the Firebase CLI:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 18.3 Local commands

From the project directory:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

For phone testing on the same local network:

```bash
npm run dev -- --hostname 0.0.0.0
```

Then browse to `http://<computer-LAN-IP>:3000`.

### 18.4 Operational scripts

| Command | Purpose |
|---|---|
| `npm run seed:auth` | Create/update two sample profiles for each role in Firebase Auth and Firestore using `SEED_ACCOUNT_PASSWORD` |
| `npm run configure:primary-admin` | Ensure one configured administrator has `canManageAdmins: true`, remove it from other admins, and audit the change |
| `npm run deploy:firestore-rules` | Deploy `firestore.rules` through the Rules REST API; it does not deploy Storage rules or indexes |

### 18.5 Sample-account identities

The seed script creates the following real Firebase account/profile identities when run:

- `student1@example.com`, `student2@example.com`;
- `employer1@example.com`, `employer2@example.com`;
- `admin1@example.com`, `admin2@example.com`.

All use the administrator-provided `SEED_ACCOUNT_PASSWORD`. The password is deliberately not written in this document or included in the archive.

### 18.6 Vercel deployment

1. Push the safe source repository to GitHub.
2. Import it into Vercel.
3. Add the same environment variable names and real values in Vercel project settings.
4. Deploy Firebase rules/indexes separately.
5. Run the production build.
6. Add the Vercel domain to Firebase Authentication authorized domains.
7. Test sign-in, cookie security, protected files, role routes, and all cross-role workflows against production Firebase.

---

## 19. Functional verification checklist

### 19.1 Authentication and RBAC

- [ ] Student registration creates both Auth and Firestore records.
- [ ] Employer registration remains blocked until administrator approval.
- [ ] Administrator cannot be created through public registration.
- [ ] Correct role enters the correct dashboard.
- [ ] Direct access to another role route redirects safely.
- [ ] Deactivated user cannot maintain a session.
- [ ] Logout clears browser Auth and server session.
- [ ] Password reset email is received.
- [ ] New administrator must change temporary password before protected actions.

### 19.2 Student flow

- [ ] Profile fields save and survive refresh/login.
- [ ] Profile picture is optional and absent from signup.
- [ ] Picture upload/change/remove works and remains private.
- [ ] Invalid picture type/size is rejected.
- [ ] CV upload accepts valid formats and rejects invalid/oversized files.
- [ ] Document rename keeps the original extension and updates all authorized views.
- [ ] An unused document can be deleted from metadata and Storage.
- [ ] A document already attached to an application cannot be deleted.
- [ ] Job keyword/category/type filters work.
- [ ] Only published vacancies are visible.
- [ ] Application requires valid cover letter, confirmation, and document.
- [ ] Application requires an explicit document choice and stores the selected ID rather than the newest upload.
- [ ] Duplicate application is blocked.
- [ ] Closed/expired vacancy rejects application.
- [ ] Status timeline updates after employer decision.
- [ ] Student cannot read another student's application/document/picture.

### 19.3 Employer flow

- [ ] Draft can be saved with partial information.
- [ ] Submit validates every required field.
- [ ] Pending vacancy appears to administrator.
- [ ] Rejected vacancy can be edited/resubmitted.
- [ ] Approved vacancy appears publicly.
- [ ] Closing a vacancy removes it from public jobs and active counts.
- [ ] Employer sees only owned vacancies/applications.
- [ ] Related CV and profile picture can be viewed; unrelated records cannot.
- [ ] Only allowed application status transitions are offered/accepted.
- [ ] Final status cannot be changed.

### 19.4 Administrator flow

- [ ] Dashboard totals reflect Firestore records and live changes.
- [ ] Employer approval updates profile and custom claim.
- [ ] Vacancy approve/reject updates all role views.
- [ ] User deactivate/activate updates Firestore and Firebase Auth.
- [ ] Final active administrator cannot be deactivated.
- [ ] Normal admin cannot manage another administrator.
- [ ] Primary admin can create admin with strong temporary password.
- [ ] Audit log receives the expected events.
- [ ] Private file access succeeds only for authorized relationships.

### 19.5 Responsive and quality checks

- [ ] Test widths: 320, 375, 390, 768, 1024, and 1440 px.
- [ ] Mobile navigation opens, links work, and sign-out is reachable.
- [ ] No horizontal scrolling on job detail, forms, cards, and dashboard pages.
- [ ] Keyboard-only navigation reaches every interactive control.
- [ ] 200% browser zoom remains usable.
- [ ] Run `npm run lint` and `npm run build` before release.

---

## 20. Audit findings and known limitations

The core authentication, database, storage, vacancy, application, dashboard, profile, and approval workflows are connected to Firebase. The following items are incomplete or intentionally limited in the current code and should not be presented as active capabilities:

### 20.1 Display-only controls

1. The search field in the authenticated dashboard header has no search handler.
2. The search and select filters on `/employer/applications` are visual only; the full owned application list remains displayed.
3. The search and select filters on `/admin/applications` are visual only.
4. The public vacancy “Share” button has no share/copy action.
5. On `/admin/vacancies`, the menu shown for non-pending records contains View, Close, and Archive labels without linked handlers. Only pending approve/reject is functional.

### 20.2 Reserved or absent workflows

1. `archived` is defined as a vacancy status, but there is no archive server action.
2. `withdrawn` is defined in the application model and Firestore rules, but there is no student withdrawal action or button.
3. Administrators have a backend-authorized status action, but the current administrator application page is overview-only and provides no application detail/decision interface.
4. Notifications are derived and live but cannot be marked read and have no persistent read/unread state.
5. Support is an external Gmail workflow; there is no internal ticket collection, form, assignment, or support audit event from the current page.

### 20.3 Security and quality improvement opportunities

1. Document upload validates browser-reported MIME type and size but, unlike profile pictures, does not inspect PDF/DOC/DOCX file signatures. Add content inspection or malware scanning for a production deployment handling untrusted files.
2. Public registration accepts any valid email address. Add APU-domain or institutional identity verification if policy requires it.
3. `next.config.ts` uses defaults and does not define application-level Content Security Policy or other custom security headers. Vercel and Firebase defaults help, but explicit headers should be considered.
4. No automated unit, integration, end-to-end, or accessibility test suite is configured in `package.json`. Verification is currently lint/build plus manual workflow testing.
5. Firestore audit logs are application-controlled records, not an external tamper-proof security log. For higher assurance, export security events to managed logging.
6. User-facing Server Action errors for some profile forms are thrown directly and do not yet use the same inline action-state component pattern as vacancy/application status forms.
7. The landing-page dashboard illustration contains static illustrative counts and names. These are marketing artwork, not operational dashboard data; real portal dashboards use Firestore.

### 20.4 Configuration notes

1. The standalone `deploy:firestore-rules` script deploys only Firestore rules. Use the Firebase CLI command in Section 18.2 to deploy indexes and Storage rules as well.
2. Direct Cloud Storage rules are intentionally closed because access logic lives in server routes. Keep this server-mediated design consistent when adding future file features.

---

## 21. File-by-file source manifest

### 21.1 App Router and server actions

```text
src/app/actions/admin.ts
src/app/actions/applications.ts
src/app/actions/profile.ts
src/app/actions/vacancies.ts
src/app/admin/account/page.tsx
src/app/admin/applications/page.tsx
src/app/admin/audit-logs/page.tsx
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/app/admin/support/page.tsx
src/app/admin/users/page.tsx
src/app/admin/vacancies/page.tsx
src/app/api/documents/download/route.ts
src/app/api/documents/upload/route.ts
src/app/api/documents/[id]/route.ts
src/app/api/profile/avatar/route.ts
src/app/api/register-profile/route.ts
src/app/api/session/route.ts
src/app/employer/account/page.tsx
src/app/employer/applications/[id]/page.tsx
src/app/employer/applications/page.tsx
src/app/employer/layout.tsx
src/app/employer/page.tsx
src/app/employer/profile/page.tsx
src/app/employer/support/page.tsx
src/app/employer/vacancies/[id]/edit/page.tsx
src/app/employer/vacancies/[id]/page.tsx
src/app/employer/vacancies/new/page.tsx
src/app/employer/vacancies/page.tsx
src/app/favicon.ico
src/app/globals.css
src/app/jobs/[id]/apply/page.tsx
src/app/jobs/[id]/page.tsx
src/app/jobs/page.tsx
src/app/layout.tsx
src/app/loading.tsx
src/app/login/page.tsx
src/app/not-found.tsx
src/app/page.tsx
src/app/register/page.tsx
src/app/student/account/page.tsx
src/app/student/applications/[id]/page.tsx
src/app/student/applications/page.tsx
src/app/student/documents/page.tsx
src/app/student/jobs/page.tsx
src/app/student/layout.tsx
src/app/student/page.tsx
src/app/student/profile/page.tsx
src/app/student/support/page.tsx
```

### 21.2 Application components

```text
src/components/account-settings.tsx
src/components/admin-user-actions.tsx
src/components/admin-vacancy-actions.tsx
src/components/app-shell.tsx
src/components/application-form.tsx
src/components/application-status-form.tsx
src/components/auth-form.tsx
src/components/auth-layout.tsx
src/components/brand-mark.tsx
src/components/create-administrator-dialog.tsx
src/components/document-uploader.tsx
src/components/document-manager.tsx
src/components/email-support-page.tsx
src/components/employer-vacancy-actions.tsx
src/components/job-card.tsx
src/components/jobs-explorer.tsx
src/components/live-dashboard-updates.tsx
src/components/logout-button.tsx
src/components/metric-card.tsx
src/components/password-settings.tsx
src/components/profile-picture-uploader.tsx
src/components/public-header.tsx
src/components/site-footer.tsx
src/components/status-badge.tsx
src/components/vacancy-form.tsx
```

### 21.3 UI primitives

```text
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/checkbox.tsx
src/components/ui/dialog.tsx
src/components/ui/dropdown-menu.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/components/ui/progress.tsx
src/components/ui/radio-group.tsx
src/components/ui/select.tsx
src/components/ui/separator.tsx
src/components/ui/sheet.tsx
src/components/ui/sonner.tsx
src/components/ui/table.tsx
src/components/ui/tabs.tsx
src/components/ui/textarea.tsx
src/components/ui/tooltip.tsx
```

### 21.4 Libraries and types

```text
src/lib/application-status.ts
src/lib/auth/server.ts
src/lib/data/firestore.ts
src/lib/firebase/admin.ts
src/lib/firebase/client.ts
src/lib/support.ts
src/lib/utils.ts
src/types/index.ts
```

### 21.5 Scripts and public assets

```text
scripts/configure-primary-admin.mjs
scripts/deploy-firestore-rules.mjs
scripts/seed-auth-users.mjs
public/file.svg
public/globe.svg
public/next.svg
public/og.png
public/vercel.svg
public/window.svg
```

---

## 22. Maintenance guidance

When changing the portal:

1. Update TypeScript domain types first when introducing a new state or field.
2. Update backend validation and ownership checks before exposing a UI control.
3. Update Firestore Rules and indexes when changing browser-access patterns.
4. Keep Storage access server-mediated unless a carefully tested direct-access design replaces it.
5. Add an audit event for security-sensitive or workflow-changing actions.
6. Revalidate all role layouts affected by a mutation.
7. Test the same record from the student, owning employer, unrelated employer, administrator, and signed-out perspectives.
8. Never commit `.env.local`, Admin SDK keys, seed passwords, exported user data, CVs, or Firebase downloads.
9. Update this document's routes, schema, use cases, findings, and verification checklist when behavior changes.

---

## 23. Conclusion

APU CareerHub implements the principal on-campus employment journey using the requested Next.js, TypeScript, Tailwind, shadcn/Base UI, and Firebase stack. Its core data is real and database-backed: accounts are authenticated by Firebase, roles are server-enforced, profiles and workflows persist in Firestore, and private documents/pictures use Cloud Storage behind authorized endpoints.

The current system is suitable for presenting the complete student application, employer recruitment, and administrator approval flow. Section 20 should be treated as the prioritized backlog before describing every visible control as production-complete or deploying the portal for unrestricted institutional use.
