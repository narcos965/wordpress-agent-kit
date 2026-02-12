# Plan: Modular Order Confirmation Shortcodes (WordPress Skills-Based)

Create three focused shortcodes following WordPress plugin development best practices for structure, security, and data handling.

## Steps

### 1. Backend: Create Three Shortcodes in Plugin

Edit [uofd-stripe-checkout.php](uofd-stripe-checkout.php) and register shortcodes using proper WordPress hooks:

```php
add_action('init', 'uofd_register_confirmation_shortcodes');
function uofd_register_confirmation_shortcodes() {
    add_shortcode('uofd_order_details', 'uofd_render_order_details');
    add_shortcode('uofd_subscription_info', 'uofd_render_subscription_info');
    add_shortcode('uofd_manage_subscription', 'uofd_render_manage_subscription');
}
```

#### Shared helper function `uofd_get_session_data()`

- Check for `$_GET['session_id']`, unslash + sanitize:
  - `$session_id = isset( $_GET['session_id'] ) ? sanitize_text_field( wp_unslash( $_GET['session_id'] ) ) : ''`
- Return null if absent or invalid
- Use transient caching: `get_transient('uofd_session_' . $session_id)` to avoid duplicate API calls (5 min TTL)
- If not cached, retrieve session with expansions and cache result
- Include error handling and logging via `uofd_log()`
- Return session object or null on error

#### `uofd_render_order_details($atts)`

- Get session via helper
- Return empty string if no session
- Extract and escape output:
  - `esc_html($session->customer_email)`
  - `esc_html($line_items->data[0]->description)` for product name
  - `esc_url($charge->receipt_url)` for receipt link
- Format amount using WordPress currency functions if available
- Return minimal HTML with properly escaped output (avoid assuming Bootstrap is present)

#### `uofd_render_subscription_info($atts)`

- Get session via helper
- Return empty string if `$session->mode !== 'subscription'`
- Calculate dates using WordPress timezone functions: `wp_date('F j, Y', $timestamp)`
- Calculate trial days: `max(0, ceil(($subscription->trial_end - time()) / DAY_IN_SECONDS))`
- Return minimal HTML with escaped output (avoid assuming Bootstrap is present)

#### `uofd_render_manage_subscription($atts)`

- Get session via helper
- Return empty string if not subscription
- Generate nonce-protected link or button to billing portal
- Use existing `uofd_create_billing_portal` AJAX flow
- Return properly escaped HTML

### 2. Frontend: Compose in Elementor

- Edit WordPress page containing the AI Edge post-purchase content
- Add shortcodes in Elementor in desired order
- Add custom headings/text between shortcodes as needed

## Verification

1. Test with subscription (trial + non-trial) and one-time payment
2. Verify transient caching works (check DB or use Query Monitor)
3. Verify proper escaping (no XSS vulnerabilities)
4. Test with invalid session ID - should fail gracefully

## Decisions

- **Transient caching:** Prevents multiple Stripe API calls per page load (5 min TTL is safe since session data doesn't change)
- **Proper escaping:** All output uses `esc_html()`, `esc_url()`, `esc_attr()` per WordPress security guidelines
- **WordPress date functions:** Use `wp_date()` for timezone-aware formatting
- **Hook-based registration:** Register shortcodes on `init` hook per WordPress best practices
- **Graceful degradation:** All shortcodes return empty string when not applicable

## Data Requirements

### For `[uofd_order_details]`:
- Customer email
- Product name
- Order/confirmation number
- Receipt URL
- Amount paid
- Payment method (last 4 digits)

### For `[uofd_subscription_info]`:
- Next billing date (trial end if in trial, otherwise current period end)
- Trial days remaining (if applicable)
- Renewal amount

### For `[uofd_manage_subscription]`:
- Customer email (for billing portal)
- Subscription status confirmation
