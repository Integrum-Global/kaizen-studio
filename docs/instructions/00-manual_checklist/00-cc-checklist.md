# COMPREHENSIVE MANUAL TESTING CHECKLIST - KAIZEN STUDIO

Test Credentials

- Email: jack@integrum.global
- Password: Integrum2024!
- Base URL: http://localhost:5173
- API URL: http://localhost:8000

---
# 1. LOGIN PAGE (/login)

## Header Section

| Widget      | Location            | Purpose       | Action | Expected Result                            | API Wired |
|-------------|---------------------|---------------|--------|--------------------------------------------|-----------|
| Page Title  | Center, top of card | Identify page | View   | Shows "Sign in to Kaizen Studio"           | N/A       |
| Description | Below title         | Instruction   | View   | Shows "Enter your credentials to continue" | N/A       |

### QA Comments
1. No issues

# Login Form

| Widget                  | Location                     | Purpose                | Action                       | Expected Result                                              | API Wired           |
|-------------------------|------------------------------|------------------------|------------------------------|--------------------------------------------------------------|---------------------|
| Email Label             | Above email input            | Label                  | View                         | Shows "Email"                                                | N/A                 |
| Email Input             | Below email label            | Collect email          | Type jack@integrum.global    | Text appears in field                                        | N/A                 |
| Email Validation        | Below email input            | Show error             | Type invalid email like test | Red border, shows "Please enter a valid email address"       | N/A                 |
| Password Label          | Above password input         | Label                  | View                         | Shows "Password"                                             | N/A                 |
| Password Input          | Below password label         | Collect password       | Type Integrum2024!           | Dots appear (hidden)                                         | N/A                 |
| Password Toggle Button  | Right side of password input | Show/hide password     | Click eye icon               | Password toggles visible/hidden, icon changes Eye↔EyeOff     | N/A                 |
| Password Validation     | Below password input         | Show error             | Type less than 8 chars       | Red border, shows "Password must be at least 8 characters"   | N/A                 |
| Remember Me Checkbox    | Below password field         | Session persistence    | Click checkbox               | Checkbox toggles checked/unchecked                           | N/A                 |
| Remember Me Label       | Right of checkbox            | Label for checkbox     | Click text                   | Checkbox toggles (label is clickable)                        | N/A                 |
| Sign In Button          | Below remember me            | Submit form            | Click with valid data        | Loading spinner "Signing in...", then redirect to /dashboard | ✅ POST /auth/login |
| Sign In Button Disabled | Same location                | Prevent invalid submit | Leave fields empty           | Button is disabled (gray, not clickable)                     | N/A                 |

### QA Comments
1. Password Validation
   - Is this validation supposed to trigger when user is typing? If it is, its not showing. 
2. Sign In Button
   - Sign-in button is not disabled when fields are empty.

## SSO Section

| Widget            | Location     | Purpose     | Action | Expected Result                                 | API Wired                |
|-------------------|--------------|-------------|--------|-------------------------------------------------|--------------------------|
| Google SSO Button | Below form   | OAuth login | Click  | Redirects to Google OAuth (or shows SSO dialog) | ✅ POST /auth/sso/google |
| GitHub SSO Button | Below Google | OAuth login | Click  | Redirects to GitHub OAuth                       | ✅ POST /auth/sso/github |

### QA Comments
1. Please implement Google and Apple SSO, use their respective CLI and implement for me.
2. There is no Github SSO button, please remove Okta and then implement Github SSO please.

## Footer Section

| Widget        | Location       | Purpose              | Action | Expected Result                | API Wired |
|---------------|----------------|----------------------|--------|--------------------------------|-----------|
| Register Text | Bottom of card | Navigation hint      | View   | Shows "Don't have an account?" | N/A       |
| Register Link | After text     | Navigate to register | Click  | Navigates to /register         | N/A       |

### QA Comments

## Error States

| Scenario            | Action                     | Expected Result                                                            |
|---------------------|----------------------------|----------------------------------------------------------------------------|
| Invalid credentials | Submit with wrong password | Toast: "Login failed - Invalid email or password" (red/destructive)        |
| SSO failure         | Return from failed SSO     | Toast: "SSO Authentication Failed - Unable to complete SSO authentication" |
| Network error       | Submit with backend down   | Toast with error message                                                   |

### QA Comments

---
# 2. DASHBOARD (/dashboard)

## Header Section

| Widget               | Location      | Purpose         | Action | Expected Result                                            | API Wired |
|----------------------|---------------|-----------------|--------|------------------------------------------------------------|-----------|
| Page Title           | Top left      | Identify page   | View   | Shows "Dashboard"                                          | N/A       |
| Welcome Message      | Below title   | Personalization | View   | Shows "Welcome back, {user.name}!" with viewport indicator | N/A       |
| New Work Unit Button | Top right     | Quick action    | Click  | Navigates to /build/work-units/new                         | N/A       |
| New Workspace Button | Next to above | Quick action    | Click  | Navigates to /build/workspaces/new                         | N/A       |

### QA Comments

## Profile Information Card

| Widget             | Location          | Purpose       | Action | Expected Result                                         | API Wired          |
|--------------------|-------------------|---------------|--------|---------------------------------------------------------|--------------------|
| Card Title         | Card header       | Label         | View   | Shows "Profile Information"                             | N/A                |
| Card Description   | Below title       | Subtitle      | View   | Shows "Your account details"                            | N/A                |
| Name Label         | Card content      | Field label   | View   | Shows "Name"                                            | N/A                |
| Name Value         | Below name label  | Display name  | View   | Shows user's full name (e.g., "Jack Thompson")          | ✅ From auth store |
| Email Label        | Below name        | Field label   | View   | Shows "Email"                                           | N/A                |
| Email Value        | Below email label | Display email | View   | Shows "jack@integrum.global"                            | ✅ From auth store |
| Organization Label | Below email       | Field label   | View   | Shows "Organization"                                    | N/A                |
| Organization Value | Below org label   | Display org   | View   | Shows "integrum.global"                                 | ✅ From auth store |
| Role Label         | Below org         | Field label   | View   | Shows "Role"                                            | N/A                |
| Role Badge         | Below role label  | Display role  | View   | Shows role badge (e.g., "owner") with secondary styling | ✅ From auth store |

### QA Comments

## Quick Stats Card

| Widget                  | Location          | Purpose          | Action | Expected Result                                    | API Wired                 |
|-------------------------|-------------------|------------------|--------|----------------------------------------------------|---------------------------|
| Card Title              | Card header       | Label            | View   | Shows "Quick Stats"                                | N/A                       |
| Card Description        | Below title       | Subtitle         | View   | Shows "Your activity overview"                     | N/A                       |
| Refresh Button          | Top right of card | Refresh stats    | Click  | Button spins, stats reload, "Last updated" changes | ⚠️ Simulated (setTimeout) |
| Active Work Units Icon  | Stats row 1       | Visual indicator | View   | Shows Boxes icon (muted)                           | N/A                       |
| Active Work Units Label | Next to icon      | Stat label       | View   | Shows "Active Work Units"                          | N/A                       |
| Active Work Units Badge | Right side        | Stat value       | View   | Shows count badge (currently 0)                    | ⚠️ Mock data              |
| Active Processes Icon   | Stats row 2       | Visual indicator | View   | Shows Workflow icon (muted)                        | N/A                       |
| Active Processes Label  | Next to icon      | Stat label       | View   | Shows "Active Processes"                           | N/A                       |
| Active Processes Badge  | Right side        | Stat value       | View   | Shows count badge (currently 0)                    | ⚠️ Mock data              |
| Deployments Icon        | Stats row 3       | Visual indicator | View   | Shows Server icon (muted)                          | N/A                       |
| Deployments Label       | Next to icon      | Stat label       | View   | Shows "Deployments"                                | N/A                       |
| Deployments Badge       | Right side        | Stat value       | View   | Shows count badge (currently 0)                    | ⚠️ Mock data              |
| Last Updated Text       | Bottom of card    | Timestamp        | View   | Shows "Last updated: just now" (or time ago)       | N/A                       |

### QA Comments

## Getting Started Card

| Widget            | Location     | Purpose    | Action | Expected Result                               | API Wired |
|-------------------|--------------|------------|--------|-----------------------------------------------|-----------|
| Card Title        | Card header  | Label      | View   | Shows "Getting Started"                       | N/A       |
| Card Description  | Below title  | Subtitle   | View   | Shows "Begin your journey with Kaizen Studio" | N/A       |
| Instructions Text | Card content | Onboarding | View   | Shows intro text about platform               | N/A       |

### QA Comments

## Recent Activity Card

| Widget           | Location           | Purpose          | Action          | Expected Result                                                     | API Wired    |
|------------------|--------------------|------------------|-----------------|---------------------------------------------------------------------|--------------|
| Card Title       | Card header        | Label            | View            | Shows "Recent Activity" with Activity icon                          | N/A          |
| Card Description | Below title        | Subtitle         | View            | Shows "Latest actions in your workspace"                            | N/A          |
| Refresh Button   | Top right          | Refresh activity | Click           | Button spins during refresh                                         | ⚠️ Simulated |
| Activity Item 1  | List               | Show activity    | View            | Shows icon, "Customer Support Bot", "created", "30m ago"            | ⚠️ Mock data |
| Activity Item 2  | List               | Show activity    | View            | Shows icon, "Data Processing Pipeline", "deployed", "2h ago"        | ⚠️ Mock data |
| Activity Item 3  | List               | Show activity    | View            | Shows icon, "Production API", "updated", "5h ago"                   | ⚠️ Mock data |
| Activity Icon    | Left of each item  | Type indicator   | View            | Bot icon for agents, Workflow for pipelines, Server for deployments | N/A          |
| Clock Icon       | Right of each item | Time indicator   | View            | Small clock icon next to time                                       | N/A          |
| Empty State      | Card content       | No activity      | View (if empty) | Shows "No recent activity" centered                                 | N/A          |

### QA Comments

---
# 3. WORK UNITS PAGE (/build/work-units)

## Header Section

