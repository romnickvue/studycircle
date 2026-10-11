# StudyCircle — Project Source of Truth

**Document:** `PROJECT.md`  
**Version:** 0.2.1  
**Status:** Active — Product/Architecture Baseline  
**Last Updated:** 2026-10-10  
**Primary Decision Maker:** Human owner/student  
**Purpose:** Single source of truth for the StudyCircle project, for the human owner, and for Claude as development partner.

---

## 0. Source-of-Truth Rule

This document is the **highest-level project authority**.

Claude, the human owner, and all future documentation must follow this document unless the human project owner explicitly approves a change.

### Rules

1. Do not invent features that contradict this document.
2. Do not silently change architecture, database behavior, roles, permissions, or UX requirements.
3. If implementation reveals a necessary change, propose it first.
4. Approved changes must be reflected in this document.
5. More detailed documents may expand this specification but may not contradict it.
6. Code is not the source of truth for intended behavior; the documentation is.
7. If two documents disagree, `docs/PROJECT.md` wins until the conflict is resolved.
8. The human owner has final authority over architecture, features, scope, and releases.

### Documentation hierarchy

```text
docs/PROJECT.md       ← MASTER / SOURCE OF TRUTH
       │
       ├── REQUIREMENTS.md (MVP)
       ├── ARCHITECTURE.md (MVP)
       ├── DATABASE.md (MVP)
       ├── API.md (Later)
       ├── UI_UX.md (MVP)
       ├── SECURITY.md (Later)
       ├── TESTING.md (Later)
       └── ROADMAP.md (MVP)
```

Detailed documents must reference this file rather than redefining project-wide decisions independently.

---

# 1. Product Definition

## 1.1 Product Name

**StudyCircle**

Working tagline:

> **Your class. Your work. Your resources. Your study group — all in one place.**

## 1.2 Product Vision

StudyCircle is a collaborative academic workspace where classmates can organize schoolwork, track academic activities, share learning resources, schedule group study sessions, communicate, and see what needs attention next.

The product is intentionally focused on **academic collaboration**, not becoming a general-purpose social network.

## 1.3 Target Users

### Initial target

Students belonging to a specific class/section.

Example:

> BSIT 2A Study Hub

The first release should work extremely well for a small class or section.

### Future expansion

The product may later support:

- Multiple sections
- Multiple courses/year levels
- School-wide groups
- Public/discoverable study groups
- Cross-school communities

Do not build these expansion features into MVP unless explicitly approved.

---

# 2. Core Product Principles

1. **Academic usefulness first.**
2. **The group is the center of collaboration.**
3. **Personal dashboards summarize what matters to each student.**
4. **Academic activities are structured and persistent.**
5. **Social/personal updates are lightweight and separate from academic records.**
6. **Realtime behavior should be used where it improves collaboration.**
7. **Privacy and authorization are mandatory, especially with Supabase RLS.**
8. **MVP must remain finishable by a student developer.**
9. **Features must earn their complexity.**
10. **Mobile-first experience is strongly preferred.**

---

# 3. Product Model

The application has two major layers.

## 3.1 Personal layer

Each student has:

- Personal dashboard
- Personal task/status view
- Personal calendar aggregation
- Joined groups
- Profile
- Notifications

## 3.2 Group layer

Each study group contains:

- Group overview
- Subjects
- Academic activities
- Calendar/events
- Schoolwork
- Shared resources
- Study sessions
- Discussions
- Announcements
- Hub Notes
- Members

### Conceptual structure

```text
User
 │
 ├── Personal Dashboard
 │
 └── Study Groups
       │
       ├── Subjects
       ├── Academic Activities
       ├── Calendar
       ├── Schoolwork
       ├── Resources
       ├── Study Sessions
       ├── Discussions
       ├── Announcements
       ├── Hub Notes
       └── Members
```

---

# 4. User Roles & Permissions

## 4.1 Owner / Admin

The person who creates the group is automatically an Admin.

Admins may:

