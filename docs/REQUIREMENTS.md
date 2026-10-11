# StudyCircle --- Requirements Specification

**Document:** `REQUIREMENTS.md`\
**Version:** 0.1.1\
**Status:** Active --- Requirements Baseline\
**Parent Source of Truth:** `docs/PROJECT.md`\
**Last Updated:** 2026-10-10

------------------------------------------------------------------------

## 1. Purpose

This document converts the StudyCircle product concept into precise,
testable functional and non-functional requirements.

`PROJECT.md` defines the overall product vision and scope. This document
defines **what the system must do**. Implementation details belong in
`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `UI_UX.md`, `SECURITY.md`,
and `TESTING.md`.

### Requirement language

-   **MUST / SHALL** --- mandatory.
-   **SHOULD** --- strongly recommended.
-   **MAY** --- optional.
-   **MVP** --- Phase 1.
-   **V2/V3** --- later phases.

## 2. Product Scope

### 2.1 MVP Goal

The MVP shall allow students to create accounts, create and join study
groups, manage membership and administrators, organize groups by
subjects, create academic activities, track personal progress, view
activities on a calendar, see upcoming deadlines, see relative deadline
urgency, and collaborate in a basic group workspace.

### 2.2 Out of MVP Scope

Teacher accounts, school-wide discovery, public social networking,
realtime chat, AI-generated reviewers/quizzes, advanced analytics,
external calendar synchronization, complex permission hierarchies,
resource ratings, and a full social-media feed are outside MVP.

## 3. Actors

### Visitor

Can access public/authentication pages, register, and sign in. Cannot
access protected group data.

### Student

Can maintain a profile, create/join groups, view authorized groups, use
the dashboard, create academic activities, manage personal progress, and
perform member-level actions.

### Group Admin

The group creator automatically becomes Admin. Admins can manage group
information and membership, promote members to Admin, remove members
where permitted, and moderate group content. A group may have multiple
Admins.

### System

Handles authentication, authorization, deadline calculations, calendar
aggregation, persistence, storage, notifications, and realtime
synchronization where enabled.

## 4. Authentication & Accounts

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  AUTH-001                The system SHALL allow  MVP
                          students to register.   

  AUTH-002                The system SHALL allow  MVP
                          registered students to  
                          sign in securely.       

  AUTH-003                The system SHALL allow  MVP
                          authenticated users to  
                          sign out.               

  AUTH-004                The system SHALL        MVP
                          maintain authenticated  
                          sessions according to   
                          the selected auth       
                          strategy.               

  AUTH-005                Protected routes SHALL  MVP
                          reject unauthenticated  
                          users.                  

  AUTH-006                Account/password        MVP
                          recovery SHOULD be      
                          provided where          
                          supported by the auth   
                          provider.               

  AUTH-007                Each account SHALL have MVP
                          a unique system         
                          identity.               

  AUTH-008                Users SHALL have a      MVP
                          basic profile           
                          containing at least a   
                          display name and        
                          identifier; avatar is   
                          optional.               

  AUTH-009                Authentication SHALL    MVP
                          NOT by itself grant     
                          access to another       
                          user's private data.    
  -----------------------------------------------------------------------

## 5. Study Groups

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  GRP-001                 An authenticated        MVP
                          student SHALL be able   
                          to create a study       
                          group.                  

  GRP-002                 The group creator SHALL MVP
                          automatically become an 
                          Admin.                  

  GRP-003                 Each group SHALL have a MVP
                          unique internal         
                          identifier.             

  GRP-004                 The system SHALL        MVP
                          maintain user-to-group  
                          membership.             

  GRP-005                 Students SHALL be able  MVP
                          to join groups using    
                          the approved            
                          join/invitation         
                          mechanism.              

  GRP-006                 Members SHOULD be able  MVP
                          to leave groups,        
                          subject to ownership    
                          constraints.            

  GRP-007                 Authorized members      MVP
                          SHALL be able to view   
                          group membership.       

  GRP-008                 Admins SHALL be able to MVP
                          promote members to      
                          Admin.                  

  GRP-009                 A group SHALL support   MVP
                          multiple Admins.        

  GRP-010                 Authorized Admins SHALL MVP
                          be able to remove       
                          members.                

  GRP-011                 Private group data      MVP
                          SHALL be accessible     
                          only to authorized      
                          members.                

  GRP-012                 Each group SHALL        MVP
                          provide a group         
                          overview.               
  -----------------------------------------------------------------------

## 6. Subjects

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  SUB-001                 Authorized group users  MVP
                          SHALL be able to create 
                          subjects.               

  SUB-002                 A subject SHALL have a  MVP
                          name and group          
                          association.            

  SUB-003                 A subject SHOULD        MVP
                          support an optional     
                          description/code.       

  SUB-004                 Academic activities     MVP
                          SHOULD be associated    
                          with a subject.         

  SUB-005                 Members SHALL be able   MVP
                          to list group subjects. 

  SUB-006                 A subject SHALL belong  MVP
                          to exactly one group.   
  -----------------------------------------------------------------------

## 7. Academic Activities

Academic activities are structured, persistent academic records.

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  ACT-001                 Any authenticated group MVP
                          member SHALL be able to 
                          create an academic      
                          activity.               

  ACT-002                 Every activity SHALL    MVP
                          have a title.           

  ACT-003                 The system SHALL        MVP
                          support Quiz,           
                          Assignment, Exam,       
                          Project, Recitation,    
                          Presentation, and       
                          Other.                  

  ACT-004                 An activity SHOULD      MVP
                          support a description.  

  ACT-005                 An activity SHOULD      MVP
                          support a subject.      

  ACT-006                 An activity SHALL       MVP
                          support a due date and  
                          MAY support a start     
                          date/time.              

  ACT-007                 The system SHALL record MVP
                          the activity creator.   

  ACT-008                 The system SHALL record MVP
                          creation time.          

  ACT-009                 The system SHALL record MVP
                          update time.            

  ACT-010                 Authorized users SHALL  MVP
                          be able to edit         
                          activities according to 
                          authorization rules.    

  ACT-011                 Authorized users SHALL  MVP
                          be able to delete       
                          activities according to 
                          authorization rules.    

  ACT-012                 Authorized users SHALL  MVP
                          be able to view         
                          activity details.       

  ACT-013                 Academic activities     MVP
                          SHALL remain distinct   
                          from temporary Hub      
                          Notes.                  

  ACT-014                 Member-created          MVP
                          activities SHALL be     
                          treated as official     
                          group academic records  
                          in MVP; admin approval  
                          is not required.        

  ACT-015                 Activities SHOULD       Should
                          support optional        
                          attachments/links.      
  -----------------------------------------------------------------------

## 8. Personal Progress

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  PROG-001                Members SHALL be able   MVP
                          to track their own      
                          activity status.        

  PROG-002                Base statuses SHALL be  MVP
                          NOT_STARTED,            
                          IN_PROGRESS, and        
                          COMPLETED.              

  PROG-003                A member's status SHALL MVP
                          default to NOT_STARTED  
                          when applicable.        

  PROG-004                Members SHALL be able   MVP
                          to update their own     
                          status.                 

  PROG-005                Members SHALL NOT       MVP
                          modify another member's 
                          progress without        
                          explicit authorization. 

  PROG-006                Activities SHOULD       V1/V2
                          display individual      
                          member progress where   
                          enabled.                

  PROG-007                A progress view SHOULD  V1/V2
                          show a completion       
                          summary such as         
                          `2 / 4 completed`.      
  -----------------------------------------------------------------------

## 9. Deadlines & Urgency

Relative deadline information is a core requirement.

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  DUE-001                 Activities SHALL        MVP
                          display due dates when  
                          present.                

  DUE-002                 The system SHALL        MVP
                          calculate relative      
                          urgency such as         
                          `Due in 2 days`,        
                          `Due tomorrow`,         
                          `Due today`, and        
                          `Overdue`.              

  DUE-003                 The dashboard SHALL     MVP
                          identify approaching    
                          deadlines.              

  DUE-004                 Incomplete activities   MVP
                          past their due date     
                          SHALL be identifiable   
                          as overdue.             

  DUE-005                 The application SHALL   MVP
                          use a documented        
                          timezone strategy for   
                          deadline calculations.  

  DUE-006                 Same-day, midnight,     MVP
                          past, future,           
                          date-only, and relevant 
                          timezone boundary cases 
                          SHALL be handled        
                          correctly.              
  -----------------------------------------------------------------------

## 10. Calendar

  ----------------------------------------------------------------------------
  ID                      Requirement                  Priority
  ----------------------- ---------------------------- -----------------------
  CAL-001                 The system SHALL provide a   MVP
                          calendar for group academic  
                          events.                      

  CAL-002                 The calendar SHALL support a MVP
                          monthly view.                

  CAL-003                 Events SHALL appear on their MVP
                          corresponding dates.         

  CAL-004                 Relevant activity/event      MVP
                          types SHALL be               
                          distinguishable.             

  CAL-005                 Users SHALL be able to open  MVP
                          an event and view its        
                          details.                     

  CAL-006                 Dates containing multiple    MVP
                          events SHOULD provide a      
                          useful event/day list.       

  CAL-007                 The system SHALL provide an  MVP
                          upcoming-event view.         

  CAL-008                 A personal calendar SHOULD   MVP
                          aggregate relevant events    
                          from joined groups.          

  CAL-009                 Creating/updating/deleting   MVP
                          applicable activities SHALL  
                          keep calendar data           
                          consistent.                  

  CAL-010                 Calendar changes SHOULD      V2
                          update in realtime when      
                          realtime is enabled.         

  CAL-011                 The calendar SHALL remain    MVP
                          usable on mobile screens.    
  ----------------------------------------------------------------------------

## 11. Personal Dashboard

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  DASH-001                Authenticated users     MVP
                          SHALL have a personal   
                          dashboard.              

  DASH-002                The dashboard SHALL     MVP
                          show relevant           
                          activities for today.   

  DASH-003                The dashboard SHALL     MVP
                          show upcoming academic  
                          responsibilities.       

  DASH-004                The dashboard SHALL     MVP
                          surface approaching     
                          deadlines.              

  DASH-005                Dashboard items SHALL   MVP
                          use relative deadline   
                          labels where            
                          applicable.             

  DASH-006                The dashboard SHALL     MVP
                          show the user's groups. 

  DASH-007                The dashboard SHOULD    Should
                          show recent relevant    
                          activity.               

  DASH-008                The dashboard MAY show  V2
                          recently uploaded       
                          resources after Phase   
                          2.                      

  DASH-009                The dashboard MAY show  V2
                          active Hub Notes after  
                          Phase 2.                

  DASH-010                The dashboard SHALL be  MVP
                          optimized for mobile.   
  -----------------------------------------------------------------------

## 12. Hub Notes

Hub Notes are lightweight, temporary social/personal updates and are
separate from academic records.

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  NOTE-001                Members SHALL be able   V2
                          to create short Hub     
                          Notes.                  

  NOTE-002                Each Hub Note SHALL     V2
                          belong to a group.      

  NOTE-003                Each Hub Note SHALL     V2
                          record its author.      

  NOTE-004                Each Hub Note SHALL     V2
                          record its creation     
                          time.                   

  NOTE-005                Hub Notes SHALL support V2
                          expiration; recommended 
                          default is 24 hours.    

  NOTE-006                Hub Notes SHALL NOT be  V2
                          treated as official     
                          academic activities.    

  NOTE-007                Hub Notes SHALL remain  V2
                          short-form and SHALL    
                          NOT become a full       
                          social-media feed.      

  NOTE-008                Reactions, replies, and Future
                          mentions MAY be added   
                          later.                  
  -----------------------------------------------------------------------

## 13. Resources / Academic Library

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  RES-001                 Members SHALL be able   V2
                          to upload educational   
                          resources.              

  RES-002                 The system SHOULD       V2
                          support PDFs, images,   
                          common documents, and   
                          external links.         

  RES-003                 Resources SHALL support V2
                          title, description,     
                          type, size where        
                          available, subject,     
                          tags, uploader, group,  
                          and timestamp.          

  RES-004                 Authorized members      V2
                          SHALL be able to access 
                          resources belonging to  
                          their groups.           

  RES-005                 Authorized members      V2
                          SHOULD be able to       
                          download supported      
                          files.                  

  RES-006                 Supported resources MAY V2
                          have in-browser         
                          preview.                

  RES-007                 Resources SHOULD        V2
                          support tags.           

  RES-008                 Resource search MAY be  Future
                          added later.            

  RES-009                 Favorites/saves MAY be  Future
                          added later.            

  RES-010                 File access SHALL be    V2
                          protected by storage    
                          authorization policies. 
  -----------------------------------------------------------------------

## 14. Study Sessions

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  STUDY-001               Members SHALL be able   V2
                          to create study         
                          sessions.               

  STUDY-002               A study session SHOULD  V2
                          include title/topic,    
                          date, start/end time,   
                          location/link, and      
                          creator.                

  STUDY-003               Study sessions SHALL    V2
                          appear on the relevant  
                          group calendar.         

  STUDY-004               Members SHOULD be able  V2
                          to RSVP using GOING,    
                          MAYBE, or NOT_GOING.    

  STUDY-005               The system SHOULD       V2
                          display RSVP totals.    
  -----------------------------------------------------------------------

## 15. Discussions

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  DISC-001                Members SHALL be able   V3
                          to create discussion    
                          posts.                  

  DISC-002                Members SHALL be able   V3
                          to reply to discussion  
                          posts.                  

  DISC-003                Discussions SHALL focus V3
                          primarily on academic   
                          collaboration.          

  DISC-004                Private group           V3
                          discussions SHALL be    
                          protected by membership 
                          authorization.          

  DISC-005                Admins SHALL be able to V3
                          moderate discussions.   
  -----------------------------------------------------------------------

## 16. Announcements

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  ANN-001                 Admins SHALL be able to V3
                          create group            
                          announcements.          

  ANN-002                 Authorized group        V3
                          members SHALL be able   
                          to view announcements.  

  ANN-003                 Announcements SHALL be  V3
                          visually distinct from  
                          discussions and Hub     
                          Notes.                  

  ANN-004                 Authorized Admins SHALL V3
                          be able to edit/delete  
                          announcements.          
  -----------------------------------------------------------------------

## 17. Notifications

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  NOTIF-001               Authenticated users     V3
                          SHALL have a            
                          notification center.    

  NOTIF-002               The system MAY notify   V3
                          users about group       
                          invitations, admin      
                          promotion, activities,  
                          deadlines, resources,   
                          study sessions,         
                          announcements, and      
                          mentions.               

  NOTIF-003               Notifications SHOULD    V3
                          support read/unread     
                          state.                  

  NOTIF-004               Notifications SHALL     V3
                          avoid unnecessary or    
                          excessive alerts.       
  -----------------------------------------------------------------------

## 18. Realtime

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  REAL-001                Supabase Realtime       V2/V3
                          SHOULD be used where it 
                          materially improves     
                          collaboration.          

  REAL-002                New/updated group       V2
                          activities MAY appear   
                          without manual refresh. 

  REAL-003                New resource uploads    V2
                          MAY appear without      
                          manual refresh.         

  REAL-004                Study-session RSVP      V2
                          changes MAY update in   
                          realtime.               

  REAL-005                Discussion/reply        V3
                          updates MAY be          
                          realtime.               

  REAL-006                Notifications MAY       V3
                          arrive in realtime.     

  REAL-007                Core application        V2+
                          behavior SHALL remain   
                          usable if realtime      
                          connectivity fails.     
  -----------------------------------------------------------------------

## 19. File Uploads

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FILE-001                Only authorized         V2
                          authenticated users     
                          SHALL upload files.     

  FILE-002                Users SHALL only upload V2
                          to groups where they    
                          are authorized          
                          contributors.           

  FILE-003                File type, size, and    V2
                          authorization SHALL be  
                          validated.              

  FILE-004                Private group files     V2
                          SHALL not be publicly   
                          accessible unless       
                          explicitly intended.    

  FILE-005                Unsupported or          V2
                          disallowed file types   
                          SHALL be rejected.      
  -----------------------------------------------------------------------

## 20. Authorization & Security

  ---------------------------------------------------------------------------
  ID                      Requirement                 Priority
  ----------------------- --------------------------- -----------------------
  AUTHZ-001               Authorization SHALL be      MVP
                          enforced at the             
                          backend/database level, not 
                          only through UI hiding.     

  AUTHZ-002               Private group records SHALL MVP
                          only be readable by         
                          authorized members.         

  AUTHZ-003               Admin-only operations SHALL MVP
                          be protected by             
                          authorization rules.        

  AUTHZ-004               Users SHALL only modify     MVP
                          their own personal          
                          profile/progress unless     
                          explicitly authorized.      

  AUTHZ-005               Membership in Group A SHALL MVP
                          not grant access to private 
                          Group B data.               

  AUTHZ-006               Supabase Row Level Security MVP
                          SHALL be enabled for        
                          protected data.             

  SEC-001                 Supabase service-role       MVP
                          credentials SHALL never be  
                          exposed in client code.     

  SEC-002                 User-controlled input SHALL MVP
                          be validated.               

  SEC-003                 Uploaded files SHALL be     V2
                          subject to security         
                          restrictions.               

  SEC-004                 User-generated content      MVP
                          SHALL be rendered safely    
                          against XSS.                

  SEC-005                 Critical RLS/authorization  MVP
                          paths SHALL be tested.      

  SEC-006                 Errors SHALL not expose     MVP
                          secrets or sensitive        
                          implementation/database     
                          details.                    

  SEC-007                 Secrets SHALL be stored     MVP
                          through appropriate         
                          environment/configuration   
                          mechanisms and excluded     
                          from source control.        
  ---------------------------------------------------------------------------

## 21. UX & Accessibility

  -------------------------------------------------------------------------
  ID                      Requirement               Priority
  ----------------------- ------------------------- -----------------------
  UX-001                  The primary experience    MVP
                          SHALL be mobile-first.    

  UX-002                  The application SHALL     MVP
                          adapt to tablet and       
                          desktop screens.          

  UX-003                  Controls SHALL be usable  MVP
                          on touch screens.         

  UX-004                  Async operations SHALL    MVP
                          provide loading feedback. 

  UX-005                  Errors SHALL provide      MVP
                          understandable feedback.  

  UX-006                  Empty states SHALL        MVP
                          provide useful guidance.  

  UX-007                  Destructive/high-impact   MVP
                          actions SHOULD use        
                          appropriate confirmation. 

  UX-008                  The application SHOULD    MVP
                          use semantic structure,   
                          labels, visible focus     
                          states, accessible        
                          contrast, and clear       
                          status indicators.        

  UX-009                  The information hierarchy MVP
                          SHALL prioritize today,   
                          due soon, changes, and    
                          next actions.             
  -------------------------------------------------------------------------

## 22. Performance & Reliability

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  PERF-001                The application SHALL   MVP
                          avoid unnecessary       
                          database requests.      

  PERF-002                Large                   V2/V3
                          resource/discussion     
                          lists SHOULD use        
                          pagination or           
                          incremental loading.    

  PERF-003                Realtime subscriptions  V2+
                          SHALL be appropriately  
                          scoped.                 

  PERF-004                Large files SHOULD be   V2
                          handled through         
                          appropriate storage/CDN 
                          mechanisms.             

  PERF-005                The application SHOULD  MVP
                          remain responsive under 
                          typical mobile network  
                          conditions.             

  REL-001                 Failed network/database MVP
                          requests SHALL be       
                          handled gracefully.     

  REL-002                 The application SHOULD  MVP
                          prevent accidental      
                          duplicate submissions.  

  REL-003                 Related database        MVP
                          operations SHALL        
                          maintain data           
                          consistency.            

  REL-004                 Core functionality      V2+
                          SHALL remain usable     
                          when realtime           
                          connectivity fails.     
  -----------------------------------------------------------------------

## 23. Data Integrity

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  DATA-001                Core entities SHALL     MVP
                          have stable unique      
                          identifiers.            

  DATA-002                Relationships SHALL     MVP
                          enforce appropriate     
                          referential integrity.  

  DATA-003                Time-sensitive records  MVP
                          SHALL store appropriate 
                          creation/update         
                          timestamps.             

  DATA-004                Each entity's deletion  Architecture
                          strategy (hard delete,  
                          soft delete, or         
                          archive) SHALL be       
                          explicitly documented.  

  DATA-005                Important               Future
                          administrative actions  
                          MAY eventually be       
                          audited.                
  -----------------------------------------------------------------------

## 24. Testing

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  TEST-001                Major features SHALL be MVP
                          traceable to            
                          requirement IDs.        

  TEST-002                Core workflows SHALL    MVP
                          have functional tests   
                          or documented manual    
                          acceptance tests.       

  TEST-003                Authorization and RLS   MVP
                          behavior SHALL be       
                          tested.                 

  TEST-004                Invalid inputs SHALL be MVP
                          tested.                 

  TEST-005                Edge cases SHALL        MVP
                          include empty groups,   
                          empty subjects, no      
                          upcoming events,        
                          overdue activities,     
                          same-day deadlines,     
                          removed members,        
                          multiple admins,        
                          invalid invitations,    
                          and unauthorized        
                          access.                 

  TEST-006                Existing functionality  MVP+
                          SHALL be checked after  
                          significant changes.    

  TEST-007                Core workflows SHALL be MVP
                          tested on mobile screen 
                          sizes.                  
  -----------------------------------------------------------------------

## 25. MVP Acceptance Criteria

The MVP must successfully support this end-to-end scenario:

1.  A student registers and signs in.
2.  The student creates `BSIT 2A Study Hub`.
3.  The student automatically becomes Admin.
4.  The Admin adds/invites classmates.
5.  The Admin promotes a classmate to Admin.
6.  The group creates subjects such as Programming 3, Web Development,
    Database Management, and Mathematics.
7.  A member creates `Programming 3 Quiz #2`.
8.  The activity is classified as Quiz and associated with Programming
    3.
