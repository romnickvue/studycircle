# StudyCircle — Roadmap

**Document:** `ROADMAP.md`  
**Version:** 0.1.0  
**Status:** Draft — awaiting owner approval  
**Parent Sources of Truth:** `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/UI_UX.md`  
**Last Updated:** 2026-10-10

---

## 1. Purpose

This document turns the MVP (Phase 1) into a sequence of small, buildable pieces. It does not redefine scope, architecture, or behavior. Where it references a requirement ID, that ID remains the source of truth.

The plan has five stages. Each stage ends with something you can open on your phone and use. If work stops after any stage, the app still works up to that point.

Phases 2–4 in `PROJECT.md` (resources, Hub Notes, study sessions, discussions, announcements, notifications, realtime) are **not** part of this roadmap. See Section 9.

---

## 2. How We Build: The Slice Loop

Every feature ("slice") follows the same five steps. This matches the vertical-slice approach in `ARCHITECTURE.md` §37.

1. **Database:** migration and RLS for that slice only.
2. **Service:** a function in the relevant `js/services/*.service.js` file that talks to Supabase.
3. **Page:** the HTML, CSS, and JavaScript for the screen, including loading, empty, and error states.
4. **Try it:** the human owner tests it by hand, on a phone-sized screen, with a second account where permissions matter.
5. **Close it:** update docs if anything changed, commit, tick the box below.

### Slice rules

- **One slice at a time.** Nothing new starts until the current slice is ticked.
- **Slices must fit one or two sittings.** If a slice feels too big, split it into smaller steps instead of pushing through.
- **Ideas go to the parking lot (Section 10).** They do not enter the current slice.
- **A slice is Done** when it meets the Definition of Done in `PROJECT.md` §31.

### Team

The human owner and Claude cover the Architect, Developer, QA, and Debugger roles as defined in `PROJECT.md` §27. Claude proposes and implements; the human owner decides, runs, reviews, and signs off.

---

## 3. Migration Plan

This roadmap proposes one migration per slice, each carrying its own indexes and RLS policies, instead of the single combined `0007_indexes.sql` and `0008_rls.sql` suggested in `DATABASE.md` §60. Reason: each slice can then be tested and secured in isolation. **This is a proposed change to `DATABASE.md` §60 and needs owner approval.**

| Migration | Contents | Stage |
|---|---|---|
| `0001_extensions_and_types.sql` | Enums, shared `updated_at` trigger function | 1 |
| `0002_profiles.sql` | `profiles`, signup trigger, RLS | 1 |
| `0003_groups_and_memberships.sql` | `groups`, `group_memberships`, membership helper, `create_group_with_owner`, RLS (including profile visibility for group-mates) | 2 |
| `0004_member_management.sql` | Promote, demote, remove, leave functions with last-admin protection | 2 |
| `0005_group_invitations.sql` | `group_invitations`, `preview_invitation`, `accept_group_invitation`, RLS | 2 |
| `0006_subjects.sql` | `subjects`, RLS | 3 |
| `0007_academic_activities.sql` | `academic_activities`, same-group subject check, RLS | 3 |
| `0008_activity_progress.sql` | `activity_progress`, `completed_at` handling, RLS | 3 |

Migration rules from `DATABASE.md` §61 apply: never rewrite an applied migration; add a new one.

---

## 4. Stage 0 — Document Housekeeping

Do this before Stage 1. It is small, but it prevents confusion later.

- [x] Rename Study Group Hub to **StudyCircle** across `PROJECT.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, and `DATABASE.md`.
- [x] Merge `DATABASE_invitations_addition.md` into `DATABASE.md` (entity list §5, new §24A–24B, RLS §45). The migration list in §60 is handled by the last item below.
- [x] Update `DATABASE.md` §45 so a user can read the profiles of people who share a group with them. The Members list and "Created by" labels need other people's display names.
- [x] Change last-admin protection (`DATABASE.md` §13) from SHOULD to SHALL, enforced inside the promote, demote, remove, and leave functions.
- [x] Add **Leave Group** to the Members page in `UI_UX.md` (GRP-006).
- [x] Update `ARCHITECTURE.md` §35 to the two-person team.
- [ ] Apply the migration-structure change from Section 3 to `DATABASE.md` §60 if approved.
- [x] Bump document versions and dates.

---

## 5. The Five Stages

Size labels: **S** = one sitting, **M** = one to two sittings, **L** = split before starting.

### Stage 1 — Foundation

**Win:** you can register, sign in, and sign out on your phone.

**S1.1 Project setup (M)**
- [ ] Repository and folder structure from `ARCHITECTURE.md` §6
- [ ] Supabase project created; URL and anon key kept out of Git (`.env.example` documents the names) — SEC-001, SEC-007
- [ ] Local HTTP server running (not `file://`)
- [ ] `tokens.css` with the palette, spacing scale, and radii from `UI_UX.md` §1
- [ ] `js/config/supabase.js` creating the client
- [ ] Migration `0001`

