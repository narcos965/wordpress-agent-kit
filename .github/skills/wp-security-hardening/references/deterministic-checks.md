# Deterministic checks

This skill includes a deterministic scanner script:

- `security_inspect.mjs` produces a JSON report of common hardening "smells".

## What it checks (heuristics)

- Superglobal usage (`$_POST`, `$_GET`, etc.)
- Presence/absence of nonce verification calls
- Presence/absence of capability checks (`current_user_can()`)
- `$wpdb` calls (and whether `prepare()` appears in the file)
- Lines that look like variable output without escaping (heuristic)
- Lines that look like URL attributes escaped with `esc_html()`/`esc_attr()` (heuristic)

## How to use results

- Treat findings as **leads**, not proof.
- Confirm the handler type and flow before changing behavior.
- Prefer fixing root causes (cap checks + nonce checks + correct escaping) rather than suppressing warnings.