- Edit group information
- Manage group membership
- Invite/add members
- Remove members
- Promote members to Admin
- Demote other admins where permitted
- Moderate group content
- Manage announcements
- Manage group settings

### Important

There may be multiple Admins.

The original creator remains the group owner unless an ownership-transfer feature is later introduced.

## 4.2 Member

Members may:

- View group content
- Add academic activities
- Create/update permitted schoolwork
- Upload resources
- Create study sessions
- Create Hub Notes
- Participate in discussions
- Update their own activity/task progress
- Attend/RSVP to study sessions

## 4.3 Future roles

Do not implement initially:

- Teacher
- Moderator
- School administrator
- Super administrator

These can be considered in a future version.

---

# 5. Core Feature Set

## 5.1 Authentication

MVP:

- Sign up
- Sign in
- Sign out
- Session persistence
- Basic profile
- Password/account recovery if supported by chosen auth flow

Supabase Auth is the intended authentication provider.

---

## 5.2 Study Groups

MVP:

- Create group
- View group
- Join group
- Leave group
- Invite/join mechanism
- View members
- Admin management
- Group name
- Group description
- Group image/avatar (optional if time permits)

Example:

```text
BSIT 2A Study Hub

Description:
A collaborative study space for BSIT 2A.

Members: 28
Admins: 2
Subjects: 5
```

---

## 5.3 Subjects

A group may contain multiple subjects.

Example:

```text
BSIT 2A Study Hub
│
├── Programming 3
├── Web Development
├── Database Management
└── Mathematics
```

Each academic activity may optionally belong to a subject.

---

# 6. Academic Activities

Academic activities are structured, persistent records.

### Activity types

MVP:

- Quiz
- Assignment
- Exam
- Project
- Recitation
- Presentation
- Other

### Activity fields

Conceptually:

```text
title
description
subject
type
start date/time (optional)
due date/time (optional)
created by
created at
updated at
attachments (optional)
status/visibility metadata
```

### Important product rule

Any group member may create an academic activity.

The activity is treated as an official group academic record once created.

Future versions may introduce confirmation/moderation if needed.

### Example

```text
Programming 3 Quiz #2

Subject:
Programming 3

Type:
Quiz

Date:
October 15, 2026

Time:
9:00 AM

Description:
Functions, Arrays, and Forms

Created by:
Mark
```

---

# 7. Task / Progress System

Members should be able to track their own progress on relevant academic activities.

Base status:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
```

The system should calculate deadline urgency.

Examples:

```text
Due in 5 days
Due in 2 days
Due tomorrow
Due today
Overdue
```

### Requirement

**Relative deadline labels are a must-have feature.**

The UI should not rely only on raw dates.

Example:

> PHP Activity #4  
> **Due in 2 days**

### Group progress

When appropriate, an activity can show individual member progress:

```text
MEMBER PROGRESS

Romnick   ✓ Completed
Mark      • In Progress
John      ○ Not Started
Sarah     ✓ Completed

2 / 4 completed
```

This feature may be limited to V1/V2 depending on implementation complexity.

---

# 8. Calendar

The calendar is a major product feature.

It should aggregate relevant academic events and group events.

### Calendar event categories

- Academic activities
- Exams
- Assignments
- Projects
- Recitations
- Presentations
- Study sessions
- Other group events

### Required behavior

- Month view
- Event list/day view
- Click/tap event for details
- Upcoming events
- Deadline urgency
- Mobile-friendly interaction

Example:

```text
October 15

9:00 AM
🔴 Programming 3 Quiz #2

7:00 PM
🔵 Programming 3 Group Study

