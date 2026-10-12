# StudyCircle — Database Specification

**Document:** `DATABASE.md`  
**Version:** 0.2.0  
**Status:** Active — Database Baseline  
**Parent Sources of Truth:** `docs/PROJECT.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`  
**Last Updated:** 2026-10-10  
**Changelog:** v0.2.0 — Renamed to StudyCircle; merged group invitations (§24A–24B, RLS in §45); profiles readable by group-mates (§45); last-admin protection changed from SHOULD to SHALL (§13).

---

## 1. Purpose

This document defines the database architecture for StudyCircle using PostgreSQL through Supabase.

It establishes:

- entities and relationships;
- table responsibilities;
- primary and foreign keys;
- constraints;
- indexes;
- timestamps;
- deletion behavior;
- membership and role modeling;
- activity progress modeling;
- Row Level Security strategy;
- storage metadata;
- migration rules.

This document defines the **database contract**.

Implementation code, UI behavior, and detailed API contracts belong in their respective documents.

---

## 2. Database Principles

The database SHALL follow these principles:

1. **PostgreSQL is the source of truth for persistent application data.**
2. **Relationships SHALL be represented explicitly.**
3. **Authorization SHALL be enforced through PostgreSQL RLS.**
4. **Group membership SHALL determine group-scoped access.**
5. **Roles SHALL belong to group memberships, not globally to users.**
6. **Activity progress SHALL belong to a user/activity relationship.**
7. **Foreign keys SHALL enforce referential integrity.**
8. **Important timestamps SHALL be stored consistently.**
9. **Schema changes SHALL be version-controlled through migrations.**
10. **The database SHALL avoid unnecessary duplication.**
11. **Indexes SHALL be added for known access patterns, not indiscriminately.**
12. **The schema SHALL remain understandable to student developers and AI agents.**

---

## 3. Database Technology

| Area | Decision |
|---|---|
| Database | PostgreSQL |
| Provider | Supabase |
| Authentication | Supabase Auth |
| Authorization | PostgreSQL Row Level Security |
| File metadata | PostgreSQL |
| File objects | Supabase Storage |
| Realtime | Supabase Realtime |
| Schema management | Version-controlled migrations |
| Primary key strategy | UUID |
| Timestamp strategy | `timestamptz` |
| Naming convention | `snake_case` |
| Default schema | `public` for application tables unless a specific reason requires another schema |

---

## 4. High-Level Entity Model

The MVP database consists primarily of:

```text
auth.users
    │
    ▼
profiles
    │
    ├──────────────────────┐
    ▼                      ▼
groups                  group_memberships
    │                      │
    ├──────────────┐       │
    ▼              ▼       │
subjects      academic_activities
                           │
                           ▼
                   activity_progress
```

---

## 5. Entity List

### MVP Entities
- `profiles`
- `groups`
- `group_memberships`
- `group_invitations`
- `subjects`
- `academic_activities`
- `activity_progress`

### Planned V2 Entities
- `resources`
- `hub_notes`
- `study_sessions`
- `study_session_rsvps`

### Planned V3 Entities
- `discussion_posts`
- `discussion_replies`
- `announcements`
- `notifications`

The initial implementation SHOULD avoid creating future tables until the corresponding feature is actively developed unless doing so simplifies migration planning.

---

## 6. Common Column Conventions

Tables SHOULD follow these conventions where applicable:

- `id`
- `created_at`
- `updated_at`

Recommended definitions:

```sql
id uuid primary key default gen_random_uuid()
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Not every table requires `updated_at`. For immutable relationship records, `created_at` may be sufficient.

---

## 7. UUID Strategy

Application entities SHALL use UUID primary keys.

Example:
```sql
id uuid primary key default gen_random_uuid()
```

### Reasons:
- difficult to guess;
- suitable for distributed systems;
- supported naturally by PostgreSQL/Supabase;
- safer to expose than sequential IDs in public URLs;
- suitable for future scaling.

UUIDs SHALL NOT be used as a substitute for authorization.

---

## 8. `profiles`

### Purpose
`profiles` contains application-level information associated with a Supabase Auth user.

The authentication identity itself remains in `auth.users`. The application profile belongs in `public.profiles`.

### Proposed Schema
```text
profiles
├── id uuid PK
├── display_name text NOT NULL
├── username text NULL
├── avatar_url text NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

