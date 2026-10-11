# StudyCircle --- Architecture Specification

**Document:** `ARCHITECTURE.md`\
**Version:** 0.4.0\
**Status:** Active --- Architecture Baseline\
**Parent Sources of Truth:** `docs/PROJECT.md`, `docs/REQUIREMENTS.md`\
**Last Updated:** 2026-10-10\
**Changelog:** v0.4.0 --- Renamed to StudyCircle; replaced the multi-agent roster (§35) with the two-person team (human owner + Claude). v0.3.0 --- Replaced Vue 3 + TypeScript + Vite framework baseline with vanilla HTML, CSS, and JavaScript; retained the Supabase-first backend architecture and no-custom-backend decision.

------------------------------------------------------------------------

## 1. Purpose

This document defines the technical architecture of StudyCircle.

It explains:

-   the major system components;
-   how those components communicate;
-   where business logic belongs;
-   how Supabase is used;
-   how authentication and authorization work;
-   how realtime functionality is introduced;
-   how the system can evolve without unnecessary rewrites.

This document describes **how the system should be structured**, not
every implementation detail.

Detailed database definitions belong in `DATABASE.md`.

Detailed API contracts belong in `API.md`.

Detailed interface behavior belongs in `UI_UX.md`.

Security controls and threat analysis belong in `SECURITY.md`.

------------------------------------------------------------------------

# 2. Architectural Goals

The architecture SHALL prioritize:

1.  **Simplicity** --- appropriate for a student-developed project.
2.  **Security** --- private group data must remain private.
3.  **Maintainability** --- AI agents must be able to understand and
    modify the project safely.
4.  **Scalability** --- the initial version should support a small
    student community while allowing growth.
5.  **Mobile-first UX** --- the application must work well on phones.
6.  **Low operational complexity** --- minimize unnecessary backend
    infrastructure.
7.  **Realtime readiness** --- collaborative features should be able to
    use Supabase Realtime without forcing realtime into every feature.
8.  **Clear separation of responsibilities** --- UI, application logic,
    database access, and authorization should not become tangled.
9.  **Testability** --- core business rules should be testable
    independently of the UI.
10. **AI-agent compatibility** --- the architecture and documentation
    should be predictable enough for an AI coding assistant and the human
    owner to work safely on the same codebase.

------------------------------------------------------------------------

# 3. Architectural Style

StudyCircle SHALL use a **modern client application + managed
backend platform** architecture.

Conceptually:

``` text
                    ┌─────────────────────┐
                    │       Student       │
                    │   Mobile/Desktop    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Frontend App    │
                    │                     │
                    │ UI / Pages / State  │
                    │ Forms / Validation  │
                    └──────────┬──────────┘
                               │
                  ┌────────────┼────────────┐
                  │            │            │
                  ▼            ▼            ▼
             Supabase       Storage      Realtime
               Auth        (Files)       Channels
                  │            │            │
                  └────────────┼────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Supabase PostgreSQL │
                    │                     │
                    │ Data + RLS +        │
                    │ relationships       │
                    └─────────────────────┘
```

The architecture intentionally avoids introducing a traditional custom
REST backend for MVP unless a concrete requirement makes it necessary.

------------------------------------------------------------------------

# 4. Core Architectural Decision

## 4.1 Supabase as Backend Platform

Supabase SHALL be the primary backend platform for the deployed version.

It provides:

-   PostgreSQL database;
-   authentication;
-   Row Level Security;
-   object storage;
-   realtime subscriptions;
-   database functions where appropriate;
-   server-side/edge functionality where appropriate.

This reduces the amount of custom backend infrastructure that must be
maintained.

## 4.2 Why This Architecture

The project is primarily intended to teach and demonstrate:

-   full-stack web development;
-   database design;
-   authentication;
-   authorization;
-   cloud deployment;
-   realtime systems;
-   file storage;
-   security;
-   testing.

Using Supabase allows the project to concentrate on application
architecture rather than building an authentication server, database
server, storage server, and realtime infrastructure from scratch.

------------------------------------------------------------------------

# 5. High-Level Components

The deployed system consists of the following logical components.

