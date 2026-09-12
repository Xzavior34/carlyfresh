# Messaging identity and reliability upgrade

## Goal
Make direct messages and push notifications work consistently across customer, vendor, driver, and admin areas. Every conversation will show the sender's name and role; admin messages will be branded as **CarlyFresh · Admin** instead of any backend/provider name.

## Changes
- Centralize chat identity formatting so names and role labels are consistent everywhere.
- Update the full Messages screen and order chat drawer to show sender name, role tag, and timestamp on each message.
- Make admin identity render as **CarlyFresh** with an **Admin** tag in lists, conversation headers, messages, and push alerts.
- Strengthen message sending with duplicate-submit protection, visible failures, restored message text after errors, and live updates for sent and received messages.
- Update direct-message push handling to validate the signed-in sender server-side and derive their display identity safely, rather than trusting a browser-provided sender name.
- Keep broadcast notifications branded as CarlyFresh and verify both notification functions after deployment.

## Technical details
- Reuse `profiles`, `user_roles`, and `chats`; no destructive schema changes.
- Use the existing real-time channels and Lovable Cloud function invocation pattern.
- Preserve current portal navigation and conversation access rules.
- Validate compilation, public app health, authenticated messaging screens where possible, and both notification endpoints without sending an unintended live broadcast.