### Key Design
`profiles.id` SHALL reference `auth.users.id`. Therefore:

$$\text{profiles.id} = \text{auth.users.id}$$

This creates a one-to-one relationship.

### Constraints
- `id` is the primary key.
- `display_name` is required.
- `username`, if implemented, SHOULD be unique.
- User email/password data SHALL NOT be duplicated into profiles unless there is a concrete requirement.

### Delete Behavior
When an Auth user is permanently removed, their profile SHOULD be removed as well.

Recommended relationship:
```sql
profiles.id
    REFERENCES auth.users(id)
    ON DELETE CASCADE
```

---

## 9. `groups`

### Purpose
Represents a study group.

### Proposed Schema
```text
groups
├── id uuid PK
├── name text NOT NULL
├── description text NULL
├── created_by uuid NOT NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

### Relationships
```text
groups.created_by ──> profiles.id
```

The creator is also represented in `group_memberships` with:

$$\text{role} = \text{ADMIN}$$

The creator relationship and membership relationship serve different purposes:
- `created_by` answers who originally created the group.
- `group_memberships` answers who currently belongs to the group and what role they have.

### Constraints
- `name NOT NULL`
- `created_by NOT NULL`

A group name does not necessarily need to be globally unique because different classes/groups may reasonably share names.

---

## 10. `group_memberships`

### Purpose
Represents a user's membership and role within a specific group. This is one of the most important tables in the entire system.

### Proposed Schema
```text
group_memberships
├── id uuid PK
├── group_id uuid NOT NULL
├── user_id uuid NOT NULL
├── role membership_role NOT NULL DEFAULT 'MEMBER'
├── joined_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

### Role Enum
Recommended:
```sql
create type membership_role as enum (
    'ADMIN',
    'MEMBER'
);
```

### Constraints
A user may only have one membership record per group. Therefore:
```sql
unique (group_id, user_id)
```

### Relationship
$$\text{groups} \quad 1 \text{ ──────── } * \quad \text{group_memberships} \quad * \text{ ──────── } 1 \quad \text{profiles}$$

### Why Role Belongs Here
Do NOT use `profiles.role` because a user can be:
- Group A → MEMBER
- Group B → ADMIN
- Group C → MEMBER

---

## 11. Group Creator Rule

When a group is created:
1. Insert group.
2. Insert creator membership.
3. Set creator membership role = `ADMIN`.

This should be performed atomically.

### Preferred Options:
- database function/RPC;
- transactional server-side operation.

The system must not create a group without its creator membership.

---

## 12. Multiple Admins

The schema SHALL support:
```text
Group A
├── Alice — ADMIN
├── Bob   — ADMIN
├── Carol — MEMBER
└── Dave  — MEMBER
```

There SHALL NOT be a single `groups.admin_id` field. Administration is a membership property.

---

## 13. Last Admin Protection

The system SHALL prevent an operation that leaves a group without an Admin.

### Examples:
- **Only Admin leaves** → prevent unless ownership transfer is performed
- **Admin demotes self** → prevent if they are the final Admin
- **Admin removed** → prevent if they are the final Admin

This rule SHALL be enforced inside the database functions that promote, demote, remove, and leave — not only in UI behavior.

---

## 14. `subjects`

### Purpose
Represents academic subjects within a group.

### Proposed Schema
```text
subjects
├── id uuid PK
├── group_id uuid NOT NULL
├── name text NOT NULL
├── code text NULL
├── description text NULL
├── created_by uuid NOT NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

### Relationships
- `groups 1 ──────── * subjects`
- `profiles 1 ────── * subjects`

### Constraints
A subject belongs to exactly one group. Recommended uniqueness:
```sql
unique(group_id, name)
```
If codes are used, `unique(group_id, code)` may be appropriate, but only when code is not null.

---

## 15. `academic_activities`

### Purpose
Represents official academic responsibilities/events.

### Examples:
- Quiz
- Assignment
- Exam
- Project
- Recitation
- Presentation
- Other

### Proposed Schema
```text
academic_activities
├── id uuid PK
├── group_id uuid NOT NULL
├── subject_id uuid NULL
├── created_by uuid NOT NULL
├── title text NOT NULL
├── description text NULL
├── activity_type activity_type NOT NULL
├── starts_at timestamptz NULL
├── due_at timestamptz NULL
├── location text NULL
├── external_url text NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