``` text
StudyCircle
│
├── Presentation Layer
│   ├── Pages
│   ├── Components
│   ├── Forms
│   ├── Calendar UI
│   └── Responsive Layout
│
├── Application Layer
│   ├── Authentication flows
│   ├── Group operations
│   ├── Activity operations
│   ├── Progress operations
│   ├── Dashboard aggregation
│   ├── Deadline calculations
│   └── Feature-level validation
│
├── Data Access Layer
│   ├── Supabase client
│   ├── Query functions
│   ├── Mutation functions
│   └── Realtime subscriptions
│
├── Supabase Platform
│   ├── Auth
│   ├── PostgreSQL
│   ├── RLS
│   ├── Storage
│   └── Realtime
│
└── Quality / Operations
    ├── Tests
    ├── Environment configuration
    ├── Migrations
    └── Deployment
```

------------------------------------------------------------------------

# 6. Frontend Architecture

**Decision (approved 2026-10-10):** The frontend SHALL use **vanilla HTML, CSS, and JavaScript**. No frontend framework (including Vue, React, Angular, or similar frameworks) is part of the approved baseline. TypeScript is also excluded from the baseline; application code will use standard JavaScript.

The frontend communicates directly with Supabase through the official `supabase-js` client. The client library may be loaded from the officially supported CDN distribution or included as a dependency if a build tool is adopted later. A build tool is not required by this decision. Any later proposal to add a framework or build tool must explain the need and be approved before changing the baseline.

The application SHOULD still use modular files and clear separation of concerns. Vanilla JavaScript does not mean placing all behavior in one large script.

Recommended structure:

``` text
/
├── index.html
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── groups.html
│   └── calendar.html
├── assets/
│   ├── images/
│   └── icons/
├── css/
│   ├── reset.css
│   ├── tokens.css
│   ├── layout.css
│   ├── components.css
│   └── pages/
├── js/
│   ├── app.js
│   ├── config/
│   │   └── supabase.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── groups.service.js
│   │   ├── subjects.service.js
│   │   ├── activities.service.js
│   │   └── progress.service.js
│   ├── features/
│   ├── utils/
│   │   ├── dates.js
│   │   └── validation.js
│   └── pages/
└── README.md
```

This is a recommended starting structure, not a requirement to create every file immediately. The team MAY use JavaScript ES modules where supported by the chosen local/hosting setup. Local development MUST use a local HTTP server rather than relying on `file://` behavior.

------------------------------------------------------------------------

# 7. Layer Responsibilities

## 7.1 Presentation Layer

Responsible for:

-   rendering UI;
-   collecting user input;
-   displaying loading/error/empty states;
-   navigation;
-   responsive behavior;
-   accessibility.

It SHOULD NOT contain complex database authorization logic.

## 7.2 Application Layer

Responsible for:

-   feature workflows;
-   combining multiple data sources;
-   business rules;
-   deadline calculations;
-   transforming database records into UI-friendly data;
-   deciding which operations should happen together.

Example:

``` text
Create Academic Activity
        │
        ├── Validate input
        ├── Verify active group context
        ├── Submit mutation
        ├── Refresh/update relevant state
        └── Display success/error
```

## 7.3 Data Access Layer

Responsible for:

-   communicating with Supabase;
-   executing queries/mutations;
-   handling typed database results;
-   subscribing/unsubscribing from realtime channels;
-   keeping raw Supabase calls out of unrelated UI components.

## 7.4 Database Layer

Responsible for:

-   persistence;
-   relationships;
-   constraints;
-   indexes;
-   database-level authorization;
-   database functions/triggers where appropriate.

------------------------------------------------------------------------

# 8. Supabase Architecture

## 8.1 Authentication

Supabase Auth SHALL manage authentication.

Conceptually:

``` text
Student
   │
   ▼
Supabase Auth
   │
   ├── authenticated session
   │
   ▼
Application
   │
   ▼
PostgreSQL profile/membership data
```

The application SHALL distinguish:

-   authentication: "Who is this user?"
-   authorization: "What is this user allowed to do?"

Authentication alone SHALL NOT grant access to group resources.

------------------------------------------------------------------------

# 9. Authorization Model

