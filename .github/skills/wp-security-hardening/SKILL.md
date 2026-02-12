---
name: wp-security-hardening
description: "Use when writing or reviewing WordPress PHP that handles user input, persists data, or renders output. Provides a security checklist for sanitization/validation, late escaping, authorization (capabilities), CSRF protection (nonces), and safe database access."
compatibility: "Targets WordPress 6.0+."
---

# WP Security Hardening

## When to use

Use this skill whenever you touch code that does **any** of the following:

- Reads request data: `$_POST`, `$_GET`, `$_REQUEST`, `$_COOKIE`, `$_FILES`, `php://input`.
- Accepts values from “semi-trusted” sources: options, post meta, user meta, term meta, remote HTTP responses, webhook payloads, CSV imports.
- Writes to storage:
  - Options/meta (`update_option()`, `update_post_meta()`, `update_user_meta()`, `update_term_meta()`).
  - Database (`$wpdb->query()`, `$wpdb->get_results()`, `$wpdb->insert()`, `$wpdb->update()`).
- Renders output:
  - HTML templates/admin pages (`echo`, `printf`, `wp_die()`, settings pages).
  - Attributes/URLs (`href`, `src`, `action`, redirects).
  - Inline JS, `<script>`, JSON in HTML, or `data-*` attributes.
- Creates privileged actions:
  - Admin forms, `admin-post.php` handlers, `wp_ajax_*` / `wp_ajax_nopriv_*`, REST endpoints, cron actions.

## Inputs required

Before changing code, gather:

- **Entry point type**: admin page, frontend form, `admin-post`, AJAX, REST, cron, webhook.
- **Actor / roles**: which users can trigger it (anonymous, subscriber, editor, admin, custom role).
- **Authorization rule**: the exact capability required (e.g. `manage_options`, `edit_post`, custom capability).
- **Nonce requirement**:
  - action string (e.g. `uofd_stripe_save_settings`)
  - nonce field name (e.g. `uofd_stripe_nonce`)
  - where it’s generated and verified
- **Data model**:
  - expected data types (string/int/bool/array)
  - which fields are required vs optional
  - whether any HTML is allowed (none / limited allowlist / full post HTML)
- **Output contexts** where values appear:
  - plain text, attribute, URL, HTML block, JS string, JSON
- **Database interaction**:
  - which table(s)
  - expected row cardinality
  - whether LIKE searches are used
- **Error handling** requirements: user-facing admin notice vs `wp_send_json_error()` vs `WP_Error`.

## Procedure

### 0) Baseline scan (deterministic)

Run the security inspection script to get a quick, repeatable report of common hardening smells:

- `node .github/skills/wp-security-hardening/scripts/security_inspect.mjs --path=<path>`

Read:
- `references/deterministic-checks.md`

### 0) Threat model quickly (30–60 seconds)

- Identify what is **untrusted** (assume request data is always untrusted).
- Identify what is **privileged** (settings changes, payments, role changes, redirects).
- Decide “allowlist vs blocklist”:
  - allowlist values (preferred) for enums/keys/IDs
  - allowlist HTML tags/attrs (if any HTML is allowed)

---

### 1) Authorization checks (capabilities) — REQUIRED

Checklist:

- Gate the handler **before** performing side effects:
  - use `current_user_can()` with the narrowest capability
  - for post/user/term-specific actions, use object-specific caps (`edit_post`, `edit_user`, etc.)
- Fail closed:
  - `wp_die()` for admin POST handlers
  - `wp_send_json_error()` for AJAX
  - `WP_Error` for REST (`permission_callback`)

Example (admin-post handler):

```php
<?php
defined( 'ABSPATH' ) || exit;

function uofd_stripe_handle_save_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Sorry, you are not allowed to do that.', 'uofd-stripe-checkout' ), 403 );
	}

	// CSRF + validation + persistence below...
}
```

REST example:

```php
'permission_callback' => static function () {
	return current_user_can( 'manage_options' );
},
```

---

### 2) CSRF protection (nonces) — REQUIRED for cookie-authenticated requests

Checklist:

- For **forms and admin actions** (cookie-based auth), require a nonce:
  - generate: `wp_nonce_field( $action, $field_name )`
  - verify: `check_admin_referer( $action, $field_name )` (preferred) or `wp_verify_nonce()`
- Verify **before** using any request values or writing data.
- Do not reuse a generic action string across unrelated actions.

Example (form + handler):

```php
// In the form:
wp_nonce_field( 'uofd_stripe_save_settings', 'uofd_stripe_nonce' );
```

```php
// In the handler:
check_admin_referer( 'uofd_stripe_save_settings', 'uofd_stripe_nonce' );
```

AJAX example:

```php
check_ajax_referer( 'uofd_stripe_update', 'nonce' );
```

Notes:
- Nonces do **not** replace capability checks; you need both.
- For REST requests from wp-admin, the client typically uses `X-WP-Nonce` (action `wp_rest`); you still must enforce capabilities in `permission_callback`.

Read:
- `references/nonces.md`

---

### 3) Data validation (sanitization) — “sanitize early”

Checklist:

- Do not read globals directly without `wp_unslash()`:
  - `$value = isset( $_POST['field'] ) ? wp_unslash( $_POST['field'] ) : '';`
- Validate structure first:
  - arrays are arrays, scalars are scalars
  - required keys exist
  - unexpected keys are ignored
- Sanitize based on **intended type**, not convenience:
  - int IDs: `absint()`
  - booleans: `! empty( $value )` or `filter_var( $value, FILTER_VALIDATE_BOOLEAN )` (careful with strings)
  - keys/enums: `sanitize_key()` + allowlist check
  - emails: `sanitize_email()` + `is_email()`
  - textarea: `sanitize_textarea_field()`
  - plain text: `sanitize_text_field()`
  - URLs (stored as URL, not output): `esc_url_raw()`
  - HTML allowed: `wp_kses( $value, $allowed_html )` (prefer explicit allowlist)

Example (safe request parsing):

```php
$raw_mode = isset( $_POST['mode'] ) ? wp_unslash( $_POST['mode'] ) : '';
$mode     = sanitize_key( $raw_mode );

$allowed_modes = array( 'test', 'live' );
if ( ! in_array( $mode, $allowed_modes, true ) ) {
	$mode = 'test';
}

$raw_email = isset( $_POST['receipt_email'] ) ? wp_unslash( $_POST['receipt_email'] ) : '';
$email     = sanitize_email( $raw_email );

if ( '' !== $email && ! is_email( $email ) ) {
	$email = '';
}
```

---

### 4) Database safety ($wpdb) — REQUIRED when touching SQL

Checklist:

- Prefer core APIs when available (options/meta/CPT queries) over raw SQL.
- Never concatenate untrusted values into SQL.
- Use `$wpdb->prepare()` for dynamic SQL:
  - placeholders for values: `%d`, `%f`, `%s`
  - for LIKE, use `$wpdb->esc_like()` then `prepare()`
- Use `$wpdb->insert()` / `$wpdb->update()` with format arrays when possible.
- Treat table/column names as **identifiers** (cannot be safely passed as `%s`):
  - do not accept them from user input
  - if dynamic, choose from a strict allowlist you control

Example (prepare + LIKE):

```php
global $wpdb;

$search_raw = isset( $_GET['s'] ) ? wp_unslash( $_GET['s'] ) : '';
$search     = sanitize_text_field( $search_raw );

$like = '%' . $wpdb->esc_like( $search ) . '%';

$sql  = "SELECT id, email FROM {$wpdb->prefix}uofd_customers WHERE email LIKE %s";
$rows = $wpdb->get_results( $wpdb->prepare( $sql, $like ), ARRAY_A );
```

