# StudyCircle — UI/UX Specification

**Status:** Approved in principle for Dashboard and Group Overview.
**Scope:** Design foundations, information architecture, and the Dashboard + Group Overview screens. Remaining screens to follow in later passes.
**Does not supersede:** `PROJECT.md`, `REQUIREMENTS.md`, or `ARCHITECTURE.md`. Where this document references a requirement ID, that ID remains the source of truth.

---

## 1. Design Foundations

**Layout philosophy:** "The Cozy Workspace" — balanced information density, never feels like an administration panel.

**Navigation:** Persistent sidebar, with two context-dependent modes tied to the current route (classic multi-page architecture — no client-side mode-switching logic needed, each page template includes the correct sidebar partial):

- **Personal mode** — any route outside a group (`/dashboard`, `/tasks`, `/calendar`, `/groups`, `/profile`)
- **Group mode** — any `/groups/:groupId/*` route

**Theme:** Light theme only (MVP).

**Color roles:**
| Token | Hex | Usage |
|---|---|---|
| Sage Green (Primary) | `#72977B` | Primary actions, active nav states |
| Sage Light (Secondary) | `#A9BFA8` | Secondary buttons, hover states, accents |
| Cream (Background) | `#F6F0E5` | Page background |
| Text Green (Headings) | `#3F5D4A` | Headings, high-emphasis text |

> **Open dependency:** contrast ratios for the above combinations (especially small body text and urgency badges on cream) have not yet been validated against WCAG AA. This must be confirmed before tokens are treated as final for implementation.

**Typography:** Handcrafted/expressive brand font reserved for the logo and the Dashboard's greeting line only. A clean, highly legible sans-serif for all functional UI (navigation, forms, cards, buttons, body text).

**Surface style:** Rounded corners (~12–16px), soft shadows instead of hard borders, generous card padding on an 8px-based spacing scale.

**Shared component — Urgency Badge:** Overdue · Due today · Due tomorrow · Due in N days · Completed.
**Rule:** an activity's `COMPLETED` status overrides date-based status entirely — a completed activity must never display as overdue.

> **Open dependency (held separately, not decided here):** exact overdue behavior for a due date with no explicit time is deferred to the deadline-utility/architecture discussion. A non-approved starting proposal for that discussion: treat a date-only deadline as valid through the end of its calendar day in the user's local timezone, becoming overdue the following day.

---

## 2. Information Architecture

### Authentication
- Sign In
- Register
- Password Recovery
- **Accept Invitation** (handles a shareable group invitation link for both signed-out and signed-in users)

### Personal Workspace
- Dashboard
- My Tasks
- Calendar
- My Groups (joined groups only — no discovery/browse; Create Group and Join via Invitation live here)
- Profile & Settings

*(Notifications intentionally excluded — deferred to V3 per `PROJECT.md`/`REQUIREMENTS.md`.)*

### Group Workspace
- Group Overview
- Subjects
- Academic Activities (list) → Activity Detail
- Group Calendar
- Members (view for all members; **Leave Group** for all members, blocked with a plain explanation for the last Admin; invite/promote/remove actions visible to Admins)
- Group Settings (Admin-only)

### MVP vs. Deferred
**MVP:** Sign In, Register, Password Recovery, Accept Invitation, Create Group flow, Dashboard, My Tasks, Calendar, My Groups, Profile & Settings, Group Overview, Subjects, Academic Activities (create/edit/detail), Group Calendar, Members (incl. invite/promote/remove/leave), Group Settings, plus all cross-cutting states below.

**Deferred:** Notifications (V3), Resources (V2), Hub Notes (V2), Study Sessions (V2), Discussions (V3), Announcements (V3), group-wide member progress overview (Activity Detail reserves a layout slot for this but does not implement it in MVP).

---

## 3. Dashboard

**Hierarchy** (Personal-mode sidebar desktop / bottom tab bar mobile):
1. Greeting header (name + date)
2. **Overdue** — shown only when non-empty; excludes completed items
3. **Today**
4. **Due Soon**
5. **My Groups** — group cards + **Create Group** (primary action) / **Join via Invitation** (secondary action)

No "Recent Activity" feed (DASH-007 deferred from MVP).

**Content:** Overdue/Today/Due Soon reuse the shared Activity Card (type icon, title, subject tag, group name, urgency badge) → tap → Activity Detail. My Groups is a card grid (2–3 per row desktop, 1 column mobile) → tap → Group Overview.

**Responsive:** single-column stack on mobile; sections remain single-column on desktop, only the My Groups grid widens.

**Loading/error UX goal:** each section (Overdue/Today/Due Soon, My Groups) should appear to load, succeed, or fail independently from the user's perspective. This is a UX requirement, not a prescribed data-access pattern — the underlying query structure is an architecture-layer decision.