The application uses **group-scoped authorization**.

A user's access is primarily determined by their membership in a group.

``` text
User
 │
 ├── Member ───────► Group A
 │
 └── Admin ─────────► Group B
```

A user may have different roles in different groups.

Example:

``` text
User: Alex

Group A → MEMBER
Group B → ADMIN
Group C → MEMBER
```

This means role information SHOULD belong to the **membership
relationship**, not globally to the user.

------------------------------------------------------------------------

# 10. Group Role Model

MVP roles:

``` text
ADMIN
MEMBER
```

The group creator automatically receives:

``` text
ADMIN
```

An Admin may promote another member to Admin.

There may be multiple Admins.

The architecture SHALL avoid a global:

``` text
user.role = admin
```

model because administration is group-specific.

Instead:

``` text
group_memberships
    user_id
    group_id
    role
```

This supports future expansion without redesigning the authorization
model.

------------------------------------------------------------------------

# 11. Row Level Security

Supabase PostgreSQL Row Level Security (RLS) SHALL be a foundational
security boundary.

The frontend SHALL NOT be trusted to enforce private data access.

Conceptually:

``` text
Frontend says:
"Give me activities for Group A"

          │
          ▼

PostgreSQL RLS asks:
"Is this authenticated user a member of Group A?"

       ┌───────────────┐
       │               │
      YES              NO
       │               │
       ▼               ▼
   Return rows       Deny access
```

RLS policies SHALL be designed around actual membership relationships.

UI hiding is not an authorization mechanism.

------------------------------------------------------------------------

# 12. Data Ownership Model

Each important record SHOULD have enough information to determine:

-   which group it belongs to;
-   who created it;
-   when it was created;
-   who may read it;
-   who may modify it.

Example:

``` text
academic_activity
├── id
├── group_id
├── subject_id
├── created_by
├── title
├── type
├── due_at
├── created_at
└── updated_at
```

This enables both authorization and auditing.

------------------------------------------------------------------------

# 13. Core Domain Model

The main domain relationships are:

``` text
USER
 │
 ├───────────────┐
 │               │
 ▼               ▼
PROFILE      GROUP MEMBERSHIP
                 │
                 ▼
               GROUP
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
     SUBJECT  ACTIVITY  RESOURCE
                  │
                  ▼
              PROGRESS
```

Additional later entities:

``` text
GROUP
 ├── HUB NOTE
 ├── STUDY SESSION
 ├── DISCUSSION
 ├── ANNOUNCEMENT
 └── NOTIFICATION
```

The precise schema belongs in `DATABASE.md`.

------------------------------------------------------------------------

# 14. Academic Activity Architecture

Academic activities are first-class records.

Examples:

``` text
Quiz
Assignment
Exam
Project
Recitation
Presentation
Other
```

The architecture SHOULD use a normalized activity model instead of
creating separate database tables for every activity type.

Preferred:

``` text
academic_activities
    type = QUIZ
```

rather than:

``` text
quizzes
assignments
exams
projects
recitations
```

unless a future requirement introduces type-specific fields that justify
separate structures.

------------------------------------------------------------------------

# 15. Personal Progress Architecture

Activity status belongs to the relationship:

``` text
USER ↔ ACTIVITY
```

not directly to the activity.

Example:

``` text
academic_activity
    "Programming 3 Quiz #2"

             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     Alex   Bea   Carlo
      │      │      │
   COMPLETED  IN_PROGRESS  NOT_STARTED
```

This allows every member to independently track progress.

Recommended conceptual entity:

``` text
activity_progress
├── activity_id
├── user_id
├── status
├── updated_at
└── completed_at
```

------------------------------------------------------------------------

# 16. Deadline Architecture

Deadline calculations SHALL use a centralized date/time utility rather
than duplicated logic throughout UI components.

Conceptually:

``` text
due_at
  │
  ▼
deadline utility
  │
  ├── overdue
  ├── due today
  ├── due tomorrow
  ├── due in N days
  └── due in N hours
```

The utility SHALL use the application's documented timezone strategy.

Example:

``` text
2026-10-09 23:59
        │
        ▼
"Due in 2 days"
```

