# CareerHub v2 verification and release

Run from the application checkout with the Node patch in `.nvmrc`, Java 21 or newer, and no populated environment file:

```sh
npm ci
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install --with-deps chromium --only-shell
npm exec --yes --package=firebase-tools@15.28.2 -- npm run test:emulators
```

The browser suite uses a disposable `demo-careerhub` project and synthetic accounts and files. Auth, Firestore, and Storage must all use loopback. The suite launches Next.js on port 3137 and terminates it at the end. Never run the repository's existing seed or deploy scripts as part of the test.

Before staging:

- Confirm hosting, release branch, staging and production backend/project IDs, and university policy for eligibility, department approval, records, admin recovery and temporary credentials.
- Require **CareerHub checks / verify** and **CareerHub checks / secrets** on main. Verify a disposable failing PR cannot merge, then restore it. Require up-to-date checks or the merge queue.
- Provision environment configuration for the intended project. If using App Hosting, provision the referenced secret names in that project's Secret Manager before rollout. The Firebase web key is browser-visible. Check its restrictions and grant the runtime only the Firebase and bucket permissions it needs. Enable private bucket access and verify the public endpoint cannot bypass Next.js.
- Verify the platform owns and overwrites the header configured by `TRUSTED_CLIENT_IP_HEADER`; do not trust a header accepted from the open internet. Enforce per-client and aggregate ingress limits, including public jobs at 120/minute/address initially. Verify request body bounds and multi-instance limits. Configure managed verification and recovery URLs, enumeration protection, and TOTP MFA in Identity Platform. Require 12–128 characters with uppercase, lowercase, a number, and a symbol for new passwords. Preserve sign-in for existing passwords. Test provider behavior directly.
- Verify the jobs composite index is ready and configure Firestore TTL for `rateLimits.expiresAt`. Establish access to the operator-only `fileCleanup` collection. For each orphan, verify metadata no longer references its path, delete the object idempotently, then delete the recovery record. Pending document deletes can be retried by the owner.

For the exact staging commit, record the SHA, app backend, Firebase project and rules and index versions. First prepare additive indexes. Verify protected pages, approvals, vacancies, applications, reviewer notes, messages and files for each role, including forbidden direct access and cross-account requests. Verify provider email links, previous-session denial after password reset, verified second-factor sign-in, and admin recovery. Exercise unauthorized mutations, limits across multiple instances, malformed files, retries and concurrency. Check keyboard focus and core layouts on narrow and desktop widths.

Cut over server-only rules once the app without listeners is confirmed. Repeat allowed and denied smoke checks. Exercise rollback by restoring a compatible secure app build on staging while keeping the restrictive rules and records. Record the resulting SHA and smoke results. Promote the staged SHA only after explicit production approval. Verify public jobs, login, private access and error rates on the live target and log the release and rollback SHA.

File format checks are not malware scanning. Treat reviewer downloads as untrusted and confirm the university's scan or quarantine requirements before release.
