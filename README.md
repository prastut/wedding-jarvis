# Wedding Jarvis

A WhatsApp-based wedding assistant that provides guests with event information via a menu-driven bot and allows operators to send broadcast updates through an admin panel.

## Quick Links

| Document | Description |
|----------|-------------|
| [spec.md](docs/spec.md) | Product requirements and user workflows |
| [spec_claude.md](docs/spec_claude.md) | Technical implementation plan |
| [project-tracker.md](docs/project-tracker.md) | Phase-by-phase progress tracking |

## Documentation Index

### Product & Planning

- **[spec.md](docs/spec.md)** - Complete product specification including user groups (guests, operators), core workflows (opt-in, menu bot, broadcasts), data requirements, and acceptance criteria.

- **[CONSTRAINTS.md](docs/CONSTRAINTS.md)** - Critical chain analysis identifying Meta Business Verification as the blocking constraint, with a prioritized execution plan and buffer management strategy.

### Technical Implementation

- **[spec_claude.md](docs/spec_claude.md)** - Implementation blueprint covering tech stack (Node.js/Express, Supabase, React, Railway), project structure, database schema, API endpoints, and 8-phase development plan.

### WhatsApp Integration

- **[WHATSAPP_SETUP.md](docs/WHATSAPP_SETUP.md)** - Step-by-step guide for Meta Business account creation, WhatsApp Cloud API configuration, webhook setup, and message template creation.

- **[WHATSAPP_TROUBLESHOOTING.md](docs/WHATSAPP_TROUBLESHOOTING.md)** - Troubleshooting guide covering common issues: phone number registration, webhook subscriptions, WABA ID discovery, and token configuration.

### Project Status

- **[project-tracker.md](docs/project-tracker.md)** - Current implementation status by phase. Phases 1-6 complete, Phase 7 (production hardening) in progress.

### Security

- **[security_audit_1.md](docs/security_audit_1.md)** - Security audit findings with severity ratings and remediation steps. Covers webhook signature validation, CORS configuration, rate limiting, and session management.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   WhatsApp      │────▶│  Express Server  │────▶│  Supabase   │
│   Cloud API     │◀────│  (Railway)       │◀────│  (Postgres) │
└─────────────────┘     └──────────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   React Admin    │
                        │   Panel (SPA)    │
                        └──────────────────┘
```

## Key Workflows

1. **Guest Opt-In**: Guest sends message → stored in DB → receives menu
2. **Menu Navigation**: Guest sends option number → bot returns formatted info
3. **Broadcast**: Operator creates message → confirms → sends to all opted-in guests

## Environment Variables

See [spec_claude.md](docs/spec_claude.md#environment-variables) for the complete list of required environment variables.

## Infrastructure

| Service | Purpose |
|---------|---------|
| Railway | Backend hosting + admin panel |
| Supabase | PostgreSQL database |
| Meta Cloud API | WhatsApp messaging |