The exact wording may be adjusted by UI/UX specifications, but the
underlying calculation SHALL remain consistent.

------------------------------------------------------------------------

# 17. Calendar Architecture

The calendar SHALL be a presentation of structured events rather than a
separate source of truth for academic activities.

Preferred architecture:

``` text
Academic Activities
        │
        ▼
Calendar Event Mapper
        │
        ▼
Calendar UI
```

This prevents duplicate calendar records for the same
assignment/quiz/exam.

For example:

``` text
academic_activity
       │
       ├── dashboard
       ├── upcoming list
       └── calendar
```

The same underlying activity is presented in different views.

Study sessions may later be represented as their own entity because they
have different behavior from academic deadlines.

------------------------------------------------------------------------

# 18. Dashboard Architecture

The dashboard SHOULD be an aggregation layer.

It should not maintain duplicate copies of activities.

Conceptually:

``` text
                   ┌── Activities
                   │
                   ├── Groups
Dashboard ◄────────┼── Deadlines
                   │
                   ├── Recent changes
                   │
                   └── Future resources/notes
```

The dashboard may combine several queries or optimized database
functions/views.

Performance should be evaluated before introducing complex database
views or RPC functions.

------------------------------------------------------------------------

# 19. Realtime Architecture

Realtime SHALL be introduced selectively.

Not every table requires a realtime subscription.

Good candidates:

-   activity creation/update;
-   study session RSVP changes;
-   resource uploads;
-   discussion posts;
-   notifications;
-   Hub Notes.

Potential MVP approach:

``` text
Normal CRUD
    │
    ▼
Supabase PostgreSQL

Later:
PostgreSQL change
    │
    ▼
Supabase Realtime
    │
    ▼
Subscribed clients
    │
    ▼
UI update
```

Realtime SHALL not replace normal database reads.

The client should be able to recover after:

-   network loss;
-   browser refresh;
-   expired realtime connection;
-   temporary service interruption.

------------------------------------------------------------------------

# 20. File Storage Architecture

Educational files SHALL use Supabase Storage rather than database blobs.

Conceptually:

``` text
Student
   │
   ▼
Frontend upload
   │
   ▼
Supabase Storage
   │
   └── file object

PostgreSQL
   │
   └── resource metadata
```

The database stores metadata such as:

``` text
resource
├── id
├── group_id
├── uploaded_by
├── subject_id
├── title
├── file_path
├── file_name
├── mime_type
├── file_size
└── created_at
```

The file itself belongs in Storage.

Private resources SHALL use protected storage access.

------------------------------------------------------------------------

# 21. Hub Notes Architecture

Hub Notes are deliberately separated from academic activities.

``` text
Academic Activity
    = structured + persistent + official

Hub Note
    = lightweight + temporary + personal/social
```

This separation prevents the calendar and dashboard from becoming
polluted with temporary social posts.

Recommended lifecycle:

``` text
Created
  │
  ▼
Active
  │
  ▼
Expired
```

Expired notes may be automatically hidden from normal queries.

------------------------------------------------------------------------

# 22. Study Session Architecture

Study sessions are calendar-oriented collaborative events.

Conceptually:

``` text
Study Session
├── group
├── creator
├── title
├── topic
├── starts_at
├── ends_at
├── location/link
└── RSVPs
```

They SHOULD remain separate from academic activities because:

``` text
"Programming 3 Quiz"
```

and

``` text
"Group Study — Programming 3"
```

have different semantics and lifecycle behavior.

------------------------------------------------------------------------

# 23. API Strategy

For MVP, the application SHOULD use Supabase's generated database
API/client capabilities rather than building a custom REST API for every
CRUD operation.

Conceptually:

``` text
Frontend
   │
   ▼
Supabase Client
   │
   ▼
PostgREST / Supabase services
   │
   ▼
PostgreSQL + RLS
```

Custom server-side functions/endpoints SHOULD be introduced only when
necessary.

Good reasons include:

-   sensitive server-only operations;
-   privileged workflows;
-   complex transactions;
-   external API secrets;
-   operations that should not be exposed directly to clients;
-   logic that cannot safely be implemented through normal
    client/database access.

------------------------------------------------------------------------

