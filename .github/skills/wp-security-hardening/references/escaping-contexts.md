# Escaping contexts (late escaping)

Escape values **at output**, based on the **context** they are being rendered into.

## Context → function map

- **HTML text node** (between tags): `esc_html( $value )`
- **HTML attribute** (`value="..."`, `data-*="..."`): `esc_attr( $value )`
- **URL attributes** (`href`, `src`, `action`): `esc_url( $url )`
- **Textarea contents**: `esc_textarea( $value )`
- **Allowed HTML output** (intentional HTML): `wp_kses_post( $html )` or `wp_kses( $html, $allowed_html )`
- **JSON**: `wp_json_encode( $data )` (and send correct headers when serving JSON)

## Common mistakes (and what to do instead)

- `esc_html()` on a URL → use `esc_url()`.
- `sanitize_text_field()` used as output escaping → sanitization is not escaping; escape late.
- Escaping before storing → store sanitized/raw data, escape only on render to avoid double-escaping.
- `esc_url_raw()` used in HTML output → `esc_url_raw()` is for storage; use `esc_url()` at output.

## Minimal examples

```php
printf(
	'<a href="%1$s">%2$s</a>',
	esc_url( $href ),
	esc_html__( 'Manage billing', 'uofd-stripe-checkout' )
);
```

```php
printf(
	'<input type="text" value="%s" />',
	esc_attr( $value )
);
```