**S1.2 Authentication and profiles (M)**
- [ ] Migration `0002`: `profiles`, signup trigger, RLS
- [ ] `auth.service.js`: register, sign in, sign out, get session
- [ ] Register and Sign In pages with inline validation errors
- [ ] Route guard: protected pages redirect to Sign In — AUTH-005
- [ ] Session persists across refresh — AUTH-004

**S1.3 Password recovery (S)**
- [ ] Request and reset flow — AUTH-006 (SHOULD; may move to Stage 5 if it blocks progress)

**Covers:** AUTH-001 to AUTH-005, AUTH-007 to AUTH-009; AUTH-006 in S1.3.

---

### Stage 2 — Groups

**Win:** a friend joins your group through an invitation link.

**S2.1 Groups and membership (M)**
- [ ] Migration `0003`: tables, membership helper, `create_group_with_owner` (group and Admin membership created atomically), RLS, profile visibility for group-mates
- [ ] `groups.service.js`: create, list mine, get by id

**S2.2 Layout shell (M)**
- [ ] Personal-mode sidebar and mobile bottom tab bar
- [ ] Group-mode sidebar and mobile slide-out drawer
- [ ] Shared pieces: modal, toast, confirmation dialog, skeleton loader, empty-state block, unauthorized/not-found page

**S2.3 My Groups, Create Group, Group Overview (M)**
- [ ] My Groups page with Create Group and Join via Invitation actions
- [ ] Create Group modal; redirect to the new Group Overview
- [ ] Group Overview with header, counts, and members preview (subjects and activities sections show empty states for now)
- [ ] Non-members see the unauthorized state, not a broken page — GRP-011, AUTHZ-005

**S2.4 Members and roles (M)**
- [ ] Migration `0004`: promote, demote, remove, leave, each protecting the last Admin
- [ ] Members page: list with role badges; Admin-only promote and remove; Leave Group for everyone

**S2.5 Invitations (L — split into two sittings)**
- [ ] Migration `0005`: `group_invitations`, `preview_invitation`, `accept_group_invitation`, RLS
- [ ] Invite Members panel: show link and expiry, Copy Link, Regenerate (with confirmation)
- [ ] Accept Invitation page: preview, signed-out path (sign in or register, then join), signed-in path, already-a-member redirect, generic invalid-link state

**S2.6 Group Settings (S)**
- [ ] Admin-only edit of group name and description

**Covers:** GRP-001 to GRP-012, AUTHZ-001 to AUTHZ-003, AUTHZ-005, AUTHZ-006.

---

### Stage 3 — Schoolwork

**Win:** you add "Programming 3 Quiz #2" and mark it In Progress.

**S3.1 Subjects (S)**
- [ ] Migration `0006`
- [ ] `subjects.service.js`; Add Subject modal; Subjects section on Group Overview
- Covers: SUB-001 to SUB-006

**S3.2 Deadline utility (M)** — built and tested **before** any screen uses it
- [ ] `js/utils/dates.js`: overdue, due today, due tomorrow, due in N days
- [ ] Asia/Manila as the documented default timezone (`DATABASE.md` §41)
- [ ] Date-only deadlines stored as 23:59 Manila time and treated as valid through that day
- [ ] Unit tests for same-day, midnight, past, future, and date-only cases
- Covers: DUE-002, DUE-004 to DUE-006

**S3.3 Academic activities (L — split into creation, then list and detail, then edit and delete)**
- [ ] Migration `0007`, including the check that a subject belongs to the same group; RLS per `DATABASE.md` §48 (creator or any Admin may edit or delete)
- [ ] `activities.service.js`
- [ ] One shared New Activity dialog, used from Group Overview and the Academic Activities page
- [ ] Activity Card and Urgency Badge components (Completed overrides date-based status)
- [ ] Academic Activities list and Activity Detail
- [ ] Edit and delete with confirmation
- Covers: ACT-001 to ACT-014, DUE-001. ACT-015 (attachments) is deferred (Section 9).

**S3.4 Personal progress (M)**
- [ ] Migration `0008`: lazy creation (no row means NOT_STARTED), `completed_at` set and cleared per `DATABASE.md` §24, RLS so users only touch their own progress
- [ ] `progress.service.js`
- [ ] Status control on Activity Detail only (no quick-toggles on cards)
- Covers: PROG-001 to PROG-005, AUTHZ-004

---

### Stage 4 — Views

**Win:** the quiz shows up everywhere it should.

**S4.1 Dashboard (M)**
- [ ] Greeting, Overdue (only when non-empty, excluding completed), Today, Due Soon, My Groups
- [ ] Each section loads and fails independently; "all caught up" and "no groups" empty states
- Covers: DASH-001 to DASH-006, DASH-010, DUE-003

**S4.2 My Tasks (S)**
- [ ] Personal list of activities across joined groups with status and urgency

**S4.3 Group Calendar (L — split into month grid, then day list and event details)**
- [ ] Calendar event mapper: activities become calendar events (no duplicate records)
- [ ] Month view querying only the visible date range
- [ ] Day list and event detail; types distinguishable; Upcoming list
- [ ] Usable on a small screen
- Covers: CAL-001 to CAL-007, CAL-009, CAL-011

**S4.4 Personal Calendar (S)**
- [ ] Same calendar aggregated across joined groups — CAL-008