| Widget                  | Location    | Purpose       | Action | Expected Result                                    | API Wired    |
|-------------------------|-------------|---------------|--------|----------------------------------------------------|--------------|
| Page Title              | Top left    | Identify page | View   | Shows "Work Units"                                 | N/A          |
| Page Subtitle           | Below title | Description   | View   | Shows "Manage your projects, teams, and processes" | N/A          |
| Create Work Unit Button | Top right   | Create new    | Click  | Currently logs to console (TODO)                   | ❌ Not wired |

### QA Comments

## Filters Section

| Widget                 | Location             | Purpose             | Action                | Expected Result                                             | API Wired                         |
|------------------------|----------------------|---------------------|-----------------------|-------------------------------------------------------------|-----------------------------------|
| Search Icon            | Left of search input | Visual cue          | View                  | Shows magnifying glass icon                                 | N/A                               |
| Search Input           | Filters row          | Text search         | Type "test"           | Filters work units containing "test"                        | ✅ GET /work-units?search=        |
| Type Tabs - All        | Filter row           | Show all types      | Click "All" tab       | Shows all work units                                        | ✅ GET /work-units                |
| Type Tabs - Atomic     | Filter row           | Filter agents       | Click "Atomic" tab    | Shows only atomic (agent) work units                        | ✅ GET /work-units?type=atomic    |
| Type Tabs - Composite  | Filter row           | Filter pipelines    | Click "Composite" tab | Shows only composite (pipeline) work units                  | ✅ GET /work-units?type=composite |
| Trust Status Dropdown  | Filter row           | Filter by trust     | Click dropdown        | Shows options: All Status, Valid, Expired, Revoked, Pending | ✅ GET /work-units?trustStatus=   |
| Trust Status - Valid   | Dropdown option      | Filter trusted      | Select "Valid"        | Shows only work units with valid trust                      | ✅                                |
| Trust Status - Expired | Dropdown option      | Filter expired      | Select "Expired"      | Shows only expired work units                               | ✅                                |
| Trust Status - Revoked | Dropdown option      | Filter revoked      | Select "Revoked"      | Shows only revoked work units                               | ✅                                |
| Trust Status - Pending | Dropdown option      | Filter pending      | Select "Pending"      | Shows only pending work units                               | ✅                                |
| Workspace Dropdown     | Filter row           | Filter by workspace | Click dropdown        | Shows "All Workspaces" + list of workspaces                 | ✅ GET /workspaces                |
| Workspace Option       | Dropdown             | Select workspace    | Click workspace name  | Filters to only that workspace's work units                 | ✅ GET /work-units?workspaceId=   |

# Work Unit Grid

| Widget            | Location   | Purpose       | Action               | Expected Result                   | API Wired                |
|-------------------|------------|---------------|----------------------|-----------------------------------|--------------------------|
| Loading Skeletons | Grid area  | Loading state | View (while loading) | Shows 4-6 animated skeleton cards | N/A                      |
| Empty State       | Grid area  | No results    | View (when empty)    | Shows message and create button   | N/A                      |
| Work Unit Count   | Above grid | Summary       | View                 | Shows "Showing X of Y work units" | ✅                       |
| Load More Button  | Below grid | Pagination    | Click (if hasMore)   | Loads next page of work units     | ✅ GET /work-units?page= |

### QA Comments

## Work Unit Card (repeat for each card)

| Widget               | Location              | Purpose            | Action                  | Expected Result                                                                   | API Wired                           |
|----------------------|-----------------------|--------------------|-------------------------|-----------------------------------------------------------------------------------|-------------------------------------|
| Card Container       | Grid cell             | Clickable card     | Click card area         | Opens detail panel on right                                                       | N/A                                 |
| Card Hover Effect    | Card                  | Visual feedback    | Hover over card         | Card shadow increases, border highlights                                          | N/A                                 |
| Work Unit Icon       | Top left of card      | Type indicator     | View                    | Bot icon (blue bg) for atomic, GitBranch (purple bg) for composite                | N/A                                 |
| Work Unit Name       | Card header           | Identity           | View                    | Shows work unit name (e.g., "Customer Support Agent")                             | ✅                                  |
| Type Badge           | Next to name          | Type label         | View                    | Shows "Agent" (blue) or "Pipeline" (purple) badge                                 | ✅                                  |
| Trust Status Badge   | Top right             | Trust indicator    | View                    | Shows Valid (green), Expired (amber), Revoked (red), Pending (gray)               | ✅                                  |
| Trust Status Icon    | Inside badge          | Visual cue         | View                    | CheckCircle (valid), Clock (expired), XCircle (revoked), MoreHorizontal (pending) | ✅                                  |
| Trust Expiry         | Badge tooltip/text    | Expiration info    | View (Level 2+)         | Shows days remaining (e.g., "30d")                                                | ✅                                  |
| Description          | Card body             | Details            | View (if not compact)   | Shows truncated description text                                                  | ✅                                  |
| Capability Tags      | Card body             | Features           | View                    | Shows capability badges (e.g., "chat", "analysis")                                | ✅                                  |
| "+N more" Tag        | After capabilities    | Overflow indicator | Hover                   | Tooltip shows all capabilities                                                    | N/A                                 |
| Sub-unit Count       | Card body (composite) | Composition info   | View                    | Shows "Uses N unit(s)" with Layers icon                                           | ✅                                  |
| Sub-unit Count Click | Same                  | Expand             | Click                   | Triggers onExpandSubUnits (if provided)                                           | ⚠️ Handler defined, not implemented |
| Run Button           | Card actions          | Execute            | Click                   | Loading spinner, then executes work unit                                          | ✅ POST /work-units/{id}/run        |
| Run Button Disabled  | Same                  | Prevent action     | View (if trust invalid) | Button disabled with tooltip                                                      | N/A                                 |
| Configure Button     | Card actions          | Edit settings      | Click (Level 2+)        | Navigates to /agents/{id} or /pipelines/{id}                                      | ✅ Navigation only                  |
| Configure Hidden     | Same                  | Level check        | View (Level 1)          | Button not visible                                                                | N/A                                 |
| Delegate Button      | Card actions          | Share access       | Click (Level 2+)        | Opens delegation wizard                                                           | ❌ TODO: Not implemented            |
| Delete Button        | Card actions          | Remove             | Click (Level 3+)        | Confirmation, then deletes                                                        | ❌ TODO: Not implemented            |

### QA Comments

## Work Unit Detail Panel (Sheet/Slide-over)

| Widget                     | Location           | Purpose          | Action                | Expected Result                                                           | API Wired                           |
|----------------------------|--------------------|------------------|-----------------------|---------------------------------------------------------------------------|-------------------------------------|
| Panel Background           | Right side overlay | Container        | View                  | Slides in from right, covers ~1/3 of screen                               | N/A                                 |
| Close Panel                | Click outside or X | Close            | Click outside panel   | Panel slides closed                                                       | N/A                                 |
| Work Unit Icon             | Panel header       | Type indicator   | View                  | Large icon matching type                                                  | N/A                                 |
| Work Unit Name             | Panel header       | Title            | View                  | Shows full name                                                           | ✅                                  |
| Work Unit Type             | Below name         | Subtitle         | View                  | Shows "Atomic Work Unit" or "Composite Work Unit"                         | ✅                                  |
| Trust Status Badge         | Header right       | Trust info       | View                  | Shows status with expiry (if valid)                                       | ✅                                  |
| Trust Badge Click          | Same               | Navigate         | Click                 | Triggers onViewTrustChain                                                 | ⚠️ Handler defined, logs only       |
| Description Section        | Panel body         | Details          | View                  | Section header "DESCRIPTION" with text                                    | ✅                                  |
| Capabilities Section (L1)  | Panel body         | Features         | View (Level 1)        | Header "WHAT IT CAN DO" with bullet list                                  | ✅                                  |
| Capabilities Section (L2+) | Panel body         | Features         | View (Level 2+)       | Header "CAPABILITIES" with tag badges                                     | ✅                                  |
| Trust Section              | Panel body         | Trust details    | View (Level 2+ only)  | Shows Status, Expires, Delegated by fields                                | ✅                                  |
| Trust Status Row           | Trust section      | Detail           | View                  | Shows "Status" label and badge                                            | ✅                                  |
| Trust Expires Row          | Trust section      | Detail           | View (if valid)       | Shows "Expires" label and date                                            | ✅                                  |
| Trust Delegated Row        | Trust section      | Detail           | View (if delegated)   | Shows "Delegated by" label and user info                                  | ✅                                  |
| View Trust Chain Button    | Trust section      | Navigate         | Click                 | Opens trust chain viewer                                                  | ⚠️ Handler defined, not implemented |
| Sub-units Section          | Panel body         | Composition      | View (composite, L2+) | Header "SUB-UNITS (N)" with list                                          | ✅                                  |
| Sub-unit Item              | Sub-units list     | Child unit       | View                  | Shows icon, name, trust badge                                             | ✅                                  |
| Sub-unit Item Hover        | Same               | Visual feedback  | Hover                 | Background highlights                                                     | N/A                                 |
| Recent Runs Section (L1)   | Panel body         | History          | View (Level 1)        | Header "RECENT RESULTS"                                                   | ✅                                  |
| Recent Runs Section (L2+)  | Panel body         | History          | View (Level 2+)       | Header "RECENT RUNS"                                                      | ✅                                  |
| No Runs Message            | Runs section       | Empty state      | View (if no runs)     | Shows "No recent runs" italic text                                        | N/A                                 |
| Run Item                   | Runs list          | History entry    | View                  | Shows status badge, time ago                                              | ✅ GET /work-units/{id}/runs        |
| Run Status Badge           | Run item           | Status indicator | View                  | Completed (green), Failed (red), Running (blue spinner), Cancelled (gray) | ✅                                  |
| Run Time                   | Run item           | Timestamp        | View                  | Shows relative time (e.g., "5 min ago")                                   | ✅                                  |
| Run Item Click             | Run item           | View details     | Click                 | Triggers onViewRun                                                        | ⚠️ Handler defined, logs only       |
| Run Item Arrow             | Right of run item  | Navigation hint  | View                  | ChevronRight icon                                                         | N/A                                 |
| Run Now Button (L1)        | Panel footer       | Execute          | Click                 | Full-width button, executes work unit                                     | ✅ POST /work-units/{id}/run        |
| Run Button (L2+)           | Panel footer       | Execute          | Click                 | Smaller button with icon                                                  | ✅                                  |
| Configure Button (L2+)     | Panel footer       | Edit             | Click                 | Navigates to agent/pipeline editor                                        | ✅ Navigation                       |
| Delegate Button (L2+)      | Panel footer       | Share            | Click                 | Disabled if trust invalid                                                 | ⚠️ Handler defined, logs only       |
| Button Loading State       | Any action button  | Feedback         | Click action          | Shows spinner, button disabled                                            | ✅                                  |

