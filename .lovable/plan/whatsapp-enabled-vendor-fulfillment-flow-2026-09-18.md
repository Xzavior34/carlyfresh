# WhatsApp-enabled vendor fulfillment flow

## Goal
Make every new order move through a reliable vendor workflow:

```text
New order
  -> in-app + WhatsApp vendor alert
  -> vendor accepts or declines
  -> accepted order starts a server-side preparation deadline
  -> reminder asks “Finished preparation? Send order?”
  -> vendor confirms ready
  -> nearest eligible driver is selected from recent location data
  -> vendor, driver, and buyer receive status updates
```

## Free-to-start boundaries
- In-app notifications, realtime updates, scheduled timers, and location-based driver matching use the existing Lovable Cloud setup and do not require a paid WhatsApp plan.
- WhatsApp Cloud API can be built with Meta’s test tools and a test recipient at no charge, but production WhatsApp delivery is not guaranteed to remain free. Meta requires a business setup, an approved sending number, recipient opt-in, and approved templates for business-initiated messages; charges may apply outside any current free allowance.
- If WhatsApp credentials are absent or a message cannot be delivered, the app remains fully usable and clearly reports that the in-app notification was sent instead.

## Product changes
1. **Vendor order notification**
   - Send one reliable event when an order is paid/created: in-app notification first, then WhatsApp when configured.
   - Use a WhatsApp-approved “new order” template with order number, total, and safe order details.
   - Include secure Accept and Decline links that open the existing public action page; make the links single-use and scoped to that order/vendor.
   - Keep the vendor dashboard as the authoritative source and prevent duplicate notifications on retries.

2. **Accept or decline flow**
   - Accept changes the order to `preparing`, records the preparation deadline in the database, starts the countdown, and notifies the buyer.
   - Decline changes the order to `cancelled`, records the reason/source, notifies the buyer, and stops all reminders.
   - Enforce that only the order’s vendor or an authorized admin can act; WhatsApp links must not depend on a browser login.
   - Make the same actions work from the dashboard, email/action link, and WhatsApp reply path.

3. **Server-side preparation reminders**
   - Replace the current browser-only local-storage timer with durable order timestamps and a scheduled `sla-tick` workflow.
   - At the configured preparation time, send the vendor an in-app alert and WhatsApp reminder: “Finished preparation? Send order?”
   - Support a clear Ready/Send action and a short extension action; make both idempotent so refreshes and repeated webhook calls cannot dispatch twice.
   - If the vendor does not respond, keep the order visible and escalate through the existing SLA path without freezing checkout or dashboards.

4. **Ready-to-driver dispatch**
   - On Ready/Send, set the order/job to packaged/available, then invoke location matching.
   - Use an awaited, valid pickup coordinate source (vendor profile/location or explicit coordinates), recent driver pings, driver role, and active-job exclusions.
   - Atomically assign the closest eligible driver, update both order and delivery job, and notify the selected driver, vendor, and buyer.
   - If no driver is eligible, leave the job available, show the reason, and allow retry/manual admin assignment.

5. **WhatsApp inbound handling**
   - Add the Meta webhook verification and message receiver needed for button/reply events.
   - Validate the signature/verification token, resolve the vendor and order from a server-side action token, reject expired or already-completed actions, and return quickly so Meta does not retry unnecessarily.
   - Support Accept, Decline, Ready/Send, and Extend actions; route each through the same guarded backend operation as the dashboard.
   - Keep all WhatsApp secrets server-side and never expose them in the browser.

6. **Reliability and visibility**
   - Add delivery/action audit records or safe metadata for notification attempts, action source, timestamps, and failures.
   - Add realtime updates to vendor and admin fulfillment views so order, timer, job, and driver assignment changes appear without manual refresh.
   - Add visible retry/error states and duplicate-submit protection; no client action should hang while a WhatsApp or driver request is pending.

## Technical implementation
- Use the existing `notify-vendor-whatsapp`, `order-action`, `sla-tick`, and `dispatch-driver-proximity` functions as the foundation, extending them rather than creating competing flows.
- Add only the schema needed for durable preparation deadlines, notification/action idempotency, and WhatsApp webhook configuration; every new public table will receive explicit grants, RLS, and policies in the same migration.
- Request/store WhatsApp credentials through secure project secrets: access token, phone number ID, webhook verify token, and app secret if signature validation is enabled. Do not place them in source code or ask for a service-role key.
- Configure the scheduled invocation for the SLA function and deploy the updated functions.
- Verify public function validation, dashboard actions, realtime state changes, test-recipient WhatsApp delivery, and no-driver/duplicate-action edge cases without sending an unintended production broadcast.

## User setup required
1. Create or use a Meta developer app with WhatsApp Cloud API.
2. Add a test recipient first, then complete business verification and register the production sending number when ready.
3. Create and submit the required message templates, including the new-order and preparation-reminder templates.
4. Paste the resulting credentials into the secure project-secret form when prompted; never paste them into chat or an `.env` file.
5. Add the webhook callback URL and verification value in Meta after the function is deployed.