---

## 16. Activity Type Enum

Recommended:
```sql
create type activity_type as enum (
    'QUIZ',
    'ASSIGNMENT',
    'EXAM',
    'PROJECT',
    'RECITATION',
    'PRESENTATION',
    'OTHER'
);
```
The enum can be expanded through controlled migrations.

---

## 17. Activity Ownership

Every academic activity SHALL belong to exactly one group:
$$\text{academic_activities.group_id} \longrightarrow \text{groups.id}$$

Every activity SHALL record its creator:
$$\text{academic_activities.created_by} \longrightarrow \text{profiles.id}$$

This allows the system to answer:
- who created the activity?
- which group owns it?
- which members can access it?

---

## 18. Activity Subject Relationship

A subject relationship is optional (`subject_id` nullable). This allows activities that may apply to an entire group.

### Example:
"General Orientation" could have `subject_id = NULL`, while "Programming 3 Quiz #2" could reference Programming 3.

The database/application should ensure that if a subject is attached to an activity, that subject belongs to the same group as the activity. This cross-row rule may require application validation or a database trigger/function.

---

## 19. Activity Time Model

Use `starts_at` and `due_at` rather than a single date-only field when time information is relevant. Both may be nullable depending on the activity.

### Examples:
- **Quiz:** `due_at = 2026-10-10 23:59`
- **Exam:** `starts_at = 2026-10-15 09:00`, `due_at = 2026-10-15 11:00`

The UI may display only the relevant information. All stored timestamps SHOULD use `timestamptz`.

---

## 20. Due Date Requirements

For activities that require deadlines, `due_at` should be required by application validation. The database may allow null because the product also supports activities/events where only a start time or date may be known.

This decision should be revisited if the UI later makes due dates mandatory for every activity type.

---

## 21. `activity_progress`

### Purpose
Stores individual member progress for academic activities.

### Proposed Schema
```text
activity_progress
├── id uuid PK
├── activity_id uuid NOT NULL
├── user_id uuid NOT NULL
├── status activity_progress_status NOT NULL
├── completed_at timestamptz NULL
├── updated_at timestamptz NOT NULL
└── created_at timestamptz NOT NULL
```

### Status Enum
```sql
create type activity_progress_status as enum (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED'
);
```

### Constraints
A user can have only one progress record per activity:
```sql
unique(activity_id, user_id)
```

---

## 22. Progress Ownership

Users SHALL only modify their own progress. Conceptually:
$$\text{activity_progress.user_id} = \text{auth.uid()}$$
unless an explicitly authorized administrative workflow is introduced later.

Admins should not automatically receive permission to modify every member's personal progress merely because they administer the group.

---

## 23. Progress Creation Strategy

Two valid approaches exist:

### Option A — Lazy creation
Do not create progress rows until a user interacts with an activity. No row = `NOT_STARTED`.

### Option B — Eager creation
Create progress rows for every member when an activity is created.

For the initial project, **Option A** is recommended.

### Benefits:
- fewer database rows;
- simpler activity creation;
- less work when groups become larger;
- `NOT_STARTED` can be represented by absence.

The application can treat a missing progress record as `NOT_STARTED`. If later analytics require complete progress datasets, this decision can be revisited.

---

## 24. Completion Timestamp

When status changes to `COMPLETED`, the application/database should set `completed_at = now()`. When status changes away from `COMPLETED`, the system should decide whether to clear `completed_at`.

### Recommended Behavior:
- `COMPLETED` → `completed_at = timestamp`
- `IN_PROGRESS` → `completed_at = NULL`
- `NOT_STARTED` → `completed_at = NULL`

