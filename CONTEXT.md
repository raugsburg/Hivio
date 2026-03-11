Product Vision:
Hivio is a job application tracking platform that helps college students organize and manage their job search in one centralized system. It solves the problem of disorganized and inefficient job searching by allowing students to track applications, statuses, resumes, notes, and follow-ups in one place. Unlike spreadsheets, notes apps, or job boards, Hivio focuses specifically on tracking and follow-through, providing analytical feedback that helps students understand what strategies are working and improve their chances of success.

Tech Stack:
React Frontend, Node.js Backend, Firebase/SQL Database, JWT Security, Claude/Github Copilot Coding/ChatGPT (Codex)

User Stories:
User Onboarding & Security
1. As a student, I want to create an account so my data is saved and secure. Acceptance Criteria: "Given a new user is on the registration page. When they enter valid credentials and sign up. Then an account is created and the user is redirected to the dashboard."
2. As a student, I want a secure login so my information is protected. Acceptance Criteria: "Given a registered user exists. When they enter correct login credentials. Then they are authenticated and granted access."
3. As a student, I want to set-up a profile so my dashboard is personalized. Acceptance Criteria: "Given the profile setup page is open. When the user enters or edits profile information and saves. Then the updated information is stored and displayed on future logins."

EPIC: Application Creation

As a student, I want to add a job application that I can track and organize my job search.
Given the job application form is displayed.
When the user enters required job details (company, position, date) and saves.
Then the application is stored and displayed on the dashboard.

As a student, I want to link resumes to applications so that I can view performance of each resume.
Given the job application form includes a resume selection option.
When the user selects a resume and saves the application.
Then the selected resume is linked to that application.

As a student, I want to edit details on my application so my record is up-to-date.
Given an existing job application record.
When the user updates details and saves.
Then the updated information replaces the previous data and is displayed on the dashboard.

EPIC: Application Management

As a student, I want to update my application status so I can track the progress.
Given an existing job application.
When the user selects a new status (Applied, Interview, Rejected).
Then the updated status is saved and displayed on the dashboard.

As a student, I want to add notes to my applications so I can reference important details.
Given an existing job application.
When the user enters notes and saves.
Then the notes are stored and viewable under that application.

As a student, I want to archive or delete old applications so my dashboard stays organized.
Given an existing job application.
When the user selects archive/delete.
Then the application is deleted or moved to the archive list and removed from active view.

EPIC: User Interface Experience

As a student, I want a light mode and dark mode option so I can choose what feels better.
Given the user is in the settings menu.
When the user selects light or dark mode.
Then the selected theme is applied to the entire app across all tabs.

As a student, I want little visual clutter so I can focus on managing my applications efficiently.
Given the user is on any tab (dashboard, calendar, etc).
When the page loads and displays.
Then the essential information is displayed and things like pop ups or random buttons are minimized.

As a student, I want applications to be visually distinct depending on their status so I can quickly assess my progress.
Given applications are displayed on the dashboard.
When all the different applications are shown.
Then the status of applications is visually identifiable and represented with a consistent indicator.

EPIC: Visual Identity

As a student, I want a clean and modern interface so that the app feels professional.
Given the user opens the app.
When the dashboard or other tabs load.
Then the layout and spacing follow a consistent modern design.

As a student, I want consistent colors and style around the app so I don't get confused or overwhelmed.
Given the user is navigating between different pages.
When viewing links, buttons, alerts, etc.
Then the color palette and style follows the system design consistently.

As a student, I want the text to have contrast with the background so it is readable and less stressful for my eyes.
Given the user is on any tab of the app.
When text appears anywhere on the screen.
Then the text color is contrasting with the background and isn't hard to read.

EPIC: Analytics Dashboard

As a student, I want to see a summary of my total applications so that I can track my overall progress.
Given the user opens the analytics dashboard.
When viewing the dashboard.
Then the total number of applications are displayed.

As a student, I want to see a breakdown of my application outcomes so that I can understand my overall results.
Given the user opens the analytics dashboard.
When applications are marked with the different statuses.
Then system displays the different applications based on each's status.

As a student, I want to compare the different statuses by resume so that I can identify which resume performs better.
Given the user has multiple resumes linked to applications.
When the analytics dashboard is opened.
Then the system displays the number of (interview, accepted, rejected) for each resume

Data Model:
A Student has many Job Applications.
Each Job Application belongs to one Student.

A Job Application has many Status Updates.
Each Status Update belongs to one Job Application and records a status value and timestamp.