### QA Comments

---
# 4. WORKSPACES PAGE (/build/workspaces)

## Header Section

| Widget                  | Location    | Purpose       | Action | Expected Result                                  | API Wired |
|-------------------------|-------------|---------------|--------|--------------------------------------------------|-----------|
| Page Title              | Top left    | Identify page | View   | Shows "Workspaces"                               | N/A       |
| Page Subtitle           | Below title | Description   | View   | Shows "Organize your work units into workspaces" | N/A       |
| Create Workspace Button | Top right   | Create new    | Click  | Opens create dialog                              | N/A       |

### QA Comments

## Toolbar Section

| Widget                | Location             | Purpose         | Action          | Expected Result                                     | API Wired                  |
|-----------------------|----------------------|-----------------|-----------------|-----------------------------------------------------|----------------------------|
| Search Icon           | Left of search input | Visual cue      | View            | Shows magnifying glass                              | N/A                        |
| Search Input          | Toolbar left         | Text search     | Type "integrum" | Filters workspaces containing text                  | ✅ GET /workspaces?search= |
| Grid View Button      | Toolbar right        | Switch view     | Click           | Grid layout active (secondary style), grid displays | N/A                        |
| List View Button      | Next to grid         | Switch view     | Click           | List layout active, vertical list displays          | N/A                        |
| View Toggle Container | Around buttons       | Visual grouping | View            | Buttons in bordered container                       | N/A                        |

### QA Comments

## Workspace Grid

| Widget             | Location       | Purpose       | Action               | Expected Result                                    | API Wired |
|--------------------|----------------|---------------|----------------------|----------------------------------------------------|-----------|
| Loading Skeletons  | Grid area      | Loading state | View (while loading) | Shows 6 animated skeleton cards                    | N/A       |
| Empty State        | Grid area      | No results    | View (when empty)    | Shows "No workspaces yet" or "No workspaces match" | N/A       |
| Empty State Button | In empty state | Quick create  | Click (if no search) | Opens create dialog                                | N/A       |

### QA Comments

## Workspace Card (repeat for each)

| Widget           | Location     | Purpose         | Action                | Expected Result                                                 | API Wired           |
|------------------|--------------|-----------------|-----------------------|-----------------------------------------------------------------|---------------------|
| Card Container   | Grid cell    | Clickable       | Click                 | Navigates to /build/workspaces/{id}                             | ✅ Navigation       |
| Color Accent Bar | Top of card  | Visual identity | View                  | Shows workspace color (if set)                                  | ✅                  |
| Workspace Icon   | Card header  | Type indicator  | View                  | Building2 (permanent), FolderClock (temporary), Star (personal) | N/A                 |
| Workspace Name   | Card header  | Identity        | View                  | Shows workspace name                                            | ✅                  |
| Type Badge       | Next to name | Type label      | View                  | Shows "Permanent", "Temporary", or "Personal"                   | ✅                  |
| Description      | Card body    | Details         | View                  | Shows workspace description (if any)                            | ✅                  |
| Work Unit Count  | Card stats   | Composition     | View                  | Shows count with icon                                           | ✅                  |
| Member Count     | Card stats   | Team size       | View                  | Shows count with users icon                                     | ✅                  |
| Expiry Badge     | Card body    | Temporary info  | View (temporary only) | Shows expiration status                                         | ✅                  |
| Archived Badge   | Card body    | Status          | View (if archived)    | Shows "Archived" badge                                          | ✅                  |
| Owner Name       | Card body    | Ownership       | View                  | Shows owner name                                                | ✅                  |
| Open Button      | Card actions | Navigate        | Click                 | Navigates to workspace detail                                   | ✅ Navigation       |
| Edit Button      | Card actions | Modify          | Click                 | Opens edit dialog                                               | ⚠️ Logs only (TODO) |
| Edit Disabled    | Same         | Prevent edit    | View (if archived)    | Button disabled                                                 | N/A                 |
| Archive Button   | Card actions | Archive         | Click                 | Archives workspace                                              | ⚠️ Logs only (TODO) |

### QA Comments

## Create Workspace Dialog

| Widget                  | Location         | Purpose             | Action                | Expected Result                                            | API Wired           |
|-------------------------|------------------|---------------------|-----------------------|------------------------------------------------------------|---------------------|
| Dialog Overlay          | Screen center    | Modal background    | View                  | Semi-transparent backdrop                                  | N/A                 |
| Dialog Container        | Center           | Form container      | View                  | White card with padding                                    | N/A                 |
| Dialog Title            | Top of dialog    | Label               | View                  | Shows "Create Workspace"                                   | N/A                 |
| Dialog Description      | Below title      | Instructions        | View                  | Shows "Create a new workspace to organize your work units" | N/A                 |
| Name Label              | Form             | Field label         | View                  | Shows "Name"                                               | N/A                 |
| Name Input              | Below name label | Collect name        | Type "Test Workspace" | Text appears in field                                      | N/A                 |
| Name Placeholder        | Input            | Hint                | View (empty)          | Shows "My Workspace"                                       | N/A                 |
| Description Label       | Form             | Field label         | View                  | Shows "Description"                                        | N/A                 |
| Description Textarea    | Below label      | Collect description | Type description      | Multi-line text appears                                    | N/A                 |
| Description Placeholder | Textarea         | Hint                | View (empty)          | Shows "Describe the purpose of this workspace..."          | N/A                 |
| Type Label              | Form             | Field label         | View                  | Shows "Type"                                               | N/A                 |
| Type Dropdown           | Below type label | Select type         | Click                 | Opens dropdown menu                                        | N/A                 |
| Type - Permanent        | Dropdown option  | Select              | Click                 | Selects "Permanent"                                        | N/A                 |
| Type - Temporary        | Dropdown option  | Select              | Click                 | Selects "Temporary"                                        | N/A                 |
| Type - Personal         | Dropdown option  | Select              | Click                 | Selects "Personal"                                         | N/A                 |
| Cancel Button           | Dialog footer    | Close without save  | Click                 | Dialog closes, no changes                                  | N/A                 |
| Create Button           | Dialog footer    | Submit              | Click                 | Creates workspace, dialog closes                           | ✅ POST /workspaces |
| Create Button Disabled  | Same             | Validation          | View (name empty)     | Button disabled                                            | N/A                 |
| Create Button Loading   | Same             | Feedback            | View (while creating) | Shows "Creating..."                                        | N/A                 |

### QA Comments

---
# 5. WORKSPACE DETAIL PAGE (/build/workspaces/:workspaceId)

## Header Section

| Widget                | Location      | Purpose       | Action | Expected Result                       | API Wired               |
|-----------------------|---------------|---------------|--------|---------------------------------------|-------------------------|
| Back Button           | Top left      | Navigate back | Click  | Returns to /build/workspaces          | N/A                     |
| Back Arrow Icon       | Inside button | Visual cue    | View   | ArrowLeft icon                        | N/A                     |
| Workspace Name        | Header center | Identity      | View   | Shows workspace name from API         | ✅ GET /workspaces/{id} |
| Workspace Description | Below name    | Details       | View   | Shows description or "No description" | ✅                      |
| Invite Members Button | Header right  | Add members   | Click  | Opens invite dialog                   | N/A                     |
| Settings Button       | Header right  | Configure     | Click  | Opens settings (icon button)          | ⚠️ Not implemented      |
| Add Work Unit Button  | Header right  | Add units     | Click  | Opens add work unit dialog            | N/A                     |

### QA Comments

## Loading & Error States

| Widget           | Location     | Purpose       | Action               | Expected Result                     | API Wired |
|------------------|--------------|---------------|----------------------|-------------------------------------|-----------|
| Loading Skeleton | Page content | Loading state | View (while loading) | Shows animated skeleton             | N/A       |
| Error State      | Page content | API error     | View (if error)      | Shows "Workspace not found" message | ✅        |

### QA Comments

## Filters Section

Same as Work Units Page filters, but:
| Widget           | Difference | Notes                                                          |
|------------------|------------|----------------------------------------------------------------|
| Workspace Filter | Hidden     | showWorkspaceFilter={false} since already in workspace context |

### QA Comments

## Work Unit Grid

Same as Work Units Page grid, but:
| Widget     | Data Source              | Notes                            |
|------------|--------------------------|----------------------------------|
| Work Units | From workspace.workUnits | Transformed to WorkUnit[] format |

### QA Comments

## Add Work Unit Dialog

| Widget               | Location       | Purpose          | Action                   | Expected Result                       | API Wired                           |
|----------------------|----------------|------------------|--------------------------|---------------------------------------|-------------------------------------|
| Dialog Overlay       | Center         | Modal background | View                     | Semi-transparent backdrop             | N/A                                 |
| Dialog Title         | Top            | Label            | View                     | Shows "Add Work Units to {workspace}" | N/A                                 |
| Search Icon          | Left of input  | Visual cue       | View                     | Magnifying glass                      | N/A                                 |
| Search Input         | Below title    | Filter units     | Type search term         | Filters available work units          | ✅ GET /work-units                  |
| Work Unit List       | Dialog body    | Selection        | View                     | Scrollable list of available units    | ✅                                  |
| Work Unit Checkbox   | Each list item | Selection        | Click                    | Toggles selection (checked/unchecked) | N/A                                 |
| Work Unit Icon       | List item      | Type indicator   | View                     | Bot or GitBranch icon                 | N/A                                 |
| Work Unit Name       | List item      | Identity         | View                     | Shows work unit name                  | ✅                                  |
| Work Unit Type Badge | List item      | Type label       | View                     | "Agent" or "Pipeline" badge           | ✅                                  |
| Trust Status Badge   | List item      | Trust info       | View                     | Trust status indicator                | ✅                                  |
| Loading State        | List area      | Loading          | View (while loading)     | Skeleton items                        | N/A                                 |
| Empty State          | List area      | No results       | View (if none available) | "No available work units" message     | N/A                                 |
| Selection Summary    | Dialog footer  | Count            | View                     | Shows "X selected"                    | N/A                                 |
| Cancel Button        | Dialog footer  | Close            | Click                    | Dialog closes                         | N/A                                 |
| Add Button           | Dialog footer  | Submit           | Click                    | Adds selected units to workspace      | ✅ POST /workspaces/{id}/work-units |