---

## 24A. `group_invitations`

### Purpose
Backs the shareable group invitation link (GRP-005). One row represents one issued invitation link for a group.

Regenerating a link does not delete the old row. It closes the old row (`revoked_at`) and creates a new one, which preserves history without a separate status field.

### Proposed Schema
```text
group_invitations
├── id uuid PK
├── group_id uuid NOT NULL
├── code text NOT NULL UNIQUE
├── created_by uuid NOT NULL
├── created_at timestamptz NOT NULL
├── expires_at timestamptz NOT NULL
└── revoked_at timestamptz NULL
```

- `code` is an opaque, unguessable value used in the shareable URL.
- `created_by` must be an Admin of `group_id` at creation time.
- `expires_at` is set automatically at creation as `created_at` plus a default duration. **The default duration is a placeholder: 7 days, pending owner confirmation.**

### Derived Validity Rule (not a stored field)
An invitation is usable only while:
```sql
revoked_at IS NULL AND expires_at > now()
```
A group has at most one active invitation at a time, but may have many historical rows. Generating a new invitation sets `revoked_at = now()` on the previous active row (if any) and inserts a new row. This SHOULD happen atomically.

### Relationships and Delete Behavior
- `groups.id` ← `group_invitations.group_id` (CASCADE)
- `profiles.id` ← `group_invitations.created_by` (delete behavior to be decided when the migration is written)

### RLS (conceptual)
- **SELECT** (full row, including `code`): Admins of the invitation's group only.
- **INSERT:** Admins only, for a group where the inserting user is an Admin.
- **UPDATE** (`revoked_at` only): Admins of that group only.
- **DELETE:** not required for MVP; history is retained via `revoked_at`.

No policy gives non-members or anonymous users direct read access. Public interaction happens only through the two functions in §24B.

---

## 24B. Invitation Functions

### `preview_invitation(code)`
Lets someone who opened an invitation link see which group it is for, without signing in and without exposing private group data.

1. Look up the invitation by `code`.
2. If not found, or not currently valid → return `{ valid: false }` only. "Not found," "expired," and "revoked" are deliberately indistinguishable (SEC-006).
3. If valid → return `{ valid: true, group_name }` only. No other group fields.

This needs elevated internal privilege to read otherwise admin-only rows, scoped tightly to those two return values. It is not a general-purpose read path.

### `accept_group_invitation(code)`
The atomic "join via invitation" operation. Callable only by an authenticated user.

1. Re-validate the invitation by `code`. Do not trust the earlier preview; time may have passed.
2. If invalid → return a failure result; no membership change.
3. If the caller already has a membership in this group → no-op success (idempotent), so repeat visits and double-clicks do not error or duplicate.
4. Otherwise → insert a `group_memberships` row with role `MEMBER`, in one atomic step.
5. Return a result the UI can branch on: `joined`, `already_member`, or `invalid`.

---

## 25. Future Resources

Resources represent shared academic materials.

### Planned Schema
```text
resources
├── id uuid PK
├── group_id uuid NOT NULL
├── subject_id uuid NULL
├── uploaded_by uuid NOT NULL
├── title text NOT NULL
├── description text NULL
├── resource_type resource_type NOT NULL
├── storage_path text NULL
├── external_url text NULL
├── file_name text NULL
├── mime_type text NULL
├── file_size bigint NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

Resources may represent:
- PDF reviewers;
- notes;
- documents;
- images;
- external links.

The file itself SHALL NOT be stored inside PostgreSQL as a large binary value unless a future requirement specifically justifies it.

---

## 26. Storage Path Strategy

A recommended storage path is:
```text
groups/{group_id}/resources/{resource_id}/{filename}
```
Example:
```text
groups/8c.../resources/21a.../reviewer.pdf
```

### Benefits:
- easy group-based organization;
- easier authorization logic;
- reduced filename collisions;
- predictable storage management.

The database stores the storage path.

---

## 27. Future Hub Notes

### Planned Schema
```text
hub_notes
├── id uuid PK
├── group_id uuid NOT NULL
├── author_id uuid NOT NULL
├── content text NOT NULL
├── expires_at timestamptz NOT NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