11:59 PM
🟡 PHP Activity #4
```

### Realtime requirement

Calendar changes should update in realtime where practical.

---

# 9. Dashboard

The dashboard is the primary personal landing page.

## Required sections

### Today

Show:

- Today's activities
- Today's deadlines
- Today's study sessions

### Upcoming

Show upcoming items ordered by urgency.

### Due soon

Examples:

```text
Due in 2 days
Due tomorrow
Due today
Overdue
```

### My Groups

Show groups the user belongs to.

### Recent Resources

Show recently uploaded useful resources.

### Hub Notes

Show relevant active notes from the user's groups.

---

# 10. Hub Notes

Hub Notes are intentionally separate from academic activities.

They are lightweight social/personal updates inspired by short-form status/notes features.

Examples:

> "Anyone studying Programming 3 tonight?"

> "I think the quiz covers PHP functions."

> "Finally finished the database project 😭"

### MVP/V2 behavior

- Short text
- Author
- Group association
- Created timestamp
- Expiration
- Basic display

Recommended default expiration:

> **24 hours**

Do not turn Hub Notes into a full social feed.

Potential future features:

- Reactions
- Replies
- Mentions

---

# 11. Resources / Academic Library

Students can share learning materials.

### Supported resource concepts

- PDF
- Document
- Image
- Link
- Other supported educational files

### Resource metadata

```text
title
description
file
file type
size
subject
tags
uploaded by
uploaded at
group
```

### Example

```text
PHP Functions Reviewer

PDF
Uploaded by Romnick
October 6

Tags:
#PHP
#Functions
#Programming3

[Preview]
[Download]
```

### Future enhancements

- Search
- Tags
- Favorites/saves
- Comments
- Ratings
- Resource versioning
- Preview
- Download counts

---

# 12. Study Sessions

Students can organize collaborative study sessions.

Example:

```text
Programming 3 Group Study

October 8
7:00 PM – 9:00 PM

Topic:
PHP Functions & Arrays

Location:
Discord

Going: 5
Maybe: 2
```

### MVP/V2 capabilities

- Create session
- Date/time
- Topic
- Location/link
- Creator
- RSVP
- Going
- Maybe
- Not attending

Study sessions should appear on the group calendar.

---

# 13. Discussions

Discussions are planned for Phase 3.

Purpose:

- Ask academic questions
- Discuss lessons
- Clarify assignments
- Discuss reviewers
- Share useful explanations

Potential structure:

```text
Discussion
 ├── Post
 ├── Replies
 └── Reactions (future)
```

Do not build a general social-media feed.

---

# 14. Announcements

Admins may publish important group announcements.

Examples:

> "Programming 3 quiz moved to Friday."

> "Please upload your project files before 8 PM."

Announcements should be distinguishable from normal discussion content.

---

# 15. Notifications

Planned after core MVP.

Potential notification events:

- Added to group
- Promoted to admin
- New academic activity
- Upcoming deadline
- Resource uploaded
- Study session created
- Mentioned in discussion
- Announcement posted

Notifications should not become noisy.

---

# 16. Realtime

Supabase Realtime should be used selectively.

Good candidates:

- New group activities
- Calendar changes
- New resources
- Study-session RSVP changes
- Discussions
- Announcements
- Notifications
- Presence/online status if eventually needed

Do not force realtime into every database operation.

---

# 17. High-Level Database Model

Initial conceptual schema:

```text
profiles
    │
    ├───────────────┐
    │               │
    ▼               ▼
group_members    personal data
    │
    ▼
groups
    │
    ├── subjects
    │
    ├── activities
    │      │
    │      └── member_activity_status
    │
    ├── calendar_events
    │
    ├── resources
    │
    ├── study_sessions
    │      │
    │      └── study_session_members
    │
    ├── discussions
    │      └── discussion_replies
    │
    ├── announcements
    │
    └── hub_notes