**States:**
- *Loading:* skeleton placeholder per section.
- *Empty, no groups:* unified empty state replacing all sections — illustration + "Create a group or join one with an invitation" + both CTAs.
- *Empty, has groups but nothing due:* "You're all caught up" in place of the deadline sections; My Groups renders normally.
- *Error:* inline banner + retry, scoped to the affected section.
- *Success:* e.g. Create Group redirects to the new Group Overview, confirmation shown there.

---

## 4. Group Overview

**Hierarchy** (Group-mode sidebar desktop / slide-out drawer mobile):
1. **Group header** — name, description, member/subject counts, **Invite Members** (Admin, primary action), Settings icon (Admin)
2. **Quick stats row** — subjects · activities due this week · members
3. **Upcoming in this group** — Activity Cards + **+ New Activity** action
4. **Subjects** — chip/card grid + **+ Add Subject**
5. **Members preview** — avatar row + "View all"

**Responsive:** mobile stacks all zones vertically; desktop lays the stats row out horizontally and lets Subjects use a multi-column grid; Members preview stays a horizontal row at both sizes.

**States:**
- *Loading:* header skeleton + independent skeletons per section.
- *Empty, no subjects:* "Add your first subject" + CTA.
- *Empty, no activities:* "No academic activities yet" + **+ New Activity** CTA (not gated on having a subject first).
- *Empty, just-created group:* Members preview shows only the creator + "Invite classmates" CTA.
- *Unauthorized:* a non-member reaching a group URL sees the shared page-level unauthorized/not-found state, not a broken partial render.

---

## 5. New Activity — Consistent Entry Points

**+ New Activity** appears in Group Overview's Upcoming section and on the Academic Activities page. Both open the **same creation dialog** (consistent with the modal pattern used for Create Group, Add Subject, and Invite Members). Successful creation refreshes the current page's relevant list in place.

## 6. Personal Progress — Entry Point

Status changes (NOT_STARTED / IN_PROGRESS / COMPLETED) happen **only on Activity Detail** in MVP. Dashboard and Group Overview activity cards remain read-only/navigational — no quick-toggle controls on either screen.

---

## 7. Invitation Flow (Accept Invitation + Invite Members)

Mechanism: **reusable group link/code, admin-revocable/regenerable, with automatic expiration.** Full data-layer definition lives in `DATABASE_invitations_addition.md`; this section covers the UI behavior built on top of it.

### Invite Members (Admin, within Group Overview / Members)
- Displays the group's current active invitation link and its expiration date.
- **Copy Link** action.
- **Regenerate** action (Admin-only) — invalidates the previous link immediately and issues a new one; shown with a confirmation step since it silently breaks any copies of the old link still in circulation.
- If no active invitation exists (expired, not yet generated), the panel shows a prompt to generate one rather than a broken/blank state.

### Accept Invitation (public entry point)
- **Preview step:** resolves the link to a minimal, non-sensitive preview (group name only) without requiring authentication and without exposing any other group data.
- **Signed out:** preview → Sign In / Register tabs → on success, automatically attempts to join → redirect to Group Overview.
- **Signed in:** preview → single "Join Group" confirmation → redirect to Group Overview.
- **Already a member:** redirect straight to the group rather than showing an error.
- **Invalid link (expired or revoked):** a calm, generic "This invitation can't be used" state — no technical detail, per SEC-006. The UI does not distinguish "expired" from "revoked" to the visitor, since that distinction has no actionable value for them.

---

## 8. Reusable Components

Sidebar nav item (mode-aware) · bottom tab bar item · drawer nav (Group mode, mobile) · Activity Card · Urgency Badge · Group Card · Subject Chip · Member Row (role badge) · Invitation panel (link display, copy, regenerate) · empty-state block · loading skeleton · modal/dialog · toast/inline alert · confirmation dialog (destructive actions) · form inputs (text, select, date/time) · avatar · button variants (primary/secondary/destructive).

---

## 9. Shared Interface States

Loading (skeletons) · Empty (brand-motif illustration + guidance + CTA) · Error (plain-language + retry, no technical detail) · Success (toast/inline confirmation) · Validation (inline field errors) · Unauthorized/Not Found (calm access-denied screen for protected routes).

---

## 10. Open Dependencies (Not Resolved by This Document)

1. **Date-only deadline behavior** — held for the deadline-utility/architecture discussion (see §1).
2. **Accessibility/contrast audit** — sage-green-and-cream palette, including urgency badges on cream, needs a WCAG AA check before tokens are treated as final.

The invitation-schema dependency referenced in earlier drafts of this document is resolved as of `DATABASE_invitations_addition.md` and is no longer open.
