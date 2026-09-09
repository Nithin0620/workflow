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