9.  A due date/time is stored.
10. The activity appears in the group calendar.
11. The activity appears on relevant personal dashboards.
12. The UI shows relative urgency such as `Due in 2 days`.
13. A member marks the activity `In Progress`.
14. The member later marks it `Completed`.
15. A member can view their own progress.
16. A non-member cannot access the group's protected data through direct
    requests/database access.
17. The core workflow is usable on a mobile phone.

## 26. Requirement Traceability

Implementation tasks SHOULD reference requirement IDs.

Example:

``` text
Task: Implement academic activity creation.

Covers:
ACT-001
ACT-002
ACT-003
ACT-004
ACT-005
ACT-006
ACT-007
ACT-008
ACT-014
```

Tests should reference the same IDs.

## 27. Change Control

AI agents SHALL NOT silently modify requirements.

For a significant change:

``` text
1. Identify affected requirement IDs.
2. Explain the proposed change.
3. Explain why it is needed.
4. Identify affected features.
5. Identify database impact.
6. Identify security impact.
7. Identify UX impact.
8. Obtain human approval.
9. Update PROJECT.md if product scope changes.
10. Update REQUIREMENTS.md.
11. Update affected detailed documents.
12. Update tests.
```

The human project owner is the final decision maker.

## 28. Definition of Done

A requirement is considered implemented only when:

-   Intended behavior exists.
-   Authorization is correct.
-   Validation exists where necessary.
-   Relevant error states exist.
-   Relevant tests/acceptance checks pass.
-   Documentation is updated where necessary.
-   No known critical regression remains.

## 29. Requirement Status

``` text
Authentication            ✓ Defined
Groups                    ✓ Defined
Roles                     ✓ Defined
Subjects                  ✓ Defined
Academic activities       ✓ Defined
Personal progress         ✓ Defined
Deadlines                 ✓ Defined
Calendar                  ✓ Defined
Dashboard                 ✓ Defined
Hub Notes                 ✓ Planned
Resources                 ✓ Planned
Study sessions            ✓ Planned
Discussions               ✓ Planned
Announcements             ✓ Planned
Notifications             ✓ Planned
Realtime                  ✓ Planned
Authorization             ✓ Defined
Security                  ✓ Defined
UX/accessibility          ✓ Defined
Performance               ✓ Defined
Testing                   ✓ Defined

Architecture              → Next
Database schema            → Next
API contracts             → Next
UI/UX specification       → Next
Security implementation   → Next
Test plan                 → Next
```

## 30. Source-of-Truth Relationship

`PROJECT.md` defines **what the product is and its overall scope**.

`REQUIREMENTS.md` defines **what the system must do**.

This document does not define the exact PostgreSQL schema, SQL
migrations, frontend component structure, API implementation, visual
design, or hosting provider. Those belong to the appropriate specialized
documents.

If a technical implementation conflicts with a requirement, the
implementation must be reconsidered or the requirement must be formally
changed.

------------------------------------------------------------------------

## End of Requirements Specification
