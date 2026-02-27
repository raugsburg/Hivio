Product Vision:
Hivio is a job application tracking platform that helps college students organize and manage their job search in one centralized system. It solves the problem of disorganized and inefficient job searching by allowing students to track applications, statuses, resumes, notes, and follow-ups in one place. Unlike spreadsheets, notes apps, or job boards, Hivio focuses specifically on tracking and follow-through, providing analytical feedback that helps students understand what strategies are working and improve their chances of success.

Tech Stack:
React Frontend, Node.js Backend, Firebase/SQL Database, JWT Security, Claude/Github Copilot Coding

User Stories:
User Onboarding & Security
As a student, I want to create an account so my data is saved and secure. Acceptance Criteria: "Given a new user is on the registration page. When they enter valid credentials and sign up. Then an account is created and the user is redirected to the dashboard."
As a student, I want a secure login so my information is protected. Acceptance Criteria: "Given a registered user exists. When they enter correct login credentials. Then they are authenticated and granted access."
As a student, I want to set-up a profile so my dashboard is personalized. Acceptance Criteria: "Given the profile setup page is open. When the user enters or edits profile information and saves. Then the updated information is stored and displayed on future logins."

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



