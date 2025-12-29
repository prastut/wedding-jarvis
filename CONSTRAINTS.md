# Wedding Jarvis - Critical Chain Analysis

## The Goal
A working WhatsApp bot that guests can use and operators can broadcast from — **before the wedding**.

---

## Identifying the Constraint

### Candidate Constraints

| Constraint | Type | Duration | Controllable? |
|------------|------|----------|---------------|
| Meta Business Verification | External | 1-5 business days | No |
| Template Approval | External | 24-48 hours | No |
| Dedicated Phone Number | Resource | 1 day (buy SIM) | Yes |
| Backend Development | Internal | Variable | Yes |
| Frontend Development | Internal | Variable | Yes |
| Webhook Configuration | Dependency | Requires deployed backend | Yes |

### The Critical Constraint: **Meta Business Verification**

**Why this is THE constraint:**
1. **External dependency** — Meta controls the timeline, you cannot accelerate it
2. **Blocks production** — Without verification, you can only message 5 test numbers
3. **Longest duration** — 1-5 business days (everything else is hours)
4. **Sequential dependency** — Production phone number and high-volume sending depend on it

---

## Critical Chain (Dependency Sequence)

```
DAY 0
├── Create Meta Business Account ─────────────────────────────┐
├── Start Business Verification ──────── [1-5 DAYS WAIT] ─────┤
│                                                              │
│   [PARALLEL WORK WHILE WAITING]                              │
│   ├── Get test credentials                                   │
│   ├── Build backend (webhook, bot logic)                     │
│   ├── Deploy to Railway                                      │
│   ├── Configure webhook with test number                     │
│   ├── Test with 5 test phone numbers                         │
│   ├── Build admin panel                                      │
│   └── Loop test passes ✓                                     │
│                                                              │
VERIFICATION COMPLETE ◄────────────────────────────────────────┘
│
├── Add production phone number
├── Create message templates ─────────── [24-48 HOUR WAIT]
├── Templates approved
└── GO LIVE

```

---

## Exploiting the Constraint

**Goldratt says**: Maximize throughput of the constraint. Don't let it sit idle.

### Action: Start Meta Verification IMMEDIATELY

Before writing a single line of code:
1. Create Facebook account (if needed)
2. Create Meta Business account
3. **Start verification process TODAY**
4. Upload documents, submit

The verification runs in the background while you build everything else.

---

## Subordinating to the Constraint

**Goldratt says**: All other work should support the constraint, not compete with it.

### Reordered Task Priority

| Priority | Task | Rationale |
|----------|------|-----------|
| **P0** | Start Meta verification | The constraint — start the clock |
| **P0** | Get dedicated phone number | Needed for production, get SIM today |
| P1 | Create Meta App + test credentials | Unblocks development |
| P1 | Build minimal webhook + bot response | Can test with test numbers |
| P2 | Deploy to Railway | Needed for webhook config |
| P2 | Full bot logic | Can develop while waiting |
| P3 | Admin backend | Not on critical path |
| P3 | Admin frontend | Not on critical path |
| **P0** | Submit message templates | Start 24-48h clock once verification done |

---

## Elevating the Constraint

**Goldratt says**: If constraint is still limiting, add capacity.

### Can we speed up verification?
- **No** — Meta controls this, typically 1-5 business days
- **Mitigation**: Have all documents ready (ID, business proof) before starting
- **Mitigation**: Use accurate, consistent business info to avoid rejection/resubmission

### Can we work around it?
- **Partially** — Test numbers allow full development and testing
- **Limit**: Only 5 test numbers, no broadcasts to real guests until verified

---

## Buffer Management

### Project Buffer (before wedding)
- **Hard deadline**: Wedding date
- **Required buffer**: At least 1 week before wedding for:
  - Real content entry
  - Operator training
  - Soft launch with family
  - Fix any issues

### Feeding Buffers

| Dependency | Buffer Needed |
|------------|---------------|
| Meta Verification → Production Number | 2 days |
| Template Submission → Template Approval | 2 days |
| Development Complete → Testing | 3 days |

---

## Revised Execution Plan

### Week 1: Unblock the Constraint
- [ ] **Day 1 AM**: Create Meta Business account, start verification
- [ ] **Day 1 AM**: Buy dedicated SIM card for bot
- [ ] **Day 1 PM**: Create Meta App, get test credentials
- [ ] **Day 1 PM**: Set up Supabase project
- [ ] **Day 2-3**: Build backend (webhook, bot logic)
- [ ] **Day 3**: Deploy to Railway, configure webhook
- [ ] **Day 3-4**: Loop test with test numbers
- [ ] **Day 4-5**: Build admin backend

### Week 2: Depends on Verification
- [ ] Once verified: Add production phone number
- [ ] Submit message templates (start 24-48h clock)
- [ ] Build admin frontend
- [ ] Templates approved → test broadcast

### Week 3+: Go Live
- [ ] Enter real wedding content
- [ ] Train operators
- [ ] Soft launch
- [ ] Monitor and fix issues

---

## One-Line Summary

> **Start Meta Business Verification on Day 1. Everything else is subordinate.**

---

## Constraint Checklist (Print This)

### Before Coding Anything:
- [ ] Meta Business account created
- [ ] Verification documents submitted
- [ ] Dedicated phone number acquired (SIM purchased)

### While Waiting for Verification:
- [ ] Test credentials obtained
- [ ] Backend built and deployed
- [ ] Loop test passing with test numbers
- [ ] Admin panel functional

### Once Verified:
- [ ] Production number added
- [ ] Templates submitted
- [ ] Templates approved
- [ ] Production broadcast tested