# 24. Database Functions / RPC

Database functions MAY be used for operations that need atomicity or
complex database-side logic.

Examples:

``` text
create_group_with_owner()
promote_member()
remove_member()
create_activity_with_defaults()
```

However, database functions SHALL NOT be introduced simply to make
simple CRUD more complicated.

The simplest secure design should be preferred.

------------------------------------------------------------------------

# 25. Transaction Boundaries

Operations that modify multiple related records and require
all-or-nothing behavior SHOULD be atomic.

Example:

``` text
Create Group
    │
    ├── create group
    └── create creator membership as ADMIN
```

If the application cannot safely guarantee both operations
independently, the workflow should use a database transaction/function.

The final approach SHALL be defined in `DATABASE.md`.

------------------------------------------------------------------------

# 26. State Management

The frontend SHOULD distinguish between:

### Server state

Data originating from Supabase:

-   groups;
-   memberships;
-   subjects;
-   activities;
-   progress;
-   resources;
-   sessions.

### UI state

Temporary interface state:

-   modal open/closed;
-   selected calendar date;
-   active tab;
-   form input;
-   filters;
-   loading state.

### Session state

Authentication/user session information.

The architecture SHALL avoid putting every database record into one
giant global client store.

------------------------------------------------------------------------

# 27. Caching Strategy

MVP SHOULD prefer simple, predictable data fetching.

Caching MAY be introduced where:

-   the same data is repeatedly requested;
-   navigation causes unnecessary refetches;
-   realtime updates need coordinated cache invalidation.

Cache invalidation SHALL not compromise correctness or authorization.

Security-sensitive data should not be cached in a way that allows one
user's data to appear in another user's session.

------------------------------------------------------------------------

# 28. Validation Strategy

Validation should exist at multiple levels.

``` text
UI validation
      │
      ▼
Application validation
      │
      ▼
Database constraints / RLS
```

Example:

``` text
Create Activity

UI:
- title required
- due date valid

Application:
- group selected
- activity type supported

Database:
- group_id valid
- subject relationship valid
- user authorized
```

Client validation improves UX.

Database constraints and RLS provide actual enforcement.

------------------------------------------------------------------------

# 29. Error Handling

Errors SHALL be categorized into understandable states.

Examples:

``` text
Authentication Error
Authorization Error
Validation Error
Not Found
Conflict
Network Error
Storage Error
Unexpected Server Error
```

The UI should translate technical errors into useful user-facing
messages.

Raw database errors, stack traces, secrets, and internal implementation
details SHALL NOT be displayed to users.

------------------------------------------------------------------------

# 30. Environment Configuration

The application SHALL separate environment-specific configuration.

Conceptually:

``` text
.env.local
.env.example
```

Environment variables MAY include:

``` text
SUPABASE_URL
SUPABASE_ANON_KEY
```

The exact environment variable names depend on the chosen setup. In a static frontend, any value embedded in client code is visible to users; only the Supabase project URL and publishable/anon key may be used in the browser. Secret/service-role keys must remain server-side and must never be placed in frontend files.

The Supabase service-role key SHALL NEVER be exposed to browser/client
code.

`.env` files containing secrets SHALL NOT be committed to Git.

An `.env.example` SHOULD document required variables without containing
secrets.

------------------------------------------------------------------------

# 31. Local Development Architecture

The project should support two development modes.

## 31.1 Initial Classroom Mode

The existing XAMPP/local-server workflow may remain useful for
coursework or PHP-based exercises.

``` text
Browser
   │
   ▼
XAMPP
   │
   ├── Apache
   └── Local application
```

## 31.2 StudyCircle Mode

The deployed StudyCircle should use the chosen frontend development
environment and Supabase.

``` text
Browser
   │
   ▼
Frontend development server
   │
   ▼
Supabase project
```

The StudyCircle architecture should not unnecessarily depend on
XAMPP once deployed.

------------------------------------------------------------------------

# 32. Deployment Architecture

The target production architecture is:

``` text
                 Internet
                    │
                    ▼
          ┌──────────────────┐
          │ Frontend Hosting │
          │                  │
          │ Web Application  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │    Supabase      │
          │                  │
          │ Auth             │
          │ PostgreSQL       │
          │ RLS              │
          │ Storage          │
          │ Realtime         │
          └──────────────────┘
```