Hub Notes are intentionally not part of `academic_activities`. A note such as *"Guys, I'm so tired 😭"* must not become a calendar activity.

---

## 28. Future Study Sessions

### Planned Schema
```text
study_sessions
├── id uuid PK
├── group_id uuid NOT NULL
├── created_by uuid NOT NULL
├── title text NOT NULL
├── topic text NULL
├── description text NULL
├── starts_at timestamptz NOT NULL
├── ends_at timestamptz NULL
├── location text NULL
├── meeting_url text NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

Study sessions are separate from academic activities because they represent collaborative plans rather than academic requirements.

---

## 29. Future Study Session RSVPs

### Planned Schema
```text
study_session_rsvps
├── id uuid PK
├── study_session_id uuid NOT NULL
├── user_id uuid NOT NULL
├── response study_session_response NOT NULL
├── created_at timestamptz NOT NULL
└── updated_at timestamptz NOT NULL
```

### Enum:
```sql
create type study_session_response as enum (
    'GOING',
    'MAYBE',
    'NOT_GOING'
);
```

### Constraint:
```sql
unique(study_session_id, user_id)
```

---

## 30. Future Discussion Schema

### Planned:
```text
discussion_posts
├── id
├── group_id
├── author_id
├── title
├── content
├── created_at
└── updated_at

discussion_replies
├── id
├── post_id
├── author_id
├── content
├── created_at
└── updated_at
```

Posts and replies should be separate entities.

---

## 31. Future Announcements

### Planned:
```text
announcements
├── id
├── group_id
├── created_by
├── title
├── content
├── created_at
└── updated_at
```

Only authorized Admins should be able to create/update/delete group announcements.

---

## 32. Future Notifications

### Planned:
```text
notifications
├── id
├── user_id
├── type
├── title
├── body
├── related_entity_type
├── related_entity_id
├── read_at
├── created_at
└── expires_at
```

The exact polymorphic relationship strategy should be finalized before implementation.

---

## 33. Foreign Key Strategy

Foreign keys SHALL be used for relationships:
- `profiles ▲ groups.created_by`
- `groups ▲ group_memberships.group_id`
- `profiles ▲ group_memberships.user_id`
- `groups ▲ subjects.group_id`
- `groups ▲ academic_activities.group_id`
- `subjects ▲ academic_activities.subject_id`
- `academic_activities ▲ activity_progress.activity_id`
- `profiles ▲ activity_progress.user_id`
- `groups ▲ group_invitations.group_id`
- `profiles ▲ group_invitations.created_by`

---

## 34. Delete Behavior

Delete behavior SHALL be intentional. Recommended baseline:

| Relationship | Recommended Behavior |
|---|---|
| Auth user → profile | CASCADE |
| Group → membership | CASCADE |
| Group → invitation | CASCADE |
| User → membership | CASCADE |
| Group → subject | CASCADE |
| Group → activity | CASCADE |
| Subject → activity | SET NULL |
| Activity → progress | CASCADE |
| User → progress | CASCADE |
| Group → resource | CASCADE |
| Resource → storage object | Application cleanup |
| Group → hub note | CASCADE |
| Group → study session | CASCADE |
| Study session → RSVP | CASCADE |
| Discussion post → replies | CASCADE |

Deletion behavior should be reviewed against the final product's retention/audit requirements before production.

---

## 35. Why Subject Deletion Should Use SET NULL

Suppose Programming 3 has Quiz #2. If the subject is deleted, the activity may still be meaningful. Therefore:
$$\text{subject_id} \longrightarrow \text{NULL}$$
is generally preferable to deleting the academic activity automatically. The activity remains associated with the group but no longer has a subject.

---

## 36. Indexing Strategy

Indexes SHALL target common access patterns. Recommended initial indexes:
- `group_memberships(group_id)`
- `group_memberships(user_id)`
- `subjects(group_id)`
- `academic_activities(group_id)`
- `academic_activities(subject_id)`
- `academic_activities(due_at)`
- `academic_activities(created_by)`
- `activity_progress(activity_id)`
- `activity_progress(user_id)`

Composite indexes may be added based on actual queries (e.g., `academic_activities(group_id, due_at)`, `activity_progress(user_id, activity_id)`). The database should not be filled with speculative indexes.

---

## 37. Membership Indexes

Because group authorization is frequently evaluated through membership, `group_memberships(group_id, user_id)` SHOULD be indexed. The unique constraint `unique(group_id, user_id)` will itself provide an index in PostgreSQL. Separate indexes should only be added where query patterns justify them.

---

## 38. Activity Calendar Queries

A common query will be getting activities for a group between two timestamps. Therefore an index such as `academic_activities(group_id, due_at)` is recommended, supporting:
```sql
WHERE group_id = ?
  AND due_at >= ?
  AND due_at < ?
