## 2023-10-24 - [Open Redirect Bypass using Backslash]
**Vulnerability:** Open Redirect
**Learning:** Checking for `//` is not enough to prevent open redirects because browsers will often normalize `/\` to `//` leading to bypasses in redirect functions like `safeCallbackUrl`.
**Prevention:** Make sure to also check `!raw.startsWith("/\\")` or parse the URL and enforce `url.hostname` matches your expected domain.

## 2024-09-08 - [Timing Attack in Authentication Token Verification]
**Vulnerability:** Timing Attack
**Learning:** Using standard string equality (e.g., `===` or `!==`) to verify sensitive tokens or API keys allows an attacker to perform a timing attack. An attacker can iteratively guess the secret by measuring the time it takes for the comparison to fail, as standard string comparison returns early on the first mismatched character.
**Prevention:** Always use constant-time comparison functions, such as `crypto.timingSafeEqual`, when comparing sensitive secrets, hashes, or tokens.

## 2024-09-09 - [Timing Attack via Buffer Length Leak]
**Vulnerability:** Timing Attack (Length leak in timingSafeEqual)
**Learning:** Using `crypto.timingSafeEqual` with buffers of different lengths throws an error immediately, causing an early return. This short-circuits the comparison, allowing attackers to perform a timing attack to determine the expected length of the secret.
**Prevention:** Always compare lengths first. If the lengths do not match, perform a dummy `crypto.timingSafeEqual` using the expected buffer against itself to maintain constant time execution before returning false.
## 2024-10-27 - [CRITICAL] Hardcoded JWT Secret Fallback Removed
**Vulnerability:** The application was configured to fallback to a hardcoded string ("default-secret") for signing and verifying JSON Web Tokens (JWT) if the `NEXTAUTH_SECRET` environment variable was missing. This permitted an attacker to trivially forge access tokens for arbitrary users and fully compromise the application by bypassing authentication.
**Learning:** Hardcoding a generic fallback for a cryptographic secret is a severe vulnerability. If an environment variable for a key secret is omitted by mistake, the application should fail securely rather than proceed with a guessable secret.
**Prevention:** Remove the static fallback and enforce configuration validation. If `NEXTAUTH_SECRET` is unset, the application must immediately throw an Error to safely halt execution rather than use an insecure default.

## 2024-03-24 - [Enforce Explicit JWT Secret]
**Vulnerability:** The application used a hardcoded fallback "default-secret" for JWT signing and verification (`NEXTAUTH_SECRET`) when the environment variable was missing. This is a critical security risk as it allows anyone to sign and forge valid JWT tokens if the environment variable is accidentally omitted or misconfigured in production.
**Learning:** Never rely on default hardcoded secrets for cryptographic functions or token generation. It provides a false sense of security and leads to catastrophic vulnerabilities if deployed to production without proper configuration.
**Prevention:** Fail securely by throwing an error during initialization or execution if required cryptographic secrets are missing from the environment. This ensures the application cannot run in an insecure state.