The exact frontend hosting provider can be decided separately.

The architecture should avoid requiring a permanently running custom
server for MVP unless later requirements justify it.

------------------------------------------------------------------------

# 33. Database Migration Strategy

Database schema changes SHALL be version-controlled.

Preferred workflow:

``` text
Developer
   │
   ▼
Migration file
   │
   ▼
Local/test environment
   │
   ▼
Validation
   │
   ▼
Production Supabase
```

Schema changes SHALL NOT be made manually in production without being
represented in the project's migration history.

This is important because both the human owner and Claude will be modifying the same
project.

------------------------------------------------------------------------

# 34. AI-Agent Development Architecture

Because the human owner and Claude share the work, architecture
decisions must be explicit.

Both are expected to follow this hierarchy:

``` text
PROJECT.md
    │
    ▼
REQUIREMENTS.md
    │
    ▼
ARCHITECTURE.md
    │
    ├── DATABASE.md
    ├── API.md
    ├── UI_UX.md
    ├── SECURITY.md
    └── TESTING.md
```

When documents conflict:

``` text
Human-approved newer decision
        >
PROJECT.md
        >
REQUIREMENTS.md
        >
ARCHITECTURE.md
        >
Specialized documents
        >
Implementation
```

If a specialized document needs to contradict a higher-level decision,
the change must be explicitly proposed.

------------------------------------------------------------------------

# 35. Team Boundaries

The project is built by two people: the **human owner** and **Claude**. Together they cover four roles. The full role split is defined in `PROJECT.md` §27.

| Role | Human owner | Claude |
|---|---|---|
| Architect | Decides | Proposes options and protects the design from drift |
| Developer | Reviews, runs, commits | Implements; also UX/UI concepts and critique |
| QA | Leads: tests on real devices, signs off | Writes tests and checklists; reviews against requirements |
| Debugger | Reproduces and reports | Diagnoses and proposes the smallest fix |

Security review, test design, and release preparation are not separate roles. They are tasks handled inside the roles above, using the checklists in `SECURITY.md`, `TESTING.md`, and `ROADMAP.md`.

The human owner remains the final decision maker.

------------------------------------------------------------------------

# 36. Feature Development Flow

Every major feature SHOULD follow this flow:

``` text
Idea
  ↓
Requirements
  ↓
Architecture impact
  ↓
Database impact
  ↓
API/data-access design
  ↓
UI/UX design
  ↓
Implementation
  ↓
Automated tests
  ↓
QA
  ↓
Security review
  ↓
Performance review
  ↓
Human review
  ↓
Deployment
```

No AI agent should jump directly from idea to production code for a
major feature without considering the source-of-truth documents.

------------------------------------------------------------------------

# 37. Feature Vertical Slices

Features SHOULD be developed as vertical slices where practical.

Example:

``` text
Academic Activities

Requirements
    ↓
Database
    ↓
RLS
    ↓
Data access
    ↓
Application logic
    ↓
Form
    ↓
Calendar integration
    ↓
Dashboard integration
    ↓
Tests
```

This is preferred over building the entire frontend first and connecting
the backend much later.

------------------------------------------------------------------------

# 38. Recommended MVP Module Boundaries

The initial implementation SHOULD be divided into:

``` text
Auth
Groups
Memberships
Subjects
Academic Activities
Activity Progress
Calendar
Dashboard
```

Later modules:

``` text
Resources
Hub Notes
Study Sessions
Notifications
Discussions
Announcements
```

This allows the MVP to become usable before every planned feature
exists.

------------------------------------------------------------------------

# 39. Dependency Direction

The architecture SHOULD follow:

``` text
UI
 ↓
Feature/Application Logic
 ↓
Data Access
 ↓
Supabase
```

Not:

``` text
Database details
 ↓
random UI components
```

UI components should not become tightly coupled to raw database
implementation details.

------------------------------------------------------------------------

# 40. Avoided Architectural Patterns

The project SHOULD avoid:

### 40.1 Giant Components