### QA Comments

## Invite Member Dialog

| Widget                | Location          | Purpose         | Action               | Expected Result                       | API Wired                        |
|-----------------------|-------------------|-----------------|----------------------|---------------------------------------|----------------------------------|
| Dialog Title          | Top               | Label           | View                 | Shows "Invite Members to {workspace}" | N/A                              |
| Search Input          | Below title       | Find users      | Type user name/email | Filters available users               | ✅ GET /users                    |
| User List             | Dialog body       | Selection       | View                 | Scrollable list of users              | ✅                               |
| User Item             | List              | Clickable row   | Click                | Selects user                          | N/A                              |
| User Avatar           | List item         | Visual identity | View                 | User avatar/initials                  | ✅                               |
| User Name             | List item         | Identity        | View                 | Shows user name                       | ✅                               |
| User Email            | List item         | Contact         | View                 | Shows user email                      | ✅                               |
| Selected User Card    | Below list        | Confirmation    | View (when selected) | Shows selected user details           | N/A                              |
| Role Radio Group      | Below selected    | Role selection  | View                 | Options for role assignment           | N/A                              |
| Role - Admin          | Radio option      | Select role     | Click                | Selects admin role                    | N/A                              |
| Role - Member         | Radio option      | Select role     | Click                | Selects member role                   | N/A                              |
| Role - Viewer         | Radio option      | Select role     | Click                | Selects viewer role                   | N/A                              |
| Role Description      | Below each option | Explanation     | View                 | Shows what each role can do           | N/A                              |
| Trust Delegation Note | Dialog            | Info            | View                 | Note about trust delegation           | N/A                              |
| Cancel Button         | Footer            | Close           | Click                | Dialog closes                         | N/A                              |
| Invite Button         | Footer            | Submit          | Click                | Invites member                        | ✅ POST /workspaces/{id}/members |

### QA Comments

---
# 6. CONNECTORS PAGE (/connectors)

## Header & Filters

| Widget                  | Location  | Purpose        | Action | Expected Result                                             | API Wired                          |
|-------------------------|-----------|----------------|--------|-------------------------------------------------------------|------------------------------------|
| Page Title              | Top left  | Identity       | View   | Shows "Connectors"                                          | N/A                                |
| Type Filter Dropdown    | Toolbar   | Filter by type | Click  | Shows: All, Database, Cloud, Email, Messaging, Storage, API | ✅ GET /connectors?connector_type= |
| Create Connector Button | Top right | Create new     | Click  | Opens create dialog                                         | N/A                                |

### QA Comments

## Connector Grid

| Widget               | Location     | Purpose           | Action          | Expected Result                  | API Wired                     |
|----------------------|--------------|-------------------|-----------------|----------------------------------|-------------------------------|
| Connector Card       | Grid cell    | Display connector | View            | Shows connector details          | ✅ GET /connectors            |
| Connector Name       | Card header  | Identity          | View            | Shows name                       | ✅                            |
| Connector Type Badge | Card         | Type indicator    | View            | Shows type (Database, API, etc.) | ✅                            |
| Status Indicator     | Card         | Connection status | View            | Active (green) or inactive       | ✅                            |
| Edit Button          | Card actions | Modify            | Click           | Opens edit dialog                | ⚠️ Handler exists             |
| Delete Button        | Card actions | Remove            | Click           | Confirmation, then delete        | ✅ DELETE /connectors/{id}    |
| Test Button          | Card actions | Test connection   | Click           | Tests connection, shows result   | ✅ POST /connectors/{id}/test |
| Pagination           | Below grid   | Navigate pages    | Click prev/next | Loads more connectors            | ✅                            |

### QA Comments

---
# 7. GATEWAYS PAGE (/gateways)

## Tabs

| Widget           | Location | Purpose     | Action | Expected Result                | API Wired        |
|------------------|----------|-------------|--------|--------------------------------|------------------|
| All Gateways Tab | Tab bar  | List view   | Click  | Shows gateway list             | ✅ GET /gateways |
| Details Tab      | Tab bar  | Detail view | Click  | Shows selected gateway details | ✅               |

### QA Comments

## Gateway List

| Widget              | Location | Purpose               | Action | Expected Result                | API Wired                      |
|---------------------|----------|-----------------------|--------|--------------------------------|--------------------------------|
| Gateway Card        | List     | Display gateway       | View   | Shows gateway info             | ✅                             |
| Gateway Name        | Card     | Identity              | View   | Shows name                     | ✅                             |
| Environment Badge   | Card     | Deployment env        | View   | Development/Staging/Production | ✅                             |
| Health Status       | Card     | Current health        | View   | Green/Yellow/Red indicator     | ✅                             |
| API URL             | Card     | Endpoint              | View   | Shows gateway URL              | ✅                             |
| View Details Button | Card     | Navigate              | Click  | Switches to Details tab        | N/A                            |
| Promote Button      | Card     | Environment promotion | Click  | Opens promotion dialog         | ✅ POST /gateways/{id}/promote |
| Scale Button        | Card     | Scaling               | Click  | Opens scaling controls         | N/A                            |

### QA Comments

## Gateway Details (when selected)

| Widget                 | Location     | Purpose            | Action       | Expected Result           | API Wired                        |
|------------------------|--------------|--------------------|--------------|---------------------------|----------------------------------|
| Back to List Button    | Top          | Navigation         | Click        | Returns to list view      | N/A                              |
| Gateway Health Card    | Details area | Health metrics     | View         | Shows health dashboard    | ✅ GET /gateways/{id}/health     |
| Manual Scale Controls  | Details area | Scale instances    | Use controls | Adjusts gateway scaling   | ✅ POST /gateways/{id}/scale     |
| Scaling Policy List    | Details area | Auto-scaling rules | View         | Shows configured policies | ✅ GET /gateways/{id}/policies   |
| Scaling Event Timeline | Details area | History            | View         | Shows scaling events      | ✅ GET /gateways/{id}/events     |
| Promotion History      | Details area | Promotion history  | View         | Shows past promotions     | ✅ GET /gateways/{id}/promotions |

### QA Comments

---
# 8. DEPLOYMENTS PAGE (/deployments)

## Header & Filters

| Widget                   | Location  | Purpose          | Action           | Expected Result                             | API Wired                        |
|--------------------------|-----------|------------------|------------------|---------------------------------------------|----------------------------------|
| Page Title               | Top left  | Identity         | View             | Shows "Deployments"                         | N/A                              |
| Create Deployment Button | Top right | Create new       | Click            | Opens deployment wizard                     | ✅                               |
| Search Input             | Toolbar   | Text search      | Type search term | Filters deployments                         | ✅ GET /deployments?search=      |
| Environment Filter       | Toolbar   | Filter by env    | Select option    | All/Development/Staging/Production          | ✅ GET /deployments?environment= |
| Status Filter            | Toolbar   | Filter by status | Select option    | All/Pending/Deploying/Active/Failed/Stopped | ✅ GET /deployments?status=      |

### QA Comments

## Deployment Grid

| Widget            | Location     | Purpose            | Action | Expected Result                                    | API Wired                       |
|-------------------|--------------|--------------------|--------|----------------------------------------------------|---------------------------------|
| Deployment Card   | Grid cell    | Display deployment | View   | Shows deployment info                              | ✅                              |
| Deployment Name   | Card header  | Identity           | View   | Shows name                                         | ✅                              |
| Status Badge      | Card         | Deployment status  | View   | Pending/Deploying/Active/Failed/Stopped with color | ✅                              |
| Environment Badge | Card         | Target env         | View   | Development/Staging/Production                     | ✅                              |
| Start Button      | Card actions | Start deployment   | Click  | Starts stopped deployment                          | ✅ POST /deployments/{id}/start |
| Stop Button       | Card actions | Stop deployment    | Click  | Stops running deployment                           | ✅ POST /deployments/{id}/stop  |
| Edit Button       | Card actions | Modify             | Click  | Opens edit dialog                                  | ✅                              |
| Delete Button     | Card actions | Remove             | Click  | Confirmation, then delete                          | ✅ DELETE /deployments/{id}     |
| Pagination        | Below grid   | Navigate pages     | Click  | Loads more deployments                             | ✅                              |

### QA Comments

## Deployment Dialog (Create/Edit)

| Widget               | Location | Purpose        | Action | Expected Result                          | API Wired                  |
|----------------------|----------|----------------|--------|------------------------------------------|----------------------------|
| Dialog Title         | Top      | Label          | View   | "Create Deployment" or "Edit Deployment" | N/A                        |
| Agent Dropdown       | Form     | Select agent   | Click  | Shows available agents                   | ✅ GET /agents             |
| Gateway Dropdown     | Form     | Select gateway | Click  | Shows available gateways                 | ✅ GET /gateways           |
| Environment Dropdown | Form     | Select env     | Click  | Development/Staging/Production           | N/A                        |
| Configuration Fields | Form     | Settings       | Fill   | Various config options                   | N/A                        |
| Cancel Button        | Footer   | Close          | Click  | Dialog closes                            | N/A                        |
| Submit Button        | Footer   | Create/Update  | Click  | Creates or updates deployment            | ✅ POST/PATCH /deployments |

---
# 9. TEAMS PAGE (/teams)

## Header & List

