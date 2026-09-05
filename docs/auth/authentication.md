# Authentication & Authorization Architecture

Workflow provides a unified multi-provider authentication system supporting modern OAuth providers and custom credentials.

---

## 1. Authentication Providers

All authentication configuration is centralized in [`src/lib/auth/options.ts`](file:///home/nithin/Projects/workflow/src/lib/auth/options.ts).

### A. Google OAuth (`GoogleProvider`)
- Authenticates users via Google Identity Services.
- Automatically creates or links user accounts in PostgreSQL via `@auth/prisma-adapter`.
- Required environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### B. GitHub OAuth (`GithubProvider`)
- Authenticates developers via GitHub OAuth Apps.
- Automatically links GitHub accounts to existing user emails if `allowDangerousEmailAccountLinking` is enabled.
- Required environment variables: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

### C. Legacy / Email + Password Credentials (`CredentialsProvider`)
- Allows traditional sign-up and sign-in with work emails.
- Passwords are salted and hashed using `bcryptjs` with 12 salt rounds ([`src/lib/auth/password.ts`](file:///home/nithin/Projects/workflow/src/lib/auth/password.ts)).
- Registration triggers an atomic transaction creating the `User`, a default `Organization`, and an initial `Workspace` ([`src/actions/auth.ts`](file:///home/nithin/Projects/workflow/src/actions/auth.ts)).

---

## 2. Server-Side Session Guards

Located in [`src/lib/auth/session.ts`](file:///home/nithin/Projects/workflow/src/lib/auth/session.ts):

* **`getSession()`**: Returns the decoded JWT session from cookies.
* **`getCurrentUser()`**: Retrieves the full user record from PostgreSQL including their workspace memberships and owned organizations.
* **`requireAuth()`**: Throws an `Unauthorized` error if no valid session is found.
* **`requireWorkspaceMember(workspaceId, allowedRoles?)`**: Validates that the user is an active member of the target workspace and has the required role (`OWNER`, `ADMIN`, `MEMBER`, or `VIEWER`).

---

## 3. Client-Side Session Provider

Wrapped at root level in [`src/components/common/session-provider.tsx`](file:///home/nithin/Projects/workflow/src/components/common/session-provider.tsx) allowing React Client components to consume `useSession()`, `signIn()`, and `signOut()`.