Avoid pages containing hundreds or thousands of lines of mixed UI,
database calls, validation, and business logic.

### 40.2 Database Calls Everywhere

Avoid direct Supabase queries scattered throughout every component.

### 40.3 UI-Only Security

Never assume hiding a button prevents unauthorized access.

### 40.4 Duplicate Data Sources

Do not maintain separate calendar copies of activities unless there is a
justified requirement.

### 40.5 Premature Microservices

The MVP does not need microservices.

### 40.6 Premature Custom Backend

Do not create a custom API server simply because traditional full-stack
applications commonly have one.

### 40.6a Decision Record: Laravel Rejected (2026-10-08)

A Laravel + Inertia.js + Vue 3 stack was proposed as a candidate baseline
and evaluated during planning. It was **rejected** in favor of the
Supabase-first architecture already described in this document.

Reasons:

-   It would introduce a custom backend application server, which
    Section 3 and Section 40.6 already identify as something to avoid
    for MVP absent a concrete requirement. No such requirement was
    identified at the time of this decision.
-   It would create two authorization layers (Laravel
    middleware/policies and PostgreSQL RLS) instead of one, increasing
    the risk of the two drifting out of sync.
-   Supabase Realtime and Supabase Storage are designed for direct,
    RLS-gated client access; routing them through a custom backend adds
    a proxy layer with no corresponding security or functional benefit.
-   `ROADMAP.md` (F7--F9) already assumes Supabase Auth + RLS as the
    complete authorization model.

If a genuine future requirement needs server-side logic that RLS cannot
express (privileged operations, external API secrets, complex
transactions), the existing escape hatch is a **Supabase Edge Function**
(see Section on custom server-side functions), introduced only when that
specific need is identified — not a general-purpose backend framework
adopted speculatively.

This entry supersedes any future recommendation to adopt Laravel,
Django, Express, or a similar custom backend framework unless this
document is updated again with an approved, documented justification.
The later vanilla frontend decision in Section 6 also supersedes the
Vue 3 + TypeScript candidate stack mentioned in this historical record.

### 40.7 Overuse of Realtime

Realtime should be used where it creates meaningful user value.

### 40.8 Overengineering

The architecture should remain understandable to a BSIT student
maintaining the project.

------------------------------------------------------------------------

# 41. Scalability Strategy

The initial target is a small number of users.

The architecture should nevertheless avoid decisions that make moderate
growth unnecessarily difficult.

Growth path:

``` text
Phase 1
Small class/group
      │
      ▼
Phase 2
Multiple study groups
      │
      ▼
Phase 3
Larger student community
      │
      ▼
Future
School/community scale
```

Potential scaling measures later:

-   pagination;
-   database indexes;
-   query optimization;
-   caching;
-   optimized realtime subscriptions;
-   storage lifecycle policies;
-   background processing;
-   database functions;
-   server-side aggregation;
-   rate limiting;
-   monitoring.

These should be introduced when needed rather than prematurely.

------------------------------------------------------------------------

# 42. Observability

The production application SHOULD eventually provide enough information
to diagnose:

-   authentication failures;
-   authorization failures;
-   database errors;
-   storage failures;
-   unexpected frontend errors;
-   realtime connection failures;
-   performance problems.

MVP may rely on basic platform logs and client-side error reporting.

A dedicated observability stack may be introduced later.

------------------------------------------------------------------------

# 43. Backup & Recovery

Database and file recovery SHOULD rely primarily on Supabase/platform
capabilities during the early project stages.

The project SHOULD additionally maintain:

-   version-controlled schema migrations;
-   source code in Git;
-   documented environment configuration;
-   documented deployment steps.

The project should never rely on an undocumented manual production
configuration.

------------------------------------------------------------------------

# 44. Architecture Decision Records

Significant architectural choices SHOULD be documented.

Recommended future structure:

``` text
docs/
└── decisions/
    ├── ADR-001-supabase.md
    ├── ADR-002-authentication.md
    ├── ADR-003-rbac-model.md
    └── ADR-004-realtime-strategy.md
```

An ADR should explain:

``` text
Context
Decision
Alternatives
Reasoning
Consequences
```