```

---

## 39. Upcoming Deadline Queries

Dashboard queries may need activities for groups I belong to (`WHERE due_at >= now() ORDER BY due_at`). As the user base grows, query performance should be measured and optimized via composite indexes, database views, RPC functions, or query restructuring. Do not introduce an optimization before its query pattern is understood.

---

## 40. Timestamp Strategy

All persistent timestamps SHOULD use `timestamptz` (`created_at`, `updated_at`, `starts_at`, `due_at`, `completed_at`, `expires_at`). Do not store application timestamps as plain text.

---

## 41. Timezone Strategy

The database should store absolute timestamps using `timestamptz`. The application should display them in the user's intended timezone. For the initial target audience, the default user-facing timezone may be `Asia/Manila`. However, the architecture should avoid hardcoding the Philippines timezone into every database query. A future user preference can support individual timezone settings.

---

## 42. `updated_at` Strategy

Tables with editable records SHOULD maintain `updated_at`. The project may use a shared PostgreSQL trigger/function to automatically update it:
$$\text{updated_at} = \text{now()}$$
on every update. This avoids relying entirely on frontend code to maintain timestamps.

---

## 43. Data Validation

Validation should exist at multiple layers:
- **Frontend:** Title cannot be empty.
- **Application:** Selected subject belongs to selected group.
- **Database:** `group_id` references a real group.
- **RLS:** Current user is actually a member of the group.

No single layer should be treated as sufficient for every concern.

---

## 44. Check Constraints

Use PostgreSQL `CHECK` constraints where useful (e.g., `file_size >= 0`, `ends_at > starts_at` where appropriate). Avoid excessive check constraints that make legitimate future changes difficult.

---

## 45. RLS Architecture

RLS SHALL be enabled on protected application tables:
- **profiles:** authenticated user can access own profile, and the profiles of users who share at least one group with them (needed for member lists and "created by" labels)
- **groups:** members can access group
- **group_memberships:** members can see relevant membership; admins can manage membership
- **subjects:** group members can access
- **academic_activities:** group members can access; authorized users can mutate
- **activity_progress:** user can access own progress
- **group_invitations:** group Admins only (see §24A); public access only through the functions in §24B

The exact SQL policies SHALL be written in migration files and reviewed separately.

---

## 46. Group Membership Helper Logic

RLS policies will frequently need to determine if `auth.uid()` is a member of a group. The project may use a database helper function such as `is_group_member(group_id, user_id)` or direct `EXISTS` queries in policies. A helper function is acceptable if it remains secure, does not bypass RLS unexpectedly, has clear behavior, does not create circular policy dependencies, and improves maintainability.

---

## 47. Admin Authorization

A common authorization question is whether the current user is an Admin of a group:
```sql
exists (
    select 1
    from group_memberships
    where group_id = target_group_id
      and user_id = auth.uid()
      and role = 'ADMIN'
)
```
This check SHALL be performed at the database security boundary for admin-only operations.

---

## 48. Activity Authorization

For `academic_activities`:
- **Read access:** user must be a member of `activity.group_id`
- **Creation:** user must be a member of target group
- **Editing/Deleting:** 
  - Any group member: CREATE activity
  - Creator: UPDATE/DELETE own activity
  - Admin: UPDATE/DELETE any group activity

This provides ordinary members flexibility while preserving administrative control. The final policy must match `REQUIREMENTS.md`.

---

## 49. Progress Authorization

Recommended baseline:
- **SELECT:** user can read own progress
- **INSERT:** user can create own progress
- **UPDATE:** user can update own progress
- **DELETE:** user can delete own progress

The system may later allow group-level progress summaries without exposing unnecessary personal details.

---

## 50. Privacy Considerations for Progress

Personal progress can be sensitive within a student group. The database should not automatically expose individual progress to every member unless the product explicitly provides that feature. The MVP should prioritize "My Progress" over "Everyone's Progress". The optional group status modal defined in the requirements should be implemented only with explicit privacy/UX decisions.

---

## 51. Storage Security

Supabase Storage policies SHALL follow the same group authorization model as database records. For a resource where `resource.group_id = Group A`, only authorized Group A members should access its protected file. A publicly accessible bucket SHALL NOT be used for private study-group resources unless the resource is intentionally public.

---

## 52. Storage and Database Consistency

The database and Storage system are separate systems. Failure handling must account for partial success (e.g., if upload succeeds but metadata creation fails, clean up the orphaned file). The final workflow should be chosen based on the frontend/storage API and documented in `API.md`.

---

## 53. Soft Delete vs Hard Delete

MVP should prefer hard deletion for simple entities unless there is a clear need for recovery/auditing (memberships, personal progress, temporary notes, test data). Soft deletion may be appropriate later for announcements, discussions, resources, important academic records, or moderation/audit requirements. No `deleted_at` column should be added merely because it might be useful someday.

---

## 54. Auditability

MVP does not require a complete audit log, but important future administrative operations may require an `audit_logs` table (`id`, `actor_id`, `group_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`). This should only be introduced when moderation, institutional deployment, or security requirements justify it.

---

## 55. Realtime Database Design

Supabase Realtime may subscribe to selected tables (`academic_activities`, `resources`, `hub_notes`, `study_sessions`, `study_session_rsvps`, `discussion_posts`, `discussion_replies`, `notifications`). Realtime subscriptions SHALL be scoped as narrowly as possible. A client viewing Group A should not subscribe to unrelated Group B data. RLS and realtime authorization must be tested together.

---

## 56. Database Views

Views MAY be introduced when they simplify recurring read patterns (e.g., `my_groups`, `upcoming_group_activities`, `my_upcoming_activities`, `group_calendar_events`). Views should not replace straightforward queries without a demonstrated benefit.

---

## 57. Database Functions

Database functions MAY be appropriate for creating a group and creator membership atomically, promoting/demoting members safely, enforcing last-admin protection, complex aggregations, or transactional workflows. They should not become a dumping ground for all application logic.

---

## 58. Triggers

Triggers may be used selectively for `updated_at` maintenance, profile creation after auth signup, or activity progress completion timestamps. Triggers should be documented because they introduce behavior that is not always visible in application code.

---

## 59. Profile Creation

A Supabase Auth signup creates `auth.users`, while the application needs `public.profiles`. A controlled signup flow should ensure a profile exists via an auth trigger or an immediate application-level flow after signup. For reliability, a database trigger is often attractive, but the exact implementation should be evaluated against Supabase guidance and project needs.

---

## 60. Migration Structure

Recommended migration structure:
```text
supabase/
└── migrations/
    ├── 0001_extensions_and_types.sql
    ├── 0002_profiles.sql
    ├── 0003_groups_and_memberships.sql
    ├── 0004_subjects.sql
    ├── 0005_academic_activities.sql
    ├── 0006_activity_progress.sql
    ├── 0007_indexes.sql
    ├── 0008_rls.sql
    └── ...