| Widget             | Location    | Purpose       | Action      | Expected Result           | API Wired             |
|--------------------|-------------|---------------|-------------|---------------------------|-----------------------|
| Page Title         | Top left    | Identity      | View        | Shows "Teams"             | N/A                   |
| Create Team Button | Top right   | Create new    | Click       | Opens create dialog       | ✅                    |
| Search Input       | Toolbar     | Find teams    | Type search | Filters teams             | ✅ GET /teams?search= |
| Team Card          | Grid        | Display team  | View        | Shows team info           | ✅ GET /teams         |
| Team Name          | Card header | Identity      | View        | Shows team name           | ✅                    |
| Member Count       | Card        | Team size     | View        | Shows count               | ✅                    |
| Created Date       | Card        | Creation info | View        | Shows formatted date      | ✅                    |
| Edit Button        | Card        | Modify        | Click       | Opens edit dialog         | ✅                    |
| Delete Button      | Card        | Remove        | Click       | Confirmation, then delete | ✅ DELETE /teams/{id} |
| Card Click         | Card        | Navigate      | Click       | Opens team detail page    | ✅ Navigation         |

### QA Comments

## Team Dialog

| Widget               | Location | Purpose          | Action           | Expected Result      | API Wired            |
|----------------------|----------|------------------|------------------|----------------------|----------------------|
| Name Input           | Form     | Team name        | Type name        | Text appears         | N/A                  |
| Description Textarea | Form     | Team description | Type description | Text appears         | N/A                  |
| Cancel Button        | Footer   | Close            | Click            | Dialog closes        | N/A                  |
| Create/Save Button   | Footer   | Submit           | Click            | Creates/updates team | ✅ POST/PATCH /teams |

### QA Comments

---
# 10. TEAM DETAIL PAGE (/teams/:teamId)

## Header

| Widget           | Location     | Purpose       | Action | Expected Result   | API Wired          |
|------------------|--------------|---------------|--------|-------------------|--------------------|
| Back Button      | Top left     | Navigate back | Click  | Returns to /teams | N/A                |
| Team Name        | Header       | Identity      | View   | Shows team name   | ✅ GET /teams/{id} |
| Edit Team Button | Header right | Modify        | Click  | Opens edit dialog | ✅                 |

### QA Comments

## Team Details Card

| Widget       | Location | Purpose  | Action | Expected Result            | API Wired |
|--------------|----------|----------|--------|----------------------------|-----------|
| Team Name    | Card     | Identity | View   | Shows name                 | ✅        |
| Description  | Card     | Details  | View   | Shows description (if any) | ✅        |
| Created Date | Card     | History  | View   | Formatted creation date    | ✅        |
| Member Count | Card     | Size     | View   | Total members              | ✅        |

### QA Comments

## Team Members Editor

| Widget             | Location      | Purpose         | Action | Expected Result           | API Wired                              |
|--------------------|---------------|-----------------|--------|---------------------------|----------------------------------------|
| Add Member Section | Top of editor | Add users       | View   | Form to add new member    | ✅                                     |
| User Dropdown      | Add section   | Select user     | Click  | Shows available users     | ✅ GET /users                          |
| Role Dropdown      | Add section   | Select role     | Click  | Member, Team Lead options | N/A                                    |
| Add Member Button  | Add section   | Submit          | Click  | Adds user to team         | ✅ POST /teams/{id}/members            |
| Members List       | Editor body   | Display members | View   | List of current members   | ✅                                     |
| Member Avatar      | List item     | Visual identity | View   | User avatar or initials   | ✅                                     |
| Member Name        | List item     | Identity        | View   | Full name                 | ✅                                     |
| Member Email       | List item     | Contact         | View   | Email address             | ✅                                     |
| Role Dropdown      | List item     | Change role     | Click  | Inline role change        | ✅ PATCH /teams/{id}/members/{userId}  |
| Remove Button      | List item     | Remove member   | Click  | Confirmation, then remove | ✅ DELETE /teams/{id}/members/{userId} |

### QA Comments

---
# 11. ROLES PAGE (/roles)

## Header & List

| Widget               | Location  | Purpose      | Action        | Expected Result                 | API Wired             |
|----------------------|-----------|--------------|---------------|---------------------------------|-----------------------|
| Page Title           | Top left  | Identity     | View          | Shows "Roles"                   | N/A                   |
| Create Role Button   | Top right | Create new   | Click         | Opens role editor               | ✅                    |
| Search Input         | Toolbar   | Find roles   | Type search   | Filters roles                   | ✅ GET /roles?search= |
| Include System Roles | Toolbar   | Show system  | Check/uncheck | Toggles system roles visibility | ✅                    |
| Role Card            | Grid      | Display role | View          | Shows role info                 | ✅ GET /roles         |
| Role Name            | Card      | Identity     | View          | Shows name                      | ✅                    |
| Permission Count     | Card      | Scope        | View          | Number of permissions           | ✅                    |
| Edit Button          | Card      | Modify       | Click         | Opens role editor               | ✅                    |
| Delete Button        | Card      | Remove       | Click         | Confirmation, then delete       | ✅ DELETE /roles/{id} |

### QA Comments

## Role Editor Dialog

| Widget               | Location        | Purpose           | Action           | Expected Result                                      | API Wired                     |
|----------------------|-----------------|-------------------|------------------|------------------------------------------------------|-------------------------------|
| Role Name Input      | Form            | Name              | Type name        | Text appears                                         | N/A                           |
| Description Textarea | Form            | Details           | Type description | Text appears                                         | N/A                           |
| Permissions Section  | Form            | Access control    | View             | Tree of permissions                                  | ✅ GET /available-permissions |
| Resource Header      | Permission tree | Group label       | View             | "Agents", "Pipelines", etc.                          | ✅                            |
| Select All Checkbox  | Resource row    | Bulk select       | Click            | Toggles all actions for resource                     | N/A                           |
| Action Checkbox      | Permission row  | Individual action | Click            | create, read, update, delete, execute, manage, admin | N/A                           |
| Cancel Button        | Footer          | Close             | Click            | Dialog closes                                        | N/A                           |
| Submit Button        | Footer          | Save              | Click            | Creates/updates role                                 | ✅ POST/PATCH /roles          |

### QA Comments

---
# 12. POLICIES PAGE (/policies)

## Header & Filters

| Widget               | Location  | Purpose            | Action | Expected Result           | API Wired                  |
|----------------------|-----------|--------------------|--------|---------------------------|----------------------------|
| Page Title           | Top left  | Identity           | View   | Shows "Policies"          | N/A                        |
| Create Policy Button | Top right | Create new         | Click  | Opens policy editor       | ✅                         |
| Resource Filter      | Toolbar   | Filter by resource | Select | All/Agents/Pipelines/etc. | ✅ GET /policies?resource= |
| Effect Filter        | Toolbar   | Filter by effect   | Select | All/Allow/Deny            | ✅ GET /policies?effect=   |

### QA Comments

## Policy Grid

| Widget              | Location | Purpose        | Action | Expected Result                 | API Wired                |
|---------------------|----------|----------------|--------|---------------------------------|--------------------------|
| Policy Card         | Grid     | Display policy | View   | Shows policy info               | ✅ GET /policies         |
| Policy Name         | Card     | Identity       | View   | Shows name                      | ✅                       |
| Resource Type Badge | Card     | Scope          | View   | What resource type              | ✅                       |
| Effect Badge        | Card     | Action type    | View   | "Allow" (green) or "Deny" (red) | ✅                       |
| Priority Indicator  | Card     | Order          | View   | Priority number                 | ✅                       |
| Enabled Toggle      | Card     | Status         | Click  | Toggles policy on/off           | ✅ PATCH /policies/{id}  |
| Edit Button         | Card     | Modify         | Click  | Opens policy editor             | ✅                       |
| Delete Button       | Card     | Remove         | Click  | Confirmation, then delete       | ✅ DELETE /policies/{id} |

### QA Comments

## Policy Editor Dialog

| Widget                   | Location      | Purpose           | Action           | Expected Result                         | API Wired                    |
|--------------------------|---------------|-------------------|------------------|-----------------------------------------|------------------------------|
| Policy Name Input        | Form          | Name              | Type             | Text appears                            | N/A                          |
| Effect Radio Group       | Form          | Allow/Deny        | Select           | Allow or Deny radio buttons             | N/A                          |
| Description Textarea     | Form          | Details           | Type             | Text appears                            | N/A                          |
| Resource Selector        | Form          | Target resource   | Select           | Dropdown of resource types              | ✅                           |
| Priority Input           | Form          | Ordering          | Type number      | 0-1000 value                            | N/A                          |
| Actions Checkboxes       | Form          | Permitted actions | Check            | Available actions for selected resource | ✅                           |
| Conditions Section       | Form          | Rules             | Build            | Condition builder interface             | N/A                          |
| Condition Group          | Conditions    | Logic group       | View             | AND/OR groups                           | N/A                          |
| Add Condition Button     | Conditions    | Add rule          | Click            | Adds new condition                      | N/A                          |
| Condition Attribute      | Condition row | What to check     | Select           | Available attributes                    | N/A                          |
| Condition Operator       | Condition row | How to compare    | Select           | eq, ne, contains, etc.                  | N/A                          |
| Condition Value          | Condition row | Compare to        | Type             | Value to match                          | N/A                          |
| Reference Warning Dialog | Form          | Validation        | View (if issues) | Shows orphaned/changed references       | ✅ POST /validate-conditions |
| Cancel Button            | Footer        | Close             | Click            | Dialog closes                           | N/A                          |
| Submit Button            | Footer        | Save              | Click            | Creates/updates policy                  | ✅ POST/PATCH /policies      |

### QA Comments

---
# 13. USERS PAGE (/users)

## Header & Filters

| Widget             | Location             | Purpose          | Action | Expected Result                  | API Wired             |
|--------------------|----------------------|------------------|--------|----------------------------------|-----------------------|
| Page Title         | Top left             | Identity         | View   | Shows "Users"                    | N/A                   |
| Role Filter        | Toolbar              | Filter by role   | Select | All/Owner/Admin/Developer/Viewer | ✅ GET /users?role=   |
| Status Filter      | Toolbar              | Filter by status | Select | All/Active/Suspended             | ✅ GET /users?status= |
| Create User Button | Toolbar (admin only) | Invite user      | Click  | Opens create dialog              | ✅                    |

