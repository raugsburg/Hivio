Every Sprint
Roles are assigned at sprint start
Prompt Lead creates a feature branch from main using this format:
feature/US-001-create-student-account

Every Coding Session
Before you start:
Open your feature branch, never work on main
Re-paste CONTEXT.md into Claude if starting a new conversation

While building:
Reference the exact user story and acceptance criteria in your first prompt
Break the feature into small prompts, never ask Claude to build everything at once
Commit after every working change
If you do not understand what was generated, stop and figure it out before continuing
If the conversation gets long or confused, start a new one and re-paste CONTEXT.md

Before closing Claude:
Paste the Standard Session Summary Prompt below into Claude
Add your [MY NOTE: ...] annotations to the generated summary, this is the graded part
Save the annotated summary as sessions/YYYY-MM-DD-story-name-summary.md
Commit both files to your feature branch
Periodically go to Settings > Privacy > Export Data on claude.ai for your raw backup

---------------------------------------------------------------------
Standard Session Summary Prompt: 
Summarize this coding session using the following structure:
SESSION OVERVIEW: Date, user story being worked on, team member name, role this rotation.
PROMPTS GIVEN: List every prompt I gave you in this session. For each, include the prompt text (or a clear summary if very long) and what you generated in response.
WHAT WAS BUILT: List the files created or modified and what each one does.
WHAT I CHANGED MANUALLY: List anything I edited, deleted, or rewrote after you generated it, and describe the change.
WHAT FAILED OR WAS REJECTED: List any prompts where the output was wrong, incomplete, or unusable. Describe what went wrong.
WHAT IS STILL UNFINISHED: List any acceptance criteria or features that are not yet complete after this session.
DECISIONS MADE: List any architecture, design, or implementation decisions made during this session and the reasoning behind each
----------------------------------------------------------------------

When a Story Is Complete:
Open a pull request on GitHub
Code Reviewer reviews and approves or requests changes
Test and QA tests every acceptance criterion and logs bugs as GitHub issues
UX and Integration verifies visual correctness and confirms nothing is broken
All pass → merge PR → mark story Done in Smartsheet

Add entry to CHANGELOG.md using this format example:
#[Date] - US-001: Create Student Account
User Story: (The original user story text)
What Changed: (Brief description of what was built or modified)
AI Tool Used: (Claude, Codex, github, etc. Include version if known)
Session References: sessions/YYYY-MM-DD-story-name-summary.md
Manual Edits: What you changed by hand after AI generated it and why?
Who Did What: Prompt Lead: [Name] | Reviewer: [Name] | QA: [Name] | UX: [Name]

When Things Change:
User story changes
Keep the original story text, never delete it
Document the revised text and reason for the change
Note which acceptance criteria were added, removed, or modified
Update Smartsheet

Data model changes:
Document what changed, what it was before, what it is now, and why
Update CONTEXT.md on main immediately

Per Gate Portfolio Requirements
Add an AI Usage Section to Google Sites containing:
Link to sessions/ folder on GitHub
Total session count broken down by user story
Examples of prompts that worked and prompts that failed
Summary of all manual edits and why they were necessary
Lessons learned about working with AI tools

End of Each Rotation
Every team member posts a Role Rotation Log to Google Sites answering these five questions in 3-5 sentences each:
What was your role this rotation?
What specific work did you complete?
What AI tools did you use and how?
What did you have to fix or override?
What would you do differently?

Mistakes that will hurt your grade:
Mistake                                                Why it Hurts
One person does all prompting                          Rotation is graded, everyone must contribute
Not committing frequently                              Cannot prove contribution, risk losing work
Pasting DFD images into Claude                         Claude cannot read them, use text in CONTEXT.md
Accepting AI output without reading it                 Cannot explain it in your interview 
Skipping pull requests                                 No audit trail, this is graded 
Not updating CONTEXT.md                                AI output degrades, bugs multiply  
Waiting until gate week to code                        Debugging is slow, start early  
Deleting original user stories                         You need before and after for your portfolio 
Not exporting sessions                                 No proof the work happened   
Skipping annotations                                   The AI summary alone gets no credit