A Job Application has many Notes.
Each Note belongs to one Job Application and stores text content and a creation date.

A Job Application can have many Reminders.
Each Reminder belongs to one Job Application and stores a follow-up date and completion status.

A Resume can be linked to many Job Applications.
Each Job Application references one Resume file.

DFD Summary:
1.0 Manage User Account
Takes student registration and login information, validates credentials, and stores or retrieves student data in the students data store.
2.0 Manage Job Application
Takes job application details from the student, validates the input, and stores or updates the record in the Job Applications data store.
3.0 Update Application Status
Takes a status update (applied, interview, offer, rejection) from the student and stores the updated status in the Job Applications data store.
4.0 Manage Notes and Resumes
Takes notes and resume files from the student, stores notes in the Notes data store, and stores resume files or file references in the Resumes data store linked to a specific job application.
5.0 Generate Reminder List
Takes follow-up dates from job applications, generates reminder records, stores them in the Reminders data store, and outputs a reminder list to the student.
6.0 Display Application Dashboard
Retrieves job application and reminder data from the Job Applications and Reminders data stores, processes the information, and displays the application dashboard to the student.
7.0 View Interview Information
Retrieves interview-related details from the Job Applications data store and displays upcoming interview information to the student.

CUJ Summaries:
1. First-Time User Sets Up Hivio Account
The student registers for an account by entering their name, email, and password. The system validates the information, creates a new user record, and securely stores credentials. After successful registration, the student is redirected to their dashboard to begin tracking applications.
2. Student Tracks a Job Application
The student enters job details such as company name, job title, application date, status, notes, resume, and follow-up date. The system stores this information in the Job Applications data store and generates reminders if applicable. The dashboard updates in real time to reflect the new or modified application.
3. Student Experiences Strong Brand Identity
When interacting with Hivio, the student encounters consistent design, clear messaging, and a simple workflow tailored specifically to students. The interface reinforces trust, professionalism, and clarity through cohesive UI/UX design. This strengthens user engagement and encourages continued use during a stressful job search process.
4. Student Reviews Job Search Insights
The student accesses their dashboard to review application statuses, follow-ups, and trends in outcomes (i.e. interviews vs rejections). The system collects stored application data and presents meaningful insights to help the student evaluate what strategies are working. The student can adjust their job search behavior based on these analytics.

Architechture Decisions:
React was chosen over static HTML because Hivio requires dynamic state updates (real-time dashboard changes, reminder updates, and status tracking). React enables reusable components, efficient UI rendering, and scalable architecture as features grow. This improves maintainability and user experience. 
A relational or structured NoSQL database was selected instead of spreadsheet-style storage to enforce entity relationships (Users → Applications → Notes → Reminders). This ensures data integrity, scalability, and proper querying for analytics generation.
Using a managed authentication solution (i.e. Firebase Auth or Auth0) reduces security risk and ensures proper password hashing and session handling. This prevents vulnerabilities common in custom-built authentication systems.
Claude code chosen due to its powerful coding prowess and its advantages over chatgpt. We also want to use Github Copilot possibly for debugging and review. 
Resume files are stored using a cloud storage service rather than local browser storage to ensure persistence, accessibility across devices, and secure file handling. 

Constraints:
Budget is $40,000 for Gate 1 scope. One-time development costs are ~$31,300 for labor, software, and training. Annual operating costs start at $2,199 in Year 1 and rise to $3,099 by Year 3. ROI is estimated at 7.4% over three years. Prioritize core features, avoid costly feature creep. UI customization and email/calendar integration can be cut if needed, but status updates and notifications are required.

Primary users are college students and recent graduates, with secondary users managing multiple resumes or interviews. Stakeholders include university career services. The interface should be clean, simple, readable, intuitive, and provide notifications for follow-ups. The platform must be web-based, mobile-responsive, support modern browsers, and use high-contrast fonts.

The MVP will be a App-based application and development using GitHub and AI tools. It must run independently with clear setup instructions, provide full CRUD functionality, reminders, and resume storage. AI is only for development assistance; no runtime dependency. Hosting can be cloud or local, for development claude window is fine. Just need to be able to run this locally towards the end of the project. lightweight for demos. Users are primarily students; employer/recruiter access is out of scope.

Timeline is 15 weeks. Tools include React Frontend, Node.js Backend, Firebase/SQL Database, JWT Security, Claude/Github Copilot Coding. API integration is possible but avoid overengineering. MVP scope includes job tracking, statuses, notes, and follow-up reminders, and analytics. Out of scope are employer/recruiter access, calendar integrations, and application submission.