### QA Comments

## User Grid

| Widget        | Location               | Purpose         | Action | Expected Result           | API Wired             |
|---------------|------------------------|-----------------|--------|---------------------------|-----------------------|
| User Card     | Grid                   | Display user    | View   | Shows user info           | ✅ GET /users         |
| User Avatar   | Card                   | Visual identity | View   | Avatar or initials        | ✅                    |
| User Name     | Card                   | Identity        | View   | Full name                 | ✅                    |
| User Email    | Card                   | Contact         | View   | Email address             | ✅                    |
| Role Badge    | Card                   | Access level    | View   | Color-coded role badge    | ✅                    |
| Status Badge  | Card                   | Account status  | View   | Active/Suspended          | ✅                    |
| Created Date  | Card                   | History         | View   | Formatted date            | ✅                    |
| Edit Button   | Card (if permitted)    | Modify          | Click  | Opens edit dialog         | ✅                    |
| Delete Button | Card (admin, not self) | Remove          | Click  | Confirmation, then delete | ✅ DELETE /users/{id} |

### QA Comments

## User Dialog

| Widget          | Location | Purpose        | Action | Expected Result      | API Wired            |
|-----------------|----------|----------------|--------|----------------------|----------------------|
| Name Input      | Form     | Full name      | Type   | Text appears         | N/A                  |
| Email Input     | Form     | Email address  | Type   | Email appears        | N/A                  |
| Role Dropdown   | Form     | Access level   | Select | Available roles      | N/A                  |
| Status Dropdown | Form     | Account status | Select | Active/Suspended     | N/A                  |
| Cancel Button   | Footer   | Close          | Click  | Dialog closes        | N/A                  |
| Submit Button   | Footer   | Save           | Click  | Creates/updates user | ✅ POST/PATCH /users |

### QA Comments

---
# 14. TRUST DASHBOARD (/trust)

## Header

| Widget     | Location | Purpose  | Action | Expected Result         | API Wired |
|------------|----------|----------|--------|-------------------------|-----------|
| Page Title | Top      | Identity | View   | Shows "Trust Dashboard" | N/A       |

### QA Comments

## Stats Cards (4 cards)

| Widget                  | Location  | Purpose      | Action | Expected Result         | API Wired            |
|-------------------------|-----------|--------------|--------|-------------------------|----------------------|
| Trusted Agents Card     | Stats row | Count        | View   | Number of active agents | ✅ GET /trust/chains |
| Active Delegations Card | Stats row | Count        | View   | Number of delegations   | ✅                   |
| Audit Events (24h) Card | Stats row | Activity     | View   | Verifications in 24h    | ✅                   |
| Verification Rate Card  | Stats row | Success rate | View   | Percentage              | ✅                   |

### QA Comments

## Action Buttons

| Widget                  | Location  | Purpose      | Action | Expected Result           | API Wired         |
|-------------------------|-----------|--------------|--------|---------------------------|-------------------|
| View Audit Trail Button | Dashboard | Navigate     | Click  | Opens audit trail         | N/A               |
| Establish Trust Button  | Dashboard | Create trust | Click  | Opens trust establishment | ⚠️ Handler exists |

### QA Comments

## Recent Audit Events

| Widget          | Location  | Purpose | Action | Expected Result        | API Wired           |
|-----------------|-----------|---------|--------|------------------------|---------------------|
| Event List      | Dashboard | History | View   | Recent trust events    | ✅ GET /trust/audit |
| Event Action    | Event row | Type    | View   | What happened          | ✅                  |
| Event Resource  | Event row | Target  | View   | What was affected      | ✅                  |
| Event Result    | Event row | Outcome | View   | success/denied/failure | ✅                  |
| Event Timestamp | Event row | When    | View   | Formatted time         | ✅                  |

### QA Comments

---
# 15. TRUST CHAIN DETAIL (/trust/:agentId)

## Header

| Widget      | Location | Purpose  | Action | Expected Result   | API Wired                      |
|-------------|----------|----------|--------|-------------------|--------------------------------|
| Back Button | Top left | Navigate | Click  | Returns to /trust | N/A                            |
| Agent ID    | Title    | Identity | View   | Shows agent ID    | ✅ GET /trust/chains/{agentId} |

### QA Comments

## Trust Chain Viewer (5 Tabs)

| Tab          | Purpose     | Content                                    | API Wired |
|--------------|-------------|--------------------------------------------|-----------|
| Genesis      | Origin      | Agent ID, creation time, issuer            | ✅        |
| Capabilities | Permissions | List of capabilities with scope/limits     | ✅        |
| Delegations  | Sharing     | Who delegated to whom, status              | ✅        |
| Constraints  | Limits      | Rate limits, time windows, resource limits | ✅        |
| Audit        | History     | All audit records for this chain           | ✅        |

### QA Comments

## Genesis Tab

| Widget               | Purpose  | Content                |
|----------------------|----------|------------------------|
| Agent ID             | Identity | Full agent identifier  |
| Creation Timestamp   | History  | When chain was created |
| Expiration Timestamp | Validity | When chain expires     |
| Issuer Info          | Origin   | Who issued the chain   |

### QA Comments

## Capabilities Tab

| Widget          | Purpose    | Content                 |
|-----------------|------------|-------------------------|
| Capability Card | Permission | Each granted capability |
| Capability Type | Category   | Type of capability      |
| Scope           | Limit      | Scope of capability     |
| Limits          | Constraint | Usage limits            |
| Attestation     | Proof      | Attestation details     |

### QA Comments

## Delegations Tab

| Widget          | Purpose        | Content            |
|-----------------|----------------|--------------------|
| Delegation Card | Sharing record | Each delegation    |
| Delegator ID    | Source         | Who delegated      |
| Delegatee ID    | Target         | Who received       |
| Capabilities    | What           | What was delegated |
| Expiration      | Validity       | When it expires    |
| Status          | Current        | Active/revoked     |

### QA Comments

## Constraints Tab

| Widget          | Purpose  | Content                               |
|-----------------|----------|---------------------------------------|
| Constraint Card | Limit    | Each constraint                       |
| Type            | Category | rate_limit/time_window/resource_limit |
| Priority        | Order    | Constraint priority                   |
| Value           | Details  | JSON value                            |
| Source          | Origin   | Which agent set it                    |

### QA Comments

## Audit Tab

| Widget       | Purpose   | Content                |
|--------------|-----------|------------------------|
| Audit Record | History   | Each event             |
| Action       | What      | Action performed       |
| Resource     | Target    | What was affected      |
| Result       | Outcome   | success/denied/failure |
| Timestamp    | When      | Formatted time         |
| Chain Hash   | Integrity | Hash value             |
| Context      | Details   | JSON context           |

### QA Comments

## Chain Hash Display

| Widget       | Location    | Purpose   | Action | Expected Result                     |
|--------------|-------------|-----------|--------|-------------------------------------|
| Hash Display | Header area | Integrity | View   | Shows full chain hash in code block |

### QA Comments

---
# 16. COMPLIANCE DASHBOARD (/govern/compliance)

## Header & Actions

| Widget         | Location | Purpose         | Action | Expected Result        | API Wired                         |
|----------------|----------|-----------------|--------|------------------------|-----------------------------------|
| Page Title     | Top      | Identity        | View   | "Compliance Dashboard" | N/A                               |
| Refresh Button | Toolbar  | Reload data     | Click  | Refetches all data     | ✅                                |
| Export Button  | Toolbar  | Download report | Click  | Opens format menu      | ✅                                |
| Export CSV     | Menu     | CSV export      | Click  | Downloads CSV          | ✅ POST /export-compliance-report |
| Export PDF     | Menu     | PDF export      | Click  | Downloads PDF          | ✅                                |
| Export JSON    | Menu     | JSON export     | Click  | Downloads JSON         | ✅                                |

### QA Comments

## Filters

| Widget               | Location    | Purpose        | Action         | Expected Result           | API Wired |
|----------------------|-------------|----------------|----------------|---------------------------|-----------|
| Date Preset Selector | Filter area | Quick select   | Click          | Last 7/30/90 days, Custom | N/A       |
| Custom Date Range    | Filter area | Specific dates | Click "Custom" | Opens calendar picker     | N/A       |
| Calendar Popover     | Popup       | Select dates   | Click dates    | Sets date range           | N/A       |

### QA Comments

## Compliance Alerts Section

| Widget              | Location    | Purpose     | Action | Expected Result                                      | API Wired                       |
|---------------------|-------------|-------------|--------|------------------------------------------------------|---------------------------------|
| Alert Item          | Alerts list | Show issue  | View   | Alert with severity icon                             | ✅ GET /compliance-dashboard    |
| Severity Icon       | Alert       | Importance  | View   | Color-coded (critical=red, warning=amber, info=blue) | ✅                              |
| Alert Title         | Alert       | Identity    | View   | Alert name                                           | ✅                              |
| Alert Description   | Alert       | Details     | View   | What the issue is                                    | ✅                              |
| Alert Timestamp     | Alert       | When        | View   | Formatted time                                       | ✅                              |
| View Details Button | Alert       | Navigate    | Click  | Opens alert detail                                   | N/A                             |
| Dismiss Button      | Alert       | Acknowledge | Click  | Marks alert acknowledged                             | ✅ POST /alert/{id}/acknowledge |

### QA Comments

## Trust Health Bar

| Widget           | Location  | Purpose        | Action | Expected Result        | API Wired |
|------------------|-----------|----------------|--------|------------------------|-----------|
| Health Bar       | Section   | Visual summary | View   | Stacked horizontal bar | ✅        |
| Valid Segment    | Bar       | Healthy count  | View   | Green segment          | ✅        |
| Expiring Segment | Bar       | Warning count  | View   | Amber segment          | ✅        |
| Expired Segment  | Bar       | Critical count | View   | Red segment            | ✅        |
| Revoked Segment  | Bar       | Inactive count | View   | Gray segment           | ✅        |
| Percentage Label | Bar       | Summary        | View   | Percentage value       | ✅        |
| Legend           | Below bar | Key            | View   | Counts for each status | ✅        |

