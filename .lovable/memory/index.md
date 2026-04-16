# Project Memory

## Core
React (TS), Tailwind, Supabase (Postgres, Auth, RLS, Storage).
Dark mode default. Primary #3B82F6, secondary #F59E0B.
Auth uses username (not email). System name: Help DER.
Email notifications via edge function notify-chamado-update.

## Memories
- [Tech Stack](mem://tech/stack-architecture) — React (TS), TailwindCSS, Supabase
- [Theme Palette](mem://style/theme-palette) — Default dark mode, primary blue (#3b82f6), secondary amber (#f59e0b)
- [Login Identifier](mem://auth/login-identifier) — Authentication uses username instead of email
- [Role Permissions](mem://auth/role-permissions) — Access control with 4 roles (admin, suporte, gestor, usuario)
- [SLA Calculation](mem://logic/sla-calculation) — SLA considers only business days (Mon-Fri) and hours (08:00-17:00)
- [Ticket Wizard - SIDER](mem://features/ticket-wizard-sider) — Multi-step ticket wizard with conditional logic for SIDER sector
- [Email Notifications](mem://features/email-notifications) — All chamado events trigger email + in-app notifications. Uses notify-chamado-update edge function. Supports SendGrid or Resend.
- [LDAP](mem://features/ldap-placeholder) — LDAP/AD login button added as placeholder, not yet functional