Read:
- `references/wpdb.md`

---

### 5) Data protection (late escaping) — “escape at the last moment”

Checklist:

- Escape **at output**, not at storage, unless the storage format requires it.
- Match escaping to the **context**:
  - HTML text node: `esc_html()`
  - HTML attribute: `esc_attr()`
  - URL attribute (`href`, `src`): `esc_url()`
  - textarea content: `esc_textarea()`
  - JSON output: `wp_json_encode()` (and ensure correct headers if serving JSON)
  - allowed HTML blocks: `wp_kses_post()` or `wp_kses( ..., $allowed_html )`
- Do not double-escape:
  - store raw/sanitized values; escape only when rendering

Example (rendering safely):

```php
printf(
	'<a href="%1$s">%2$s</a>',
	esc_url( $account_url ),
	esc_html__( 'Manage billing', 'uofd-stripe-checkout' )
);

printf(
	'<input type="text" name="receipt_email" value="%s" />',
	esc_attr( $email )
);
```

If you intentionally allow limited HTML:

```php
echo wp_kses_post( $marketing_copy_html );
```

Read:
- `references/escaping-contexts.md`

## Verification

Run focused checks before broader tests.

### Deterministic scan (repeatable)

- `node .github/skills/wp-security-hardening/scripts/security_inspect.mjs --path=<path>`

(If your environment doesn’t have a `skills/` path alias, run: `node .github/skills/wp-security-hardening/scripts/security_inspect.mjs --path=<path>`.)

### Quick workspace searches (missing nonce / escaping / prepare)

- Untrusted sources:
  - search for `$_POST`, `$_GET`, `$_REQUEST`, `$_COOKIE`, `$_FILES`
- Missing nonce verification near handlers:
  - search for `admin_post_`, `wp_ajax_`, `register_rest_route`
  - confirm you see `check_admin_referer`, `check_ajax_referer`, or REST capability gating
- Potential XSS sinks:
  - search for `echo $`, `printf(.*$`, `wp_die(.*$`
  - confirm output uses `esc_html`, `esc_attr`, `esc_url`, `wp_kses*` as appropriate
- SQL injection risks:
  - search for `$wpdb->query(`, `$wpdb->get_results(`, `$wpdb->get_var(`, `$wpdb->get_row(`
  - confirm dynamic values go through `$wpdb->prepare()` (or insert/update formats)

### Static analysis / linting (if available)

- Run PHPCS with WordPress rules if configured in the repo:
  - `composer run phpcs` (or the repo’s documented PHPCS command)
- Run unit/integration tests if present:
  - `composer run test` (or the repo’s test script)

### Behavioral checks

- Try the action as:
  - an authorized user (should succeed)
  - an unauthorized user (should return 403 / error)
  - a request with missing/invalid nonce (should fail safely)

## Failure modes (watch for these)

- Escaping mistakes:
  - using `esc_html()` for a URL (`href/src`) instead of `esc_url()`
  - using `esc_attr()` for visible text (harmless but wrong context)
  - escaping too early (stored values become corrupted/double-escaped)
- Sanitization mistakes:
  - skipping `wp_unslash()` and accidentally storing slashed data
  - using `sanitize_text_field()` on content that legitimately contains HTML (data loss)
  - accepting dynamic SQL identifiers (table/column/order) from request input
- Authorization mistakes:
  - nonce present but no `current_user_can()` check
  - checking the wrong capability (too broad or too narrow)
- Nonce mistakes:
  - verifying the nonce after side effects (writes already happened)
  - reusing the same nonce action for multiple unrelated actions
- Database mistakes:
  - string concatenation into SQL
  - using `%s` for numeric IDs (type confusion; prefer `%d` with `absint()`)

## Escalation

If you cannot determine the correct capability, nonce action/name, or allowed HTML policy, stop and ask for the intended permission model and output context before implementing a “best guess.”
