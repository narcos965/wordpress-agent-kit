# $wpdb safety

Prefer core APIs (options/meta/query APIs) over raw SQL when possible.

## Rules

- Never concatenate untrusted values into SQL.
- Use `$wpdb->prepare()` for values (`%d`, `%f`, `%s`).
- For `LIKE`, use `$wpdb->esc_like()` then pass through `prepare()`.
- Treat table/column names as identifiers: do not accept them from request input.

## Examples

### Prepared query

```php
global $wpdb;

$user_id = absint( $user_id );

$sql = "SELECT meta_value FROM {$wpdb->usermeta} WHERE user_id = %d AND meta_key = %s";
$val = $wpdb->get_var( $wpdb->prepare( $sql, $user_id, 'my_key' ) );
```

### LIKE query

```php
global $wpdb;

$search = sanitize_text_field( $search );
$like   = '%' . $wpdb->esc_like( $search ) . '%';

$sql  = "SELECT id FROM {$wpdb->prefix}my_table WHERE email LIKE %s";
$rows = $wpdb->get_col( $wpdb->prepare( $sql, $like ) );
```

## Common mistakes

- Building SQL with `"... {$var} ..."` or string concatenation.
- Allowing request input to control `ORDER BY`, column names, or table names.