```

This is a conceptual model, not yet the final SQL schema.

The detailed schema belongs in `DATABASE.md`.

---

# 18. Supabase Architecture

Supabase is the intended backend platform.

## Services

### Supabase Auth

Responsible for:

- Authentication
- Sessions
- User identity

### PostgreSQL

Responsible for:

- Users/profile metadata
- Groups
- Memberships
- Subjects
- Activities
- Progress
- Events
- Resources metadata
- Study sessions
- Discussions
- Announcements
- Hub Notes
- Notifications

### Supabase Storage

Responsible for:

- PDFs
- Images
- Documents
- Other educational files

### Supabase Realtime

Responsible for selected collaborative updates.

### Row Level Security

Mandatory.

Every protected table/storage operation must be reviewed for authorization.

---

# 19. Security Principles

Security is not a post-development feature.

Minimum security requirements:

1. Users can only access data they are authorized to access.
2. Group data must be protected by membership.
3. Admin-only actions must be enforced server-side/database-side, not merely hidden in the UI.
4. Never expose Supabase service-role keys in frontend code.
5. Storage buckets/policies must enforce authorization.
6. Users must not be able to modify another user's progress unless explicitly authorized.
7. Input must be validated.
8. File uploads must have size/type restrictions.
9. Sensitive errors must not leak implementation details.
10. RLS policies must be tested.

---

# 20. UX Principles

## Mobile-first

The first target is a student using a phone.

Requirements:

- Responsive layout
- Touch-friendly controls
- Bottom navigation where appropriate
- Readable cards
- Simple forms
- Calendar usable on small screens
- Uploading files from mobile should be considered

## Visual hierarchy

Important information should be immediately visible:

1. What do I have today?
2. What is due soon?
3. What changed?
4. What should I do next?

## Avoid information overload

The dashboard should not look like an administration panel.

---

# 21. Page / Route Map

Initial route plan:

```text
/
├── /login
├── /register
├── /dashboard
├── /profile
│
├── /groups
│   ├── /create
│   └── /:groupId
│       ├── /overview
│       ├── /calendar
│       ├── /activities
│       ├── /schoolwork
│       ├── /resources
│       ├── /study-sessions
│       ├── /discussions
│       ├── /announcements
│       └── /members
│
├── /calendar
├── /tasks
└── /notifications
```

Exact routing depends on the selected frontend architecture.

---

# 22. MVP Scope

## Phase 1 — MVP

### Must have

- Authentication
- Profiles
- Create group
- Join group
- Group membership
- Admin role
- Subjects
- Academic activities
- Activity types
- Due dates
- Deadline urgency
- Calendar
- Personal dashboard
- Personal progress status
- Basic group overview

### Should have if feasible

- Group invitations
- Member progress overview
- Basic file/resource uploads
- Basic mobile optimization

### Explicitly NOT required for MVP

- Chat
- AI features
- Advanced social feed
- Ratings
- Advanced analytics
- Calendar integrations
- Complex permissions
- Teacher accounts
- School-wide discovery

---

# 23. Phase 2 — Collaboration

- Resource library
- PDF/document/image uploads
- Study sessions
- RSVP
- Hub Notes
- Better task tracking
- Member progress
- Realtime group updates
- Basic notifications

---

# 24. Phase 3 — Social/Communication

- Discussions
- Replies
- Announcements
- Mentions
- Reactions
- Notification center
- More realtime features

---

# 25. Phase 4 — Academic Intelligence

Potential future features:

- Question bank
- Practice quizzes
- Analytics
- AI-assisted reviewer generation
- AI-assisted summarization
- Resource organization
- Smart study planning

These features are intentionally outside the initial scope.

---

# 26. Development Workflow

The project will follow this pipeline:

```text
1. Idea
   ↓
2. Requirements
   ↓
3. Architecture
   ↓
4. UI/UX Design
   ↓
5. Implementation
   ↓
6. Automated Tests
   ↓
7. QA
   ↓
8. Security Audit
   ↓
9. Performance Audit
   ↓
10. Human Review
   ↓