```
Migrations SHALL be ordered and reproducible.

---

## 61. Migration Rules

AI agents SHALL follow these rules:
- Do not silently rewrite an existing production migration.
- Add a new migration for schema changes.
- Do not manually edit production schema without recording the equivalent migration.
- Test migrations on a safe environment first.
- Review RLS changes carefully.
- Document destructive changes.
- Avoid migrations that cannot be rolled forward safely.

---

## 62. Seed Data

Development seed data MAY include demo users, groups, subjects, activities, and progress. Seed data SHALL be clearly separated from production data. Production credentials and real student information SHALL never be included in seed files.

---

## 63. Test Database

Automated tests SHOULD have a predictable database environment covering constraints, RLS, memberships, role changes, activity access, progress privacy, and deletion behavior. Authorization tests are especially important.

---

## 64. RLS Test Matrix

| Scenario | Expected |
|---|---|
| Anonymous reads private group | Denied |
| Member reads own group | Allowed |
| Member reads unrelated group | Denied |
| Member creates activity in own group | Allowed |
| Member creates activity in unrelated group | Denied |
| Member edits own activity | Allowed |
| Member edits another member's activity | Depends on final policy; recommended denied |
| Admin edits another member's activity | Allowed |
| Member promotes another member | Denied |
| Admin promotes member | Allowed |
| User reads own progress | Allowed |
| User reads unrelated user's progress | Denied unless explicitly exposed |
| User changes own progress | Allowed |
| User changes another user's progress | Denied |

---

## 65. Data Access Patterns

The schema is designed around major access patterns for Users, Groups, Calendars, Dashboards, and Admins. Indexes and query design should support these patterns.

---

## 66. Dashboard Query Consideration

A dashboard may need to retrieve all upcoming activities for groups where `auth.uid()` is a member. The exact implementation can use Supabase relational queries, SQL views, or RPC when justified.

---

## 67. Calendar Query Consideration

A calendar should query only the relevant date range (getting activities for a selected month/date range) rather than downloading every activity ever created. This becomes increasingly important as groups accumulate academic history.

---

## 68. Data Retention

MVP does not require automatic deletion of old academic activities. Historical academic activities may remain available. Future retention policies may archive old Hub Notes, notifications, obsolete resources, or discussion content. Retention should be feature-specific rather than globally deleting data after an arbitrary period.

---

## 69. Privacy Boundaries

The database SHALL distinguish:
- **Public-ish application data:** `display_name`, `avatar`
- **Group-private data:** group details, memberships, subjects, activities, resources, notes, study sessions, discussions
- **Personal data:** individual activity progress

The exact visibility of each field must be enforced through RLS/API behavior.

---

## 70. Avoid Storing Derived Data Unnecessarily

The database should not permanently store values that can safely be calculated (e.g., do not store `days_remaining = 2` because it becomes stale). Store `due_at` and calculate "Due in 2 days" at read/display time. Similarly, avoid storing `is_overdue` unless a specific optimization later proves necessary.

---

## 71. Counters and Aggregates

Avoid manually maintained counters during MVP where possible (e.g., `group.member_count` can become inconsistent). Prefer querying membership count until performance requires an optimization. The same applies to `resource_count`, `activity_count`, and `completed_count`.

---

## 72. Normalization Baseline

The database should generally follow normalized relational design. Avoid repeating `group_name`, `subject_name`, or `creator_name` inside activity rows; instead, use foreign keys and retrieve related data through relationships. Denormalization should be a deliberate performance decision.

---

## 73. Naming Conventions

- **Tables:** `snake_case`, plural nouns (`groups`, `subjects`, `academic_activities`, `activity_progress`)
- **Columns:** `snake_case` (`created_at`, `group_id`, `created_by`, `due_at`)
- **Enums:** `UPPER_SNAKE_CASE` (`ADMIN`, `IN_PROGRESS`, `NOT_STARTED`)

---

## 74. Reserved/Generic Names

Avoid vague table names such as `data`, `items`, `records`, `events`, or `posts` when a domain-specific name is available. Prefer `academic_activities`, `study_sessions`, or `discussion_posts` to make the schema easier for both developers and AI agents to understand.

---

## 75. Database Source-of-Truth Rule

The database schema SHALL be derived from:
$$\text{PROJECT.md} \longrightarrow \text{REQUIREMENTS.md} \longrightarrow \text{ARCHITECTURE.md}$$