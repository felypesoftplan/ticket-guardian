---
name: Email Notifications
description: All chamado events trigger email + in-app notifications via notify-chamado-update edge function
type: feature
---
- Edge function: notify-chamado-update handles both in-app and email notifications
- On ticket creation: notifies all admins + suporte users of the setor + solicitante
- On ticket updates (status change, comment, attachment, assume): notifies solicitante + responsavel
- Email template is HTML with Help DER branding, includes direct link to chamado
- Supports SendGrid (SENDGRID_API_KEY) or Resend (RESEND_API_KEY) as email providers
- If no email provider configured, in-app notifications still work, email silently skipped
- Email template is editable in supabase/functions/notify-chamado-update/index.ts (buildEmailHtml function)