11. Deploy
```

No feature should skip directly from idea to implementation for significant architectural work.

---

# 27. Development Team

The project is built by a two-person team: **the human owner and Claude**.

Together they cover four roles: Architect, Developer, QA, and Debugger. The human owner always has the final say.

## 27.1 Architect (shared)

- Requirements and product definition
- System architecture and database planning
- Feature prioritization and scope control
- Security review
- Documentation

**Claude** proposes options with trade-offs and protects the design from feature drift.
**Human owner** decides which option is adopted.

## 27.2 Developer (Claude leads)

**Claude:**

- Implementation (frontend, Supabase integration, database, components)
- Refactoring and code quality
- Test implementation
- UX/UI concepts, critique, responsive design suggestions, accessibility review

Claude implements the approved architecture rather than inventing a separate one.

**Human owner:**

- Reviews the code
- Runs it locally
- Commits to Git

## 27.3 QA (human leads)

**Human owner:**

- Tests on a real phone and desktop
- Walks through the acceptance scenario (Section 35)
- Signs off on "Done"

**Claude:**

- Writes automated tests and a manual QA checklist
- Reviews implementation against requirements and security rules
- Looks for edge cases and inconsistencies

## 27.4 Debugger (shared)

**Human owner:**

- Reproduces the bug
- Reports exact steps, expected vs. actual behavior, and error messages

**Claude:**

- Diagnoses the cause
- Proposes the smallest fix
- Explains why it broke

---

# 28. Human Owner — Final Decision Maker

The human project owner has final authority.

The human must approve:

- Major architecture changes
- Database changes
- New major features
- Removing requirements
- Security exceptions
- Framework changes
- Production deployment
- Final release

Claude's recommendations are advisory.

---

# 29. Collaboration Protocol

## Before coding

Claude must have access to:

- `PROJECT.md`
- `REQUIREMENTS.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `API.md`
- `UI_UX.md`
- Relevant task/issue description

## When designing UX

- Existing requirements
- Existing routes
- Existing components
- Existing design system

It must identify conflicts instead of silently changing behavior.

## When implementing

Claude should:

1. Read the relevant docs.
2. Identify dependencies.
3. State the implementation plan.
4. Implement the smallest coherent change.
5. Run tests/checks.
6. Report files changed.
7. Report known limitations.
8. Avoid unrelated refactors.

## When testing

The human owner and Claude should compare implementation against:

- Requirements
- Acceptance criteria
- Security requirements
- Edge cases

---

# 30. Change Management

Every proposed significant change should follow:

```text
PROPOSAL
   ↓
Why is this needed?
   ↓
What changes?
   ↓
What existing behavior is affected?
   ↓
Security impact?
   ↓
Database impact?
   ↓
UX impact?
   ↓
Approve / Reject
   ↓
Update PROJECT.md
   ↓
Update detailed docs
   ↓
Implement
```

Do not allow documentation drift.

---

# 31. Definition of Done

A feature is not complete merely because the code works once.

A feature is Done when:

- Requirements are satisfied.
- UI works on mobile.
- Happy path works.
- Error cases are handled.
- Authorization is correct.
- RLS/policies are reviewed where applicable.
- Database migrations are documented.
- Tests/checks pass.
- No known critical bugs remain.
- Documentation is updated.
- Human owner has reviewed it.

---

# 32. Recommended Repository Structure

```text
PROJECT/
│
├── docs/
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── UI_UX.md
│   ├── SECURITY.md
│   ├── TESTING.md
│   └── ROADMAP.md
│
├── src/
│   ├── frontend/
│   └── backend/
│
├── tests/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── README.md
└── .env.example
```

The exact frontend/backend structure may change after the architecture decision.

---

# 33. Technology Direction

## Confirmed

- Supabase backend platform
- PostgreSQL database
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Git/GitHub
- Production deployment outside XAMPP

## Still requires architecture decision

- Frontend framework
- Build tool
- Hosting provider
- Whether a separate backend server is necessary
- File processing strategy
- Email/notification provider

### Important

Do not introduce a separate traditional backend server unless there is a clear requirement.

Supabase can serve as the backend platform for the initial application.

---

# 34. Initial Non-Functional Requirements

## Performance

- Fast initial dashboard
- Avoid unnecessary database requests
- Paginate large resource/discussion lists
- Optimize uploaded files where appropriate
- Use realtime selectively

## Reliability

- Handle network failures gracefully
- Show loading states
- Show empty states
- Show error states
- Avoid duplicate submissions

## Accessibility