This is especially valuable when more than one contributor works on the
project.

------------------------------------------------------------------------

# 45. Technology Decision Baseline

The architecture currently establishes:

  -----------------------------------------------------------------------
  Area                                Baseline
  ----------------------------------- -----------------------------------
  Backend platform                    Supabase (no custom backend
                                      application server)

  Database                            PostgreSQL via Supabase

  Authentication                      Supabase Auth

  Authorization                       PostgreSQL RLS (sole
                                      authorization boundary)

  File storage                        Supabase Storage

  Realtime                            Supabase Realtime

  Frontend                            Vanilla HTML + CSS + JavaScript
                                      (no framework; approved 2026-10-10)

  Type system                         Standard JavaScript (no TypeScript
                                      in the approved baseline)

  Build tool                          None required; may be proposed later
                                      as a separate decision

  Deployment                          Static frontend hosting + Supabase

  Local development                   Local HTTP server + browser;
                                      Supabase services as appropriate

  Version control                     Git

  Documentation                       Markdown

  Primary client model                Responsive web application

  Architecture style                  Vanilla multi-page or client-routed
                                      web frontend + managed Supabase
                                      backend, no intermediary app server
  -----------------------------------------------------------------------

The vanilla frontend decision is the approved baseline (Section 6). No framework or build tool is selected. The frontend hosting provider remains an open implementation decision.

------------------------------------------------------------------------

# 46. Architecture Constraints

The following are architectural constraints:

1.  Private group data must be protected at the database level.
2.  Group roles must be group-specific.
3.  The group creator must become Admin automatically.
4.  Multiple Admins must be supported.
5.  Academic activities are shared group records.
6.  Activity progress is user-specific.
7.  Calendar views must derive from structured records rather than
    duplicate them unnecessarily.
8.  Hub Notes must remain distinct from official academic activities.
9.  Supabase service-role credentials must never be exposed to the
    client.
10. The system must remain mobile-first.
11. Schema changes must be version-controlled.
12. Major architectural changes require explicit documentation.

------------------------------------------------------------------------

# 47. Security Architecture Summary

Security boundaries:

``` text
                    ┌──────────────────────┐
                    │      Browser         │
                    │   Untrusted Client   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Supabase Auth        │
                    │ Identity / Session   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PostgreSQL + RLS     │
                    │ Actual authorization │
                    └──────────┬───────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
                  Database            Storage
```

The browser is never trusted to enforce permissions.

------------------------------------------------------------------------

# 48. Architecture Validation Checklist

Before implementation of a major feature, verify:

``` text
[ ] Does it have a requirement ID?
[ ] Does it introduce a new entity?
[ ] Does the database need modification?
[ ] Does RLS need modification?
[ ] Does the API/data-access layer need modification?
[ ] Does the UI need modification?
[ ] Does it affect mobile UX?
[ ] Does it affect realtime?
[ ] Does it affect storage?
[ ] Does it affect authentication/authorization?
[ ] Does it require new tests?
[ ] Does it require security review?
[ ] Does it affect existing features?
[ ] Does documentation need updating?
```

------------------------------------------------------------------------

# 49. Definition of Architectural Completion

The architecture is considered sufficiently defined for implementation
when:

-   core modules are identified;
-   data ownership is clear;
-   authentication boundaries are clear;
-   authorization boundaries are clear;
-   Supabase responsibilities are clear;
-   frontend responsibilities are clear;
-   realtime strategy is defined;
-   file storage strategy is defined;
-   migration strategy is defined;
-   AI-agent boundaries are documented;
-   unresolved decisions are explicitly identified.

------------------------------------------------------------------------

# 50. Next Documents

After this document, the recommended sequence is:

``` text
ARCHITECTURE.md
      ↓
DATABASE.md
      ↓
API.md
      ↓
UI_UX.md
      ↓
SECURITY.md
      ↓
TESTING.md
      ↓
ROADMAP.md
```

`DATABASE.md` is the next critical technical document because the
Supabase/PostgreSQL schema, relationships, constraints, indexes, RLS
strategy, and migration structure must be established before substantial
implementation begins.

------------------------------------------------------------------------

## End of Architecture Specification
