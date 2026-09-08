## 2023-10-24 - [Open Redirect Bypass using Backslash]
**Vulnerability:** Open Redirect
**Learning:** Checking for `//` is not enough to prevent open redirects because browsers will often normalize `/\` to `//` leading to bypasses in redirect functions like `safeCallbackUrl`.
**Prevention:** Make sure to also check `!raw.startsWith("/\\")` or parse the URL and enforce `url.hostname` matches your expected domain.

## 2024-09-08 - [Timing Attack in Authentication Token Verification]
**Vulnerability:** Timing Attack
**Learning:** Using standard string equality (e.g., `===` or `!==`) to verify sensitive tokens or API keys allows an attacker to perform a timing attack. An attacker can iteratively guess the secret by measuring the time it takes for the comparison to fail, as standard string comparison returns early on the first mismatched character.
**Prevention:** Always use constant-time comparison functions, such as `crypto.timingSafeEqual`, when comparing sensitive secrets, hashes, or tokens.