- Keyboard-accessible controls
- Appropriate labels
- Sufficient contrast
- Semantic HTML where applicable
- Clear focus states

## Responsiveness

Primary target:

> Mobile phone

Secondary:

> Tablet / desktop

---

# 35. Initial Acceptance Criteria

The MVP should allow a student to complete this scenario:

```text
1. Register
   ↓
2. Create profile
   ↓
3. Create "BSIT 2A Study Hub"
   ↓
4. Invite classmates
   ↓
5. Create subjects
   ↓
6. Add "Programming 3 Quiz #2"
   ↓
7. Add due date/time
   ↓
8. See it on the group calendar
   ↓
9. See it on personal dashboard
   ↓
10. See "Due in X days"
   ↓
11. Open the activity
   ↓
12. Mark personal status
   ↓
13. Other members see their own status
```

If this workflow works reliably, the core product is alive.

---

# 36. Example User Journey

### Morning

Student logs in.

```text
Good morning!

Today:
🔴 Programming 3 Quiz — 9:00 AM

Due soon:
🟡 PHP Activity — Due in 2 days
```

### During class

Someone creates:

> "Database Assignment — Due Friday"

It immediately appears on the group calendar.

### Afternoon

Another student uploads:

> "Database Normalization Reviewer.pdf"

Members can access it from Resources.

### Evening

Student creates:

> "Programming 3 Study Session — 7 PM"

Classmates RSVP.

### Later

Someone posts a Hub Note:

> "Anyone still working on the PHP activity?"

This is the intended product experience.

---

# 37. Anti-Scope-Creep Rules

Do not add a feature simply because it sounds cool.

Before adding a feature ask:

1. Does it directly help students organize or collaborate academically?
2. Does it support the core workflow?
3. Can it be implemented without destabilizing the MVP?
4. Does it introduce significant security/privacy complexity?
5. Is it necessary now or merely interesting?

If the answer is mostly "interesting," put it in the future backlog.

---

# 38. Current Project Status

```text
PRODUCT CONCEPT       ✓ Established
TARGET USERS          ✓ Established
GROUP MODEL           ✓ Established
ROLES                 ✓ Established
CORE FEATURES         ✓ Established
PHASES                ✓ Established
TEAM (Human + Claude)  ✓ Established
WORKFLOW              ✓ Established

DATABASE SCHEMA       → Next
ARCHITECTURE          → Next
TECH STACK             → Next
UI/UX SYSTEM           → Next
API CONTRACTS          → Next
SECURITY POLICIES      → Next
TEST STRATEGY          → Next
IMPLEMENTATION         → Later
```

---

# 39. Immediate Next Steps

The next design session should produce, in this order:

### 1. `REQUIREMENTS.md`

Turn the product concept into numbered functional requirements.

### 2. `ARCHITECTURE.md`

Define:

- Frontend architecture
- Supabase architecture
- Data flow
- Authentication flow
- Realtime flow
- Storage flow
- Deployment architecture

### 3. `DATABASE.md`

Design the actual PostgreSQL schema:

- Tables
- Columns
- Relationships
- Primary keys
- Foreign keys
- Constraints
- Indexes
- RLS policies
- Storage buckets

### 4. `UI_UX.md`

Define:

- Navigation
- Screens
- Components
- Mobile behavior
- Design system
- Empty/loading/error states

### 5. `API.md`

Define application-level data operations and Supabase interactions.

### 6. `SECURITY.md`

Define:

- RLS strategy
- Storage policies
- Auth rules
- Validation
- Threat model
- Security checklist

### 7. `TESTING.md`

Define:

- Unit tests
- Integration tests
- RLS tests
- UI tests
- Acceptance tests
- Manual QA checklist

### 8. `ROADMAP.md`

Turn the phases into implementation milestones.

---

# 40. Golden Rule

> **Build the smallest version that proves the concept, then expand it without breaking the foundation.**

StudyCircle should first become an excellent tool for **one class**.

Once that works reliably, the architecture can grow to support many classes, courses, sections, and eventually schools.

---

## End of Source of Truth