### QA Comments

## Constraint Violations Chart

| Widget          | Location | Purpose              | Action | Expected Result                      | API Wired |
|-----------------|----------|----------------------|--------|--------------------------------------|-----------|
| Chart Container | Grid     | Violations over time | View   | Bar chart                            | ✅        |
| Bar             | Chart    | Weekly data          | View   | Height = violation count             | ✅        |
| Bar Color       | Each bar | Severity             | View   | Blue (≤5), Amber (6-10), Red (>10)   | ✅        |
| Bar Click       | Any bar  | Filter               | Click  | Navigates to /govern/activity?week=X | N/A       |
| Y-Axis          | Chart    | Scale                | View   | Numeric labels                       | N/A       |
| Total Count     | Chart    | Summary              | View   | Total violations displayed           | ✅        |

### QA Comments

## Recent Audit Events

| Widget                | Location       | Purpose         | Action | Expected Result                  | API Wired |
|-----------------------|----------------|-----------------|--------|----------------------------------|-----------|
| Event List            | Grid           | Recent activity | View   | List of events                   | ✅        |
| Event Icon            | Event row      | Type indicator  | View   | Colored icon matching event type | ✅        |
| Event Description     | Event row      | What happened   | View   | Description text                 | ✅        |
| Actor Name            | Event row      | Who             | View   | User/agent name                  | ✅        |
| Timestamp             | Event row      | When            | View   | Formatted time                   | ✅        |
| Event Click           | Event row      | Navigate        | Click  | Opens event detail               | N/A       |
| View Full Audit Trail | Section footer | Navigate        | Click  | Goes to /govern/audit-trail      | N/A       |

### QA Comments

## Footer

| Widget       | Location | Purpose   | Action | Expected Result              |
|--------------|----------|-----------|--------|------------------------------|
| Last Updated | Bottom   | Freshness | View   | Timestamp of last data fetch |

### QA Comments

---
# 17. ENTERPRISE AUDIT TRAIL (/govern/audit-trail)

## Header & Actions

| Widget         | Location | Purpose    | Action | Expected Result          | API Wired                   |
|----------------|----------|------------|--------|--------------------------|-----------------------------|
| Page Title     | Top      | Identity   | View   | "Enterprise Audit Trail" | N/A                         |
| Refresh Button | Toolbar  | Reload     | Click  | Refetches data           | ✅                          |
| Export Button  | Toolbar  | Download   | Click  | Opens format menu        | ✅                          |
| Export CSV     | Menu     | CSV export | Click  | Downloads CSV            | ✅ POST /export-audit-trail |
| Export PDF     | Menu     | PDF export | Click  | Downloads PDF            | ✅                          |

### QA Comments

## Filters

| Widget               | Location   | Purpose        | Action           | Expected Result                                             | API Wired                         |
|----------------------|------------|----------------|------------------|-------------------------------------------------------------|-----------------------------------|
| Search Input         | Filter row | Text search    | Type search term | Filters events                                              | ✅ GET /audit-events?searchQuery= |
| Event Type Dropdown  | Filter row | Filter by type | Select           | All/Establish/Delegate/Revoke/Verify/Violation/Renew/Expire | ✅ GET /audit-events?type=        |
| Date Range Picker    | Filter row | Filter by date | Click            | Opens calendar popover                                      | ✅                                |
| Clear Filters Button | Filter row | Reset          | Click            | Clears all filters                                          | N/A                               |

### QA Comments

## Results Summary

| Widget      | Location   | Purpose | Action | Expected Result        |
|-------------|------------|---------|--------|------------------------|
| Event Count | Above list | Summary | View   | Shows "X events found" |

### QA Comments

# Audit Event List

| Widget           | Location     | Purpose        | Action               | Expected Result                  | API Wired |
|------------------|--------------|----------------|----------------------|----------------------------------|-----------|
| Event Row        | List         | Show event     | View                 | Event with icon, badge, metadata | ✅        |
| Event Type Icon  | Row left     | Type indicator | View                 | Icon with colored background     | ✅        |
| Event Type Badge | Row          | Type label     | View                 | Badge matching event type        | ✅        |
| Department Badge | Row          | Context        | View (if present)    | Department name                  | ✅        |
| Description      | Row          | What           | View                 | Event description                | ✅        |
| By (Actor)       | Row metadata | Who did it     | View                 | Actor name                       | ✅        |
| To (Target)      | Row metadata | Who affected   | View                 | Target name                      | ✅        |
| Chain            | Row metadata | Context        | View                 | Value chain name                 | ✅        |
| Timestamp        | Row right    | When           | View                 | Formatted (PPp format)           | ✅        |
| Row Click        | Row          | Expand         | Click                | Toggles expanded state           | N/A       |
| Expanded Details | Below row    | Full info      | View (when expanded) | JSON metadata display            | ✅        |

### QA Comments

## Event Type Icons & Colors

| Type      | Icon           | Color  |
|-----------|----------------|--------|
| ESTABLISH | CheckCircle2   | Green  |
| DELEGATE  | ArrowRightLeft | Purple |
| REVOKE    | XCircle        | Red    |
| VERIFY    | Shield         | Blue   |
| VIOLATION | AlertTriangle  | Amber  |
| RENEW     | RefreshCcw     | Green  |
| EXPIRE    | Clock          | Gray   |

### QA Comments

## Pagination

| Widget          | Location | Purpose    | Action | Expected Result     | API Wired |
|-----------------|----------|------------|--------|---------------------|-----------|
| Previous Button | Footer   | Go back    | Click  | Loads previous page | ✅        |
| Page Indicator  | Footer   | Location   | View   | "Page X of Y"       | ✅        |
| Next Button     | Footer   | Go forward | Click  | Loads next page     | ✅        |

### QA Comments

## States

| State   | Trigger        | Display                                                   |
|---------|----------------|-----------------------------------------------------------|
| Loading | While fetching | 5 skeleton rows                                           |
| Empty   | No results     | Shield icon + "No audit events found" + filter suggestion |
| Error   | API failure    | Error message                                             |

### QA Comments

---
# 18. METRICS PAGE (/metrics)

## Filters

| Widget              | Location   | Purpose | Action | Expected Result                                            | API Wired                  |
|---------------------|------------|---------|--------|------------------------------------------------------------|----------------------------|
| Time Range Dropdown | Filter bar | Period  | Select | 1h, 6h, 24h, 7d, 30d, 90d                                  | ✅ GET /metrics?timeRange= |
| Category Dropdown   | Filter bar | Type    | Select | All, Agents, Executions, Performance, Users, Usage, Errors | ✅ GET /metrics?category=  |
| Refresh Button      | Filter bar | Reload  | Click  | Spins, refetches data                                      | ✅                         |

### QA Comments

## Summary Statistics Card

| Widget            | Location   | Purpose     | Action | Expected Result  | API Wired               |
|-------------------|------------|-------------|--------|------------------|-------------------------|
| Total Agents      | Stats card | Count       | View   | Number of agents | ✅ GET /metrics/summary |
| Total Executions  | Stats card | Count       | View   | Execution count  | ✅                      |
| Success Rate      | Stats card | Percentage  | View   | Success %        | ✅                      |
| Avg Response Time | Stats card | Performance | View   | Time in ms       | ✅                      |
| Active Users      | Stats card | Count       | View   | User count       | ✅                      |
| API Calls         | Stats card | Count       | View   | Total API calls  | ✅                      |
| Error Rate        | Stats card | Percentage  | View   | Error %          | ✅                      |
| P95 Response Time | Stats card | Performance | View   | 95th percentile  | ✅                      |

### QA Comments

## Key Metrics Grid

| Widget         | Location    | Purpose           | Action | Expected Result                       | API Wired       |
|----------------|-------------|-------------------|--------|---------------------------------------|-----------------|
| Metric Card    | Grid        | Individual metric | View   | Name, value, sparkline                | ✅ GET /metrics |
| Metric Name    | Card header | Identity          | View   | Metric name                           | ✅              |
| Metric Value   | Card body   | Current           | View   | Formatted number (K, M)               | ✅              |
| Metric Unit    | Card body   | Context           | View   | Unit of measurement                   | ✅              |
| Trend Icon     | Card        | Direction         | View   | Up (green), Down (red), Stable (gray) | ✅              |
| Change Amount  | Card        | Delta             | View   | Absolute change                       | ✅              |
| Change Percent | Card        | Delta             | View   | Percentage change                     | ✅              |
| Sparkline      | Card        | History           | View   | Small line chart                      | ✅              |
| Card Click     | Card        | Toggle detail     | Click  | Shows/hides detailed chart            | N/A             |

### QA Comments

## Time Series Charts

| Widget          | Location       | Purpose       | Action | Expected Result  | API Wired              |
|-----------------|----------------|---------------|--------|------------------|------------------------|
| Chart Container | Charts section | Detailed view | View   | Line chart       | ✅ GET /metrics/series |
| X-Axis          | Chart          | Time          | View   | Time labels      | ✅                     |
| Y-Axis          | Chart          | Value         | View   | Value labels     | ✅                     |
| Line            | Chart          | Data          | View   | Metric over time | ✅                     |

### QA Comments

---
# 19. AUDIT PAGE (/audit)

## Filters

| Widget             | Location   | Purpose            | Action         | Expected Result                                                        | API Wired                |
|--------------------|------------|--------------------|----------------|------------------------------------------------------------------------|--------------------------|
| Search Input       | Filter row | Text search        | Type           | Searches across logs                                                   | ✅ GET /audit?search=    |
| Action Dropdown    | Filter row | Filter by action   | Select         | Create, Update, Delete, Login, Logout, Access, Export, Deploy, Execute | ✅ GET /audit?action=    |
| Status Dropdown    | Filter row | Filter by result   | Select         | Success, Failure                                                       | ✅ GET /audit?status=    |
| Resource Input     | Filter row | Filter by resource | Type           | Resource type                                                          | ✅ GET /audit?resource=  |
| Actor Input        | Filter row | Filter by user     | Type           | User name                                                              | ✅ GET /audit?actor=     |
| Start Date         | Filter row | Date range         | Click calendar | Select start date                                                      | ✅ GET /audit?startDate= |
| End Date           | Filter row | Date range         | Click calendar | Select end date                                                        | ✅ GET /audit?endDate=   |
| Clear Dates Button | Filter row | Reset dates        | Click          | Clears date filters                                                    | N/A                      |
| Export Button      | Toolbar    | Download           | Click          | Opens export dialog                                                    | ✅                       |

