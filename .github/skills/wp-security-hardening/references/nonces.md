# Nonces (CSRF protection)

Nonces protect **cookie-authenticated** requests (admin forms, admin-post, wp-admin AJAX) from CSRF.

## Generate

- Admin form:

```php
wp_nonce_field( 'my_action', 'my_nonce' );
```

- AJAX requests typically send a `nonce` param (or custom key).

## Verify (fail fast)

- Admin POST handler:

```php
check_admin_referer( 'my_action', 'my_nonce' );
```

- AJAX:

```php
check_ajax_referer( 'my_action', 'nonce' );
```

- If you must verify manually:

```php
$nonce = isset( $_POST['my_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['my_nonce'] ) ) : '';
if ( ! wp_verify_nonce( $nonce, 'my_action' ) ) {
	wp_die( esc_html__( 'Invalid request.', 'uofd-stripe-checkout' ), 403 );
}
```

## Required pairing

- Nonce checks do **not** authorize an action.
- Always pair nonces with a capability check (`current_user_can()`).

## Common failure modes

- Verifying the nonce after writes/side effects.
- Reusing the same nonce action string for unrelated actions.
- Using nonces for public/anonymous actions (nonces are not secrets).
