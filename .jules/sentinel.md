## 2023-10-24 - [Open Redirect Bypass using Backslash]
**Vulnerability:** Open Redirect
**Learning:** Checking for `//` is not enough to prevent open redirects because browsers will often normalize `/\` to `//` leading to bypasses in redirect functions like `safeCallbackUrl`.
**Prevention:** Make sure to also check `!raw.startsWith("/\\")` or parse the URL and enforce `url.hostname` matches your expected domain.