### QA Comments

## Audit Log Table

| Widget           | Location | Purpose | Action | Expected Result     | API Wired     |
|------------------|----------|---------|--------|---------------------|---------------|
| Timestamp Column | Table    | When    | View   | Formatted timestamp | ✅ GET /audit |
| Actor Column     | Table    | Who     | View   | User/system name    | ✅            |
| Action Column    | Table    | What    | View   | Action type         | ✅            |
| Resource Column  | Table    | Target  | View   | Resource affected   | ✅            |
| Status Column    | Table    | Result  | View   | Success/failure     | ✅            |

### QA Comments

## Pagination

| Widget          | Location | Purpose    | Action | Expected Result          | API Wired |
|-----------------|----------|------------|--------|--------------------------|-----------|
| Range Indicator | Footer   | Location   | View   | "Showing 1 to 20 of 150" | ✅        |
| Previous Button | Footer   | Go back    | Click  | Previous page            | ✅        |
| Next Button     | Footer   | Go forward | Click  | Next page                | ✅        |

### QA Comments

---
# 20. ALERTS PAGE (/alerts)

## Active Alerts List

| Widget             | Location    | Purpose     | Action | Expected Result                | API Wired                |
|--------------------|-------------|-------------|--------|--------------------------------|--------------------------|
| Search Input       | Filter area | Text search | Type   | Filters alerts                 | ✅ GET /alerts?search=   |
| Severity Filter    | Filter area | Filter      | Select | Critical, Warning, Info, All   | ✅ GET /alerts?severity= |
| Status Filter      | Filter area | Filter      | Select | Active, Acknowledged, Resolved | ✅ GET /alerts?status=   |
| Metric Filter      | Filter area | Filter      | Select | All available metrics          | ✅ GET /alerts?metric=   |
| Create Rule Button | Top right   | Create new  | Click  | Opens create dialog            | ✅                       |

### QA Comments

## Alert Card

| Widget            | Location    | Purpose       | Action | Expected Result                               | API Wired                        |
|-------------------|-------------|---------------|--------|-----------------------------------------------|----------------------------------|
| Severity Icon     | Card left   | Importance    | View   | Color-coded icon                              | ✅                               |
| Alert Name        | Card header | Identity      | View   | Alert name                                    | ✅                               |
| Alert Description | Card        | Details       | View   | Description text                              | ✅                               |
| Severity Badge    | Card        | Level         | View   | Critical (red), Warning (orange), Info (blue) | ✅                               |
| Status Badge      | Card        | Current state | View   | Active, Acknowledged, Resolved                | ✅                               |
| Condition         | Card        | Rule          | View   | What triggered it                             | ✅                               |
| Current Value     | Card        | Now           | View   | Current metric value                          | ✅                               |
| Threshold         | Card        | Limit         | View   | Threshold value                               | ✅                               |
| Triggered At      | Card        | When          | View   | Time ago format                               | ✅                               |
| Actions Menu      | Card right  | Options       | Click  | Opens dropdown                                | N/A                              |
| Acknowledge       | Menu option | Mark seen     | Click  | Updates status                                | ✅ POST /alerts/{id}/acknowledge |
| Resolve           | Menu option | Mark fixed    | Click  | Updates status                                | ✅ POST /alerts/{id}/resolve     |
| View History      | Menu option | Navigate      | Click  | Opens alert history                           | N/A                              |

### QA Comments

---
# 21. ALERT RULES PAGE (/alerts/rules)

## Rules Grid

| Widget             | Location   | Purpose          | Action | Expected Result       | API Wired                         |
|--------------------|------------|------------------|--------|-----------------------|-----------------------------------|
| Create Rule Button | Top right  | Create new       | Click  | Opens rule dialog     | ✅                                |
| Rule Card          | Grid       | Display rule     | View   | Rule info             | ✅ GET /alert-rules               |
| Rule Name          | Card title | Identity         | View   | Rule name             | ✅                                |
| Rule Description   | Card       | Details          | View   | Description           | ✅                                |
| Enabled Switch     | Card       | Toggle           | Click  | Enables/disables rule | ✅ PATCH /alert-rules/{id}/toggle |
| Metric             | Card       | What's monitored | View   | Metric name           | ✅                                |
| Threshold          | Card       | Limit            | View   | Threshold value       | ✅                                |
| Severity           | Card       | Level            | View   | Severity badge        | ✅                                |
| Delete Button      | Card       | Remove           | Click  | Confirmation, delete  | ✅ DELETE /alert-rules/{id}       |

### QA Comments

## Alert Rule Dialog

| Widget               | Location | Purpose         | Action | Expected Result          | API Wired                |
|----------------------|----------|-----------------|--------|--------------------------|--------------------------|
| Name Input           | Form     | Rule name       | Type   | 3-100 characters         | N/A                      |
| Description Textarea | Form     | Details         | Type   | Max 500 characters       | N/A                      |
| Metric Dropdown      | Form     | What to monitor | Select | Available metrics        | ✅                       |
| Operator Dropdown    | Form     | Comparison      | Select | gt, gte, lt, lte, eq, ne | N/A                      |
| Threshold Input      | Form     | Limit value     | Type   | Number                   | N/A                      |
| Duration Input       | Form     | Time window     | Type   | Seconds                  | N/A                      |
| Severity Buttons     | Form     | Alert level     | Click  | Info, Warning, Critical  | N/A                      |
| Enabled Switch       | Form     | Initial state   | Click  | On/off                   | N/A                      |
| Cancel Button        | Footer   | Close           | Click  | Dialog closes            | N/A                      |
| Submit Button        | Footer   | Save            | Click  | Creates/updates rule     | ✅ POST/PUT /alert-rules |

### QA Comments

---
# 22. HEALTH PAGE (/system-health)

## Header & Controls

| Widget              | Location | Purpose         | Action | Expected Result              | API Wired               |
|---------------------|----------|-----------------|--------|------------------------------|-------------------------|
| Auto-refresh Toggle | Header   | Toggle refresh  | Click  | Enables/disables 30s refresh | N/A                     |
| Refresh Button      | Header   | Manual refresh  | Click  | Refetches all data           | ✅ POST /health/refresh |
| Export Button       | Header   | Download report | Click  | Opens format menu            | ✅ POST /health/export  |

### QA Comments

## Overall Status Card

| Widget           | Location | Purpose        | Action | Expected Result                                  | API Wired             |
|------------------|----------|----------------|--------|--------------------------------------------------|-----------------------|
| Status Indicator | Card     | Overall health | View   | Healthy (green), Warning (amber), Critical (red) | ✅ GET /health/system |
| Status Badge     | Card     | Label          | View   | Health status text                               | ✅                    |

### QA Comments

## Services Grid

| Widget           | Location | Purpose            | Action | Expected Result                   | API Wired |
|------------------|----------|--------------------|--------|-----------------------------------|-----------|
| Service Card     | Grid     | Individual service | View   | Service status                    | ✅        |
| Service Name     | Card     | Identity           | View   | API Server, Database, Redis, etc. | ✅        |
| Status Indicator | Card     | Health             | View   | Green/amber/red dot               | ✅        |
| Uptime           | Card     | Reliability        | View   | Uptime percentage                 | ✅        |
| Latency          | Card     | Performance        | View   | Response time                     | ✅        |
| Last Check       | Card     | Freshness          | View   | Time of last health check         | ✅        |

### QA Comments

## Dependencies Section

| Widget          | Location | Purpose          | Action | Expected Result              | API Wired |
|-----------------|----------|------------------|--------|------------------------------|-----------|
| Dependency Card | Grid     | External service | View   | Dependency status            | ✅        |
| Dependency Name | Card     | Identity         | View   | External Auth, Storage, etc. | ✅        |
| Type            | Card     | Category         | View   | Dependency type              | ✅        |
| Status          | Card     | Health           | View   | Status indicator             | ✅        |
| Message         | Card     | Details          | View   | Status message               | ✅        |

### QA Comments

## Health Metrics

| Widget              | Location | Purpose     | Action | Expected Result       | API Wired |
|---------------------|----------|-------------|--------|-----------------------|-----------|
| Response Time (Avg) | Metrics  | Performance | View   | Average response time | ✅        |
| Response Time (P95) | Metrics  | Performance | View   | 95th percentile       | ✅        |
| Response Time (P99) | Metrics  | Performance | View   | 99th percentile       | ✅        |
| Error Rate          | Metrics  | Reliability | View   | Error percentage      | ✅        |
| Request Count       | Metrics  | Load        | View   | Total requests        | ✅        |
| CPU Usage           | Metrics  | Resources   | View   | CPU percentage        | ✅        |
| Memory Usage        | Metrics  | Resources   | View   | Memory percentage     | ✅        |

### QA Comments

## Incident Timeline

| Widget            | Location | Purpose       | Action             | Expected Result             | API Wired                |
|-------------------|----------|---------------|--------------------|-----------------------------|--------------------------|
| Incident Card     | Timeline | Show incident | View               | Incident details            | ✅ GET /health/incidents |
| Incident Title    | Card     | Identity      | View               | Incident name               | ✅                       |
| Severity Badge    | Card     | Importance    | View               | Critical/High/Medium/Low    | ✅                       |
| Status Badge      | Card     | Current       | View               | Open/Investigating/Resolved | ✅                       |
| Start Time        | Card     | When started  | View               | Formatted time              | ✅                       |
| End Time          | Card     | When resolved | View (if resolved) | Formatted time              | ✅                       |
| Duration          | Card     | How long      | View               | Duration in minutes         | ✅                       |
| Affected Services | Card     | Impact        | View               | Service badges              | ✅                       |

### QA Comments