---

### Stage 5 — Hardening

**Win:** the full acceptance scenario passes on a phone.

**S5.1 Security and RLS tests (M)**
- [ ] Run the RLS test matrix in `DATABASE.md` §64 with at least two test accounts
- [ ] Confirm no service-role key anywhere in client code
- [ ] User-generated text rendered safely (XSS) — SEC-004
- Covers: SEC-001 to SEC-007, TEST-003

**S5.2 Edge cases (M)**
- [ ] Empty group, no subjects, no upcoming events, overdue and same-day deadlines, removed member, multiple Admins, invalid and expired invitations, unauthorized access — TEST-005
- [ ] Duplicate-submit protection on forms; graceful network failures — REL-001, REL-002

**S5.3 Mobile and accessibility pass (M)**
- [ ] Walk every screen at phone width — UX-001 to UX-003, TEST-007
- [ ] Contrast per the approved palette decision (Section 8); visible focus states; labels — UX-008
- [ ] Loading, empty, and error states on every screen — UX-004 to UX-006

**S5.4 Acceptance run (S)**
- [ ] Walk the 17 steps in `REQUIREMENTS.md` §25 end to end

**S5.5 Deploy (M)**
- [ ] Choose static hosting provider (Section 8)
- [ ] Production Supabase project; migrations applied from the repo, nothing edited by hand
- [ ] Deployment steps written down in `README.md`
- [ ] Tag release **v1.0.0**

---

## 6. Requirement Coverage

| Requirement group | Built in |
|---|---|
| AUTH-001–005, 007–009 | S1.2 |
| AUTH-006 | S1.3 |
| GRP-001–004, 011, 012 | S2.1, S2.3 |
| GRP-005 | S2.5 |
| GRP-006–010 | S2.4 |
| SUB-001–006 | S3.1 |
| ACT-001–014 | S3.3 |
| PROG-001–005 | S3.4 |
| DUE-001–006 | S3.2, S3.3, S4.1 |
| DASH-001–006, 010 | S4.1 |
| CAL-001–007, 009, 011 | S4.3 |
| CAL-008 | S4.4 |
| AUTHZ, SEC | Every slice; verified in S5.1 |
| UX, PERF, REL | Every slice; verified in S5.2–S5.3 |
| TEST | S3.2 (unit tests), S5.1–S5.4 |

---

## 7. Stage Checklist

Update this block as slices close.

```text
Stage 0  Housekeeping     [ ]
Stage 1  Foundation       [ ] S1.1  [ ] S1.2  [ ] S1.3
Stage 2  Groups           [ ] S2.1  [ ] S2.2  [ ] S2.3  [ ] S2.4  [ ] S2.5  [ ] S2.6
Stage 3  Schoolwork       [ ] S3.1  [ ] S3.2  [ ] S3.3  [ ] S3.4
Stage 4  Views            [ ] S4.1  [ ] S4.2  [ ] S4.3  [ ] S4.4
Stage 5  Hardening        [ ] S5.1  [ ] S5.2  [ ] S5.3  [ ] S5.4  [ ] S5.5
```

---

## 8. Pending Decisions

| Decision | Needed by | Notes |
|---|---|---|
| Primary button color (contrast) | S1.1 (tokens) | Sage Green (`#72977B`) on cream is 2.9:1 and white on Sage is 3.3:1, both below the 4.5:1 AA threshold for small text. Text Green (`#3F5D4A`) on cream is 6.4:1. Proposal: primary buttons use Text Green with a cream label; Sage stays for accents and active states. Changes `UI_UX.md` §1. |
| Static hosting provider | S5.5 | Open per `ARCHITECTURE.md` §45. |
| Favicon and logo asset files | Later | Brand board received; individual files not yet cropped. |
| Username field on profiles | S1.2 | Optional per `DATABASE.md` §8; skip unless needed. |

**Settled in this plan:** edit/delete rights (creator or any Admin, `DATABASE.md` §48); default timezone Asia/Manila; date-only deadlines stored as 23:59 Manila time; official name StudyCircle.

---

## 9. Deferred (Not in This Roadmap)

- **MVP "Should" items left out for now:** activity attachments (ACT-015), recent-activity feed on the dashboard (DASH-007), group-wide member progress overview (PROG-006, PROG-007).
- **Phase 2:** resources and uploads, Hub Notes, study sessions and RSVP, realtime group updates, basic notifications.
- **Phase 3:** discussions, announcements, mentions, reactions, notification center.
- **Phase 4:** academic intelligence features.

These return to this roadmap as their own stages only after v1.0.0.

---

## 10. Parking Lot

Ideas that come up mid-build go here instead of into the current slice. Review them between stages using the anti-scope-creep questions in `PROJECT.md` §37.

- _(empty)_

- [ ] Update sign-in.js redirect from index.html to pages/dashboard.html once Stage 4 (S4.1) is built

- [ ] Add `<script src="../js/utils/route-guard.js"></script>` (right after auth.service.js, before anything else) to every protected page as it's built: Group Overview, Dashboard, My Tasks, Calendar, Members, Group Settings, etc.

---

## End of Roadmap
