## 5.2 Test Plan

### 5.2.1 Unit Testing

Unit testing was planned using controlled inputs and predetermined expected outcomes. It enables faults to be identified in validation rules, calculations, data processing, authentication, authorisation and access-control logic before they affect larger workflows within the system. The same tests can also be repeated after changes are made to the application to determine whether previously functioning features continue to operate correctly.

For APU CareerHub, this section combines function-level and implementation-level testing because the application integrates frontend interfaces, Next.js server components and actions, Firebase Authentication, Cloud Firestore and Firebase Cloud Storage. The testing covers valid and invalid inputs, boundary values, authentication states, role-based permissions, record ownership, file restrictions, vacancy and application workflows, administrative controls, error handling and data consistency.

The tests are organised into 17 functional and technical categories containing 213 planned test cases. Each table contains the Test Case ID, Test Procedure, Test Data or Condition, Expected Outcome, Actual Outcome and Result. As this subsection represents the test plan, the Actual Outcome and Result columns remain blank until the tests are executed and reported in Section 5.3.1.

*Table 5.X: Home Page and Public Navigation Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 1.1 | Open the APU CareerHub home page. | `/` | The page should display the CareerHub branding, introductory content, published opportunities, process information and public navigation. |  |  |
| 1.2 | Select the CareerHub logo or Home link. | Logo or Home navigation item | The user should remain on or return to the home page. |  |  |
| 1.3 | Select the Browse jobs call-to-action. | Browse jobs button | The public vacancy-listing page should open. |  |  |
| 1.4 | Search for a published vacancy from the home page. | Keyword matching a vacancy title | The jobs page should open with the supplied query and display matching published vacancies. |  |  |
| 1.5 | Open the public vacancy listing. | `/jobs` | Only vacancies with the `published` status should be displayed. |  |  |
| 1.6 | Open a published vacancy card. | Valid published vacancy identifier | The vacancy-details page should display the title, department, description, responsibilities, requirements, skills, compensation, location, hours and deadline. |  |  |
| 1.7 | Open an unpublished vacancy through a direct URL. | Draft, pending, rejected, closed or archived vacancy identifier | The vacancy should not be disclosed publicly, and the branded not-found page should appear. |  |  |
| 1.8 | Select the Login navigation option. | Login link | The login page should open. |  |  |
| 1.9 | Select the Register navigation option. | Register link | The student and employer registration page should open. |  |  |
| 1.10 | Attempt to open a protected role route while signed out. | `/student`, `/employer` or `/admin` | The user should be redirected safely to the login page. |  |  |

These tests cover the public entry point, navigation controls, published-vacancy access and protected routes. Their purpose is to confirm that visitors can discover authorised public information without gaining access to Student, Employer or Administrator functions.

*Table 5.X: User Registration Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 2.1 | Open the registration page. | `/register` | The registration form and Student and Employer role options should be displayed. |  |  |
| 2.2 | Select the Student registration role. | Student | The Student ID and Programme fields should appear, while the Department field should be hidden. |  |  |
| 2.3 | Select the Employer registration role. | Employer | The Department field and employer-approval notice should appear, while Student fields should be hidden. |  |  |
| 2.4 | Submit the registration form with all fields empty. | Empty form | Browser validation should prevent submission and identify the required fields. |  |  |
| 2.5 | Enter an invalid email address. | `studentemail` | Email-format validation should prevent registration. |  |  |
| 2.6 | Enter a password below the minimum length. | Seven-character password | Registration should be prevented, and the user should be instructed to use at least eight characters. |  |  |
| 2.7 | Register with an email address that already exists. | Existing Firebase Authentication email | Registration should be rejected with a duplicate-account message. |  |  |
| 2.8 | Submit Student registration without a Student ID. | Valid common fields; Student ID empty | Registration should be prevented because Student ID is required. |  |  |
| 2.9 | Submit Student registration without a Programme. | Valid common fields; Programme empty | Registration should be prevented because Programme is required. |  |  |
| 2.10 | Submit Employer registration without a Department. | Valid common fields; Department empty | Registration should be prevented because Department is required. |  |  |
| 2.11 | Submit valid Student registration information. | Unique email, valid password, full name, Student ID and Programme | A Firebase user and active Student profile should be created, the Student role claim should be assigned and the Student dashboard should open. |  |  |
| 2.12 | Submit valid Employer registration information. | Unique email, valid password, full name and APU department | A Firebase user and pending Employer profile should be created, and the user should be returned to login with an approval-pending message. |  |  |
| 2.13 | Attempt to create an Administrator through public registration. | Modified request containing `admin` | The server should reject the role because only Student and Employer are accepted publicly. |  |  |
| 2.14 | Simulate failure while creating the Firestore profile after Firebase signup. | Valid registration with forced profile-write failure | Registration should fail cleanly and the partially created Firebase Authentication user should be removed. |  |  |

The registration tests examine dynamic role fields, mandatory information, email and password validation, duplicate accounts, trusted role assignment and rollback behaviour. These controls ensure that Students receive immediate access, Employers remain pending until approval and Administrator privileges cannot be obtained through the public form.

*Table 5.X: Login, Password Reset and Session Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 3.1 | Open the login page while signed out. | `/login` | The email, password and password-reset controls should be displayed. |  |  |
| 3.2 | Submit the login form without credentials. | Empty email and password | Browser validation should prevent submission. |  |  |
| 3.3 | Sign in using an invalid email or password. | Registered email with incorrect password | A general incorrect-credentials message should appear without revealing which value was incorrect. |  |  |
| 3.4 | Sign in using valid Student credentials. | Active Student account | A secure session should be created and the Student dashboard should open. |  |  |
| 3.5 | Sign in using valid approved Employer credentials. | Active approved Employer account | A secure session should be created and the Employer dashboard should open. |  |  |
| 3.6 | Sign in using valid Administrator credentials. | Active Administrator account | A secure session should be created and the Administrator dashboard should open. |  |  |
| 3.7 | Sign in using a pending Employer account. | Employer with `approved=false` | Session creation should be refused until an Administrator approves the account. |  |  |
| 3.8 | Sign in using a deactivated account. | `accountActive=false` | Access should be refused and no valid portal session should remain. |  |  |
| 3.9 | Create a session with mismatched profile and role claim. | Firestore role different from custom claim | Session creation should be rejected as an authorisation inconsistency. |  |  |
| 3.10 | Select Forgot password without entering an email. | Empty email field | A message should instruct the user to enter an email address first. |  |  |
| 3.11 | Request a password reset for a registered email. | Existing account email | Firebase should accept the request and a password-reset confirmation message should appear. |  |  |
| 3.12 | Sign out through the account menu. | Valid authenticated session | Firebase browser authentication and the HTTP-only server session should be cleared, and the login page should open. |  |  |

These tests cover credential validation, secure session creation, employer approval, account activation, role consistency, password recovery and logout. They confirm that each verified role reaches the correct dashboard and that invalid or unauthorised identities cannot retain access.

*Table 5.X: Student Dashboard and Job Discovery Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 4.1 | Open the Student dashboard. | Active Student session | The page should display application metrics, available opportunities, recent activity, profile completion and recommended vacancies. |  |  |
| 4.2 | Open the dashboard for a Student with no applications. | New Student account | Appropriate zero-value metrics and helpful empty states should be displayed without errors. |  |  |
| 4.3 | Open the authenticated job explorer. | `/student/jobs` | The current set of published vacancies should be displayed. |  |  |
| 4.4 | Search vacancies by title. | Partial published vacancy title | Only matching published vacancies should remain visible. |  |  |
| 4.5 | Search vacancies by department. | Existing department name | Vacancies belonging to the matching department should be displayed. |  |  |
| 4.6 | Search vacancies by skill. | Skill stored in a vacancy | Vacancies containing the matching skill should be displayed. |  |  |
| 4.7 | Filter vacancies by category. | Technology, Research or another category | Only published vacancies in the selected category should be displayed. |  |  |
| 4.8 | Filter vacancies by employment type. | Part-time, Temporary or Project-based | Only published vacancies with the selected employment type should be displayed. |  |  |
| 4.9 | Combine a keyword and vacancy filter. | Matching keyword and category | Results should satisfy both the keyword and selected filter. |  |  |
| 4.10 | Clear all search and filter values. | Empty keyword and All filters | The complete published-vacancy list should return. |  |  |
| 4.11 | Search using a value with no matches. | Unrelated keyword | A clear no-results state should appear. |  |  |
| 4.12 | Compare vacancy recommendations with Student skills. | Student skills matching a published vacancy | Matching opportunities should receive higher recommendation relevance on the dashboard. |  |  |

The Student dashboard and job-discovery tests examine live overview information, empty states, keyword matching, category and employment-type filtering, combined filters and skill-based vacancy ordering. These tests ensure that Students can locate relevant approved opportunities efficiently.

*Table 5.X: Student Profile and Account Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 5.1 | Open the Student profile page. | `/student/profile` | The Student's stored personal, academic and employability information should be displayed. |  |  |
| 5.2 | Update the Student's full name. | Valid non-empty name | The updated name should be stored and displayed throughout the Student portal. |  |  |
| 5.3 | Submit the profile with a blank required name. | Empty full name | The update should be rejected with a validation response. |  |  |
| 5.4 | Update the Student ID and Programme. | Valid academic information | The updated academic information should be stored and remain after refresh. |  |  |
| 5.5 | Update the phone number. | Valid phone value | The new phone number should be saved in the Student profile. |  |  |
| 5.6 | Update the personal introduction. | Valid introduction text | The introduction should be saved and displayed when the profile is reopened. |  |  |
| 5.7 | Add a set of Student skills. | Comma-separated skills | The skills should be stored and used when ordering recommended vacancies. |  |  |
| 5.8 | Update weekly availability. | Valid availability information | The availability information should be saved and remain after a new login. |  |  |
| 5.9 | Update the available-from date. | Valid future or current date | The date should be saved in the Student profile. |  |  |
| 5.10 | Refresh the profile page after saving. | Previously updated profile | The latest saved values should be returned from Firestore. |  |  |
| 5.11 | Observe profile completion after filling missing fields. | Previously incomplete profile | The profile-completion percentage on the dashboard should increase according to the completed fields. |  |  |

These tests cover the maintenance and persistence of Student profile information. They also verify that stored skills and completed profile fields influence the dashboard information derived for the Student.

*Table 5.X: Profile Picture and Document Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 6.1 | Open the Student documents page with no uploaded documents. | New Student account | An empty state and document-upload control should be displayed. |  |  |
| 6.2 | Upload a valid PDF document. | PDF below 5 MB | The file should be stored under the Student's protected path and its metadata should appear in the document list. |  |  |
| 6.3 | Upload a valid DOC document. | DOC below 5 MB | The document should be accepted and listed. |  |  |
| 6.4 | Upload a valid DOCX document. | DOCX below 5 MB | The document should be accepted and listed. |  |  |
| 6.5 | Upload an unsupported document type. | EXE, TXT or image file | The upload should be rejected with a supported-file-type message. |  |  |
| 6.6 | Upload an oversized document. | Supported document above 5 MB | The upload should be rejected without creating Storage or Firestore records. |  |  |
| 6.7 | Upload two documents with the same original filename. | Two valid files named `CV.pdf` | Unique Storage paths should prevent the files from overwriting one another. |  |  |
| 6.8 | Download an owned document. | Valid owned document identifier | The server should stream the file as a protected, non-cacheable attachment. |  |  |
| 6.9 | Rename an owned document. | Valid display name retaining the original extension | The metadata display name should change without moving or altering the stored file. |  |  |
| 6.10 | Rename a document without its original extension. | Name without `.pdf`, `.doc` or `.docx` | The rename should be rejected because the original extension must be retained. |  |  |
| 6.11 | Rename a document using path or control characters. | Name containing `/`, `\\` or control characters | The rename should be rejected as unsafe. |  |  |
| 6.12 | Delete an unused owned document. | Document not referenced by an application | The Firestore metadata and corresponding Storage object should be removed. |  |  |
| 6.13 | Delete a document used by an existing application. | Submitted application references the document | Deletion should be refused with a conflict response so the submitted evidence remains available. |  |  |
| 6.14 | Upload a valid profile picture. | JPEG, PNG or WebP below 3 MB | The binary signature and MIME type should be validated, and the protected picture should replace the initials display. |  |  |
| 6.15 | Upload an invalid or oversized profile picture. | Unsupported type, mismatched signature or file above 3 MB | The upload should be rejected without changing the current picture. |  |  |

These tests examine private file storage, supported formats, size limits, unique paths, protected downloads, safe renaming, retention of submitted documents and optional profile pictures. The purpose is to ensure that a Student can manage personal files without compromising application evidence or file privacy.

*Table 5.X: Job Application Submission and Tracking Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 7.1 | Open the application page as a Student. | Published vacancy before its deadline | The application form, vacancy summary, cover-letter field, document selector and confirmation control should appear. |  |  |
| 7.2 | Open the application page as an Employer or Administrator. | Non-Student authenticated role | The user should be redirected away from the Student-only application flow. |  |  |
| 7.3 | Open the application page for an unpublished vacancy. | Draft, pending, rejected or closed vacancy | The application should be unavailable and the not-found response should appear. |  |  |
| 7.4 | Submit an empty application form. | Empty cover letter, no document and no confirmation | Submission should be prevented by the required controls. |  |  |
| 7.5 | Enter a cover letter below the minimum length. | Fewer than 80 characters | Submission should be rejected with a cover-letter validation response. |  |  |
| 7.6 | Open the application form without an uploaded document. | Student document collection empty | A message should instruct the Student to upload a CV, and submission should remain unavailable. |  |  |
| 7.7 | Complete the form without selecting a document. | Valid cover letter and confirmation; no explicit selection | The submit button should remain disabled until the Student selects a document. |  |  |
| 7.8 | Submit without accepting the confirmation statement. | Valid cover letter and selected document | Browser validation should prevent submission. |  |  |
| 7.9 | Submit a valid application. | Valid cover letter, owned document and confirmation | The application, initial status history and audit record should be created, the vacancy applicant count should increase and a success state should appear. |  |  |
| 7.10 | Submit another application for the same vacancy. | Existing Student-vacancy application | The deterministic identifier and server validation should prevent the duplicate application. |  |  |
| 7.11 | Submit an application after the deadline. | Published vacancy with expired deadline | The server should reject the application even if the page was opened before expiry. |  |  |
| 7.12 | Submit an application for a vacancy that has been closed. | Vacancy status changed to `closed` | The application should be rejected because the vacancy is no longer published. |  |  |
| 7.13 | Modify the request to use another Student's document. | Non-owned document identifier | The server should reject the request after checking document ownership and protected Storage path. |  |  |
| 7.14 | Open My applications after a successful submission. | `/student/applications` | The new application should appear in the active list with its current status. |  |  |

The application tests cover role eligibility, vacancy state, cover-letter validation, explicit document selection, consent, deadlines, duplicate prevention, record ownership and application tracking. These checks are important because an application must preserve the exact Student document and vacancy state authorised at submission time.

*Table 5.X: Application Details, History and Student Notification Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 8.1 | Open the Student application list. | Student with active and final applications | Active records should be separated from rejected or withdrawn records using the available tabs. |  |  |
| 8.2 | Open an owned application. | Valid owned application identifier | The job summary, current status, submitted date, document and ordered status timeline should appear. |  |  |
| 8.3 | Open another Student's application through a direct URL. | Application owned by another UID | The application should not be disclosed, and the not-found response should appear. |  |  |
| 8.4 | Download the document attached to an owned application. | Valid submitted document | The protected download should succeed for the application owner. |  |  |
| 8.5 | Review the initial application history. | Newly submitted application | The timeline should contain the initial `submitted` event. |  |  |
| 8.6 | Review the application after an Employer status update. | Status changed to `under_review` or later | The current status and ordered history should reflect the Employer's decision. |  |  |
| 8.7 | Review a Student-facing Employer message. | Status update containing a public message | The message should appear in the Student timeline or application details. |  |  |
| 8.8 | Check for exposure of an Employer's internal note. | Status history containing a private note | The internal note should not be displayed to the Student. |  |  |
| 8.9 | Trigger a live application update while the page is visible. | Employer changes application status | The Student view should refresh after the live Firestore update. |  |  |
| 8.10 | Open the Student dashboard after a final decision. | Offered or rejected application | Dashboard and application metrics should reflect the latest application status. |  |  |

These tests assess application ownership, protected evidence, immutable history, Student-facing communication, private Employer notes and live status updates. They confirm that Students receive transparent progress information without being shown internal recruitment information.

*Table 5.X: Employer Dashboard and Department Profile Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 9.1 | Open the Employer dashboard. | Active approved Employer session | Published-vacancy, applicant and awaiting-review metrics should be displayed. |  |  |
| 9.2 | Open the dashboard for an Employer with no vacancies. | Newly approved Employer | Zero-value metrics and an appropriate create-vacancy state should appear. |  |  |
| 9.3 | Display recent applicants. | Applications submitted to owned vacancies | Only applicants connected to vacancies owned by the current Employer should be shown. |  |  |
| 9.4 | Display vacancy performance. | Employer with several vacancies | Applicant counts and vacancy statuses should be shown for the Employer's own vacancies. |  |  |
| 9.5 | Close a published vacancy and refresh the dashboard. | Owned published vacancy | The vacancy should no longer be counted as an active published vacancy. |  |  |
| 9.6 | Trigger a new application while the dashboard is open. | Student applies to an owned vacancy | Live data should refresh the relevant applicant and review metrics. |  |  |
| 9.7 | Open the Employer department-profile page. | `/employer/profile` | The stored contact name, phone, department and description should appear. |  |  |
| 9.8 | Update the Employer contact name and phone. | Valid values | The updated contact information should be saved and remain after refresh. |  |  |
| 9.9 | Update the Employer department description. | Valid description | The description should be stored in the Employer profile. |  |  |
| 9.10 | Attempt to view another Employer's private profile-management page. | Modified Employer identifier or direct record request | The current session should remain limited to its own Employer profile. |  |  |
| 9.11 | Open Student-only navigation as an Employer. | `/student` or `/student/documents` | The Employer should be redirected to the Employer dashboard. |  |  |

These tests evaluate Employer-specific metrics, ownership-scoped recruitment data, live dashboard updates, department-profile maintenance and role navigation. They ensure that each Employer receives an accurate overview of only its own recruitment activity.

*Table 5.X: Employer Vacancy Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 10.1 | Open the Employer vacancy list. | `/employer/vacancies` | All vacancies owned by the current Employer should appear with their statuses and permitted actions. |  |  |
| 10.2 | Open the new-vacancy page. | Approved Employer | The vacancy form should display title, category, employment type, location, work arrangement, compensation, hours, deadline, openings, description, responsibilities, requirements and skills. |  |  |
| 10.3 | Save a minimal vacancy draft. | Title containing at least three characters | The vacancy should be stored with the `draft` status even when other submission fields are incomplete. |  |  |
| 10.4 | Save a draft with a title below the draft minimum. | Two-character title | The server should reject the draft. |  |  |
| 10.5 | Submit a vacancy with a title below the submission minimum. | Fewer than five characters | Submission for approval should be rejected. |  |  |
| 10.6 | Submit a vacancy with a required field missing. | Missing category, type, location, arrangement, compensation or hours | The vacancy should remain unsubmitted and an appropriate validation response should appear. |  |  |
| 10.7 | Submit a vacancy with an expired or current deadline. | Deadline that is not in the future | Submission should be rejected. |  |  |
| 10.8 | Submit a vacancy with openings below the boundary. | `0` openings | Submission should be rejected. |  |  |
| 10.9 | Submit a vacancy with openings above the boundary. | `101` openings | Submission should be rejected. |  |  |
| 10.10 | Submit a vacancy with an 80-character description. | Description at the minimum boundary | The description should be accepted when the remaining required information is valid. |  |  |
| 10.11 | Submit a vacancy with a description below 80 characters. | Seventy-nine-character description | Submission should be rejected. |  |  |
| 10.12 | Submit a vacancy without responsibilities or requirements. | Empty responsibility or requirement list | Submission should be rejected because at least one of each is required. |  |  |
| 10.13 | Submit a complete valid vacancy. | All required values valid | The vacancy status should become `pending_approval`, and it should appear in the Administrator approval queue. |  |  |
| 10.14 | Edit an owned draft vacancy. | Draft owned by the current Employer | The current values should load, and valid changes should be saved. |  |  |
| 10.15 | Edit an owned rejected vacancy. | Rejected vacancy | The Employer should be able to correct and resubmit the vacancy. |  |  |
| 10.16 | Attempt to edit another Employer's vacancy. | Vacancy owned by a different Employer | The record should not be disclosed or modified, and a not-found response should appear. |  |  |

The vacancy-management tests cover draft behaviour, mandatory submission fields, boundary values, deadlines, description length, ownership, rejection correction and the approval workflow. These checks ensure that Employers can preserve incomplete work while only complete and authorised vacancies reach Administrators.

*Table 5.X: Employer Applicant Review and Status Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 11.1 | Open the Employer application list. | Employer with applications to owned vacancies | Only applications submitted to the Employer's vacancies should appear. |  |  |
| 11.2 | Open an application belonging to an owned vacancy. | Valid related application identifier | Applicant profile, cover letter, skills, submitted document and status controls should appear. |  |  |
| 11.3 | Open an application belonging to another Employer. | Unrelated application identifier | The application and applicant information should not be disclosed. |  |  |
| 11.4 | Download the submitted CV of a related applicant. | Application to an owned vacancy | The authorised document download should succeed. |  |  |
| 11.5 | Download the CV of an unrelated applicant. | Application owned by another Employer | The download should be refused. |  |  |
| 11.6 | View a related applicant's optional profile picture. | Related application and stored picture | The protected picture should be displayed. |  |  |
| 11.7 | View an unrelated Student's profile picture. | Student with no application to the Employer | Access should be refused. |  |  |
| 11.8 | Change an application from Submitted to Under review. | Allowed transition | The status, immutable history and audit log should update. |  |  |
| 11.9 | Change an application from Under review to Shortlisted. | Allowed transition | The new status should be saved and reflected in Student and Employer views. |  |  |
| 11.10 | Change an application from Shortlisted to Interview. | Allowed transition | The application should advance to Interview. |  |  |
| 11.11 | Change an application from Interview to Offered. | Allowed transition | The application should advance to the final Offered status. |  |  |
| 11.12 | Reject an application from a permitted non-final state. | Submitted, Under review, Shortlisted or Interview | The application should move to the final Rejected status. |  |  |
| 11.13 | Attempt to skip an application stage. | Submitted directly to Offered | The server should reject the invalid transition. |  |  |
| 11.14 | Attempt to change a final application status. | Offered or Rejected application | No further transition should be accepted. |  |  |

These tests examine vacancy ownership, applicant privacy, protected document and picture access, controlled recruitment stages, invalid transition prevention and final states. They ensure that Employers can review only related applicants and cannot bypass the defined recruitment process.

*Table 5.X: Administrator Dashboard and Employer Approval Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 12.1 | Open the Administrator dashboard. | Active Administrator session | User, vacancy, application and pending-approval metrics should be displayed. |  |  |
| 12.2 | Open the dashboard with no pending approvals. | No pending Employer or vacancy records | Zero values and suitable empty states should appear. |  |  |
| 12.3 | Register a new Employer while the dashboard is open. | Valid Employer registration | The pending-Employer count and approval list should update through live data. |  |  |
| 12.4 | Open the pending-Employer list. | Employer profiles with `approved=false` | Each pending Employer should display the relevant identity and department information. |  |  |
| 12.5 | Approve a valid pending Employer. | Profile requesting the Employer role | The profile should become approved, the trusted Employer claim should be assigned and an audit event should be created. |  |  |
| 12.6 | Sign in using the Employer after approval. | Newly approved Employer credentials | The Employer should now be able to create a secure session and access the Employer dashboard. |  |  |
| 12.7 | Attempt to approve a profile that did not request the Employer role. | Student or Administrator profile | The approval action should be rejected. |  |  |
| 12.8 | Attempt to repeat Employer approval. | Already approved Employer | The action should not create inconsistent duplicate approval data. |  |  |
| 12.9 | Open the Administrator dashboard as a Student or Employer. | Non-Administrator session | Access should be denied through role redirection. |  |  |
| 12.10 | Refresh the dashboard after an approval decision. | Completed Employer or vacancy approval | The latest totals and pending-work values should be displayed. |  |  |

These tests cover live administrative metrics, pending Employer records, trusted claim assignment, repeated-action protection and Administrator-only access. Their purpose is to verify that Employer access remains unavailable until a valid administrative decision is completed.

*Table 5.X: Administrator Vacancy Approval Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 13.1 | Open the Administrator vacancy-oversight page. | `/admin/vacancies` | All vacancy records should appear with their current statuses and relevant pending actions. |  |  |
| 13.2 | Open the pending-vacancy approval list. | Vacancy with `pending_approval` status | The submitted vacancy and its Employer information should appear for review. |  |  |
| 13.3 | Approve a pending vacancy. | Valid pending vacancy | The status should become `published`, publication metadata should be recorded and an audit event should be created. |  |  |
| 13.4 | Browse public jobs after approval. | Newly approved vacancy | The vacancy should appear in public and Student vacancy discovery. |  |  |
| 13.5 | Reject a pending vacancy. | Valid pending vacancy and rejection decision | The status should become `rejected`, decision metadata should be recorded and the Employer should be able to edit it. |  |  |
| 13.6 | Resubmit a corrected rejected vacancy. | Valid changes by the owning Employer | The vacancy should return to `pending_approval`. |  |  |
| 13.7 | Attempt to approve a vacancy that is not pending. | Draft, rejected, published or closed vacancy | The server should reject the decision because the current state is invalid. |  |  |
| 13.8 | Attempt to reject a vacancy that is not pending. | Draft, rejected, published or closed vacancy | The server should reject the decision because the current state is invalid. |  |  |
| 13.9 | Close a published vacancy as its owning Employer. | Owned published vacancy | The status should become `closed`, closure metadata should be recorded and the vacancy should disappear from public discovery. |  |  |
| 13.10 | Attempt to close another Employer's published vacancy. | Unrelated Employer session | The closure action should be refused by the ownership check. |  |  |
| 13.11 | Refresh Student and Employer views after an Administrator decision. | Approved or rejected vacancy | All affected views should display the latest vacancy state. |  |  |
| 13.12 | Confirm that a closed vacancy is excluded from active metrics. | Recently closed vacancy | Public opportunities and Employer active-vacancy totals should no longer include the vacancy. |  |  |
| 13.13 | Review the audit log after vacancy approval, rejection or closure. | Completed vacancy action | The appropriate actor, action type, target and timestamp should be recorded. |  |  |

The vacancy-approval tests cover administrative review, publication, rejection, Employer correction, state validation, closure, live updates and auditability. They verify that only approved vacancies become publicly available and that every significant decision remains traceable.

*Table 5.X: Administrator User and Administrator-Account Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 14.1 | Open the Administrator user-management page. | `/admin/users` | User, Administrator and pending-Employer tabs should display the relevant accounts. |  |  |
| 14.2 | Deactivate an active Student account. | Active Student target | Firestore and Firebase Authentication should both mark the account inactive, refresh tokens should be revoked and an audit event should be created. |  |  |
| 14.3 | Attempt to sign in using the deactivated Student account. | Deactivated credentials | Session creation should be refused. |  |  |
| 14.4 | Reactivate a deactivated Student or Employer account. | Inactive non-Administrator target | Firestore and Firebase Authentication should restore the account to active status. |  |  |
| 14.5 | Attempt to deactivate the currently signed-in Administrator. | Current Administrator target | The action should be rejected to prevent self-deactivation. |  |  |
| 14.6 | Attempt to deactivate the final active Administrator. | Only active Administrator remaining | The transaction should be rejected so the system retains administrative access. |  |  |
| 14.7 | Manage another Administrator using an ordinary Administrator account. | `canManageAdmins=false` | Activation or deactivation of the Administrator target should be refused. |  |  |
| 14.8 | Manage another Administrator using the primary Administrator. | `canManageAdmins=true` | The authorised activation or deactivation should be completed and audited. |  |  |
| 14.9 | Open the create-Administrator dialog as an ordinary Administrator. | `canManageAdmins=false` | Administrator-creation controls should not be available. |  |  |
| 14.10 | Create an Administrator using the primary Administrator. | Valid name, unique email, department and strong temporary password | A Firebase user, trusted Administrator claim and active Firestore profile should be created with `mustChangePassword=true`. |  |  |
| 14.11 | Create an Administrator with mismatched temporary passwords. | Different password and confirmation | Creation should be prevented. |  |  |
| 14.12 | Create an Administrator with a weak temporary password. | Fewer than 12 characters or missing required character type | Creation should be rejected by the password policy. |  |  |
| 14.13 | Sign in as a newly created Administrator. | Valid temporary credentials | The user should be redirected to the account page and required to change the temporary password before protected actions. |  |  |
| 14.14 | Simulate a Firestore failure during Administrator creation. | Auth user created; profile write forced to fail | The newly created Firebase Authentication user should be deleted to avoid an incomplete privileged account. |  |  |

These tests evaluate account activation, Firebase and Firestore consistency, token revocation, self-protection, preservation of the final Administrator and primary-Administrator privileges. They also test secure Administrator creation and rollback to prevent incomplete or unauthorised privileged accounts.

*Table 5.X: Administrator Application Monitoring and Audit-Log Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 15.1 | Open the Administrator application-overview page. | `/admin/applications` | Applications across all Employers and Students should appear in a read-only overview. |  |  |
| 15.2 | Review an application record in the overview. | Valid application | Student, vacancy, Employer, submission date and current status information should be displayed. |  |  |
| 15.3 | Confirm the page does not expose unsupported Administrator decisions. | Current overview-only interface | No application-detail or decision workflow should be represented as available. |  |  |
| 15.4 | Open the Administrator audit-log page. | `/admin/audit-logs` | The latest recorded security and operational events should appear. |  |  |
| 15.5 | Verify the audit-log result limit. | More than 100 stored events | The page should display the latest 100 events in descending time order. |  |  |
| 15.6 | Review a sign-in and sign-out audit event. | Completed authentication actions | The action category, actor and timestamp should be displayed. |  |  |
| 15.7 | Review a profile or password-change event. | Completed profile or password update | The corresponding audit event should appear without exposing password values. |  |  |
| 15.8 | Review an Employer or vacancy approval event. | Completed administrative approval | The Administrator actor, target and decision should be identifiable. |  |  |
| 15.9 | Review an application submission or status event. | Completed Student submission or Employer decision | The relevant application action should appear in the audit trail. |  |  |
| 15.10 | Open the audit-log page as a Student or Employer. | Non-Administrator session | Access should be denied through role enforcement and Firestore rules. |  |  |

These tests examine cross-portal application oversight and the latest operational and security records. The scope remains consistent with the implemented website: Administrators can monitor applications but the current Administrator interface does not provide an application-detail decision workflow.

*Table 5.X: Role-Based Access, File Privacy and Security Rules Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 16.1 | Access a Student route using an Employer or Administrator account. | `/student/profile`, `/student/documents` or another Student route | The user should be redirected to the dashboard belonging to the authenticated role. |  |  |
| 16.2 | Access an Employer route using a Student or Administrator account. | `/employer/vacancies` or another Employer route | The user should be redirected safely and should not receive Employer data. |  |  |
| 16.3 | Access an Administrator route using a Student or Employer account. | `/admin/users` or another Administrator route | Access should be denied. |  |  |
| 16.4 | Read another Student's Firestore profile directly from the browser. | Modified client request | Firestore rules should deny the unauthorised read. |  |  |
| 16.5 | Modify protected role or approval fields in the current user's profile. | Client update containing `role`, `approved` or other protected access data | Firestore rules or server validation should refuse the change. |  |  |
| 16.6 | Read another Student's document metadata directly. | Non-owner Student session | Firestore rules should deny access. |  |  |
| 16.7 | Download another Student's private document without a related application. | Unrelated document identifier | The protected API should return an unauthorised or not-found response. |  |  |
| 16.8 | Download an applicant document as the related Employer. | Application belongs to an owned vacancy | The protected API should permit the download. |  |  |
| 16.9 | Download a Student document as an Administrator. | Valid Administrator session and document | The protected API should permit authorised administrative access. |  |  |
| 16.10 | Access a Cloud Storage object directly from the browser. | Direct Storage SDK or object request | Storage rules should deny direct client access. |  |  |
| 16.11 | Create or update another Employer's vacancy through a modified request. | Unrelated job identifier | Server ownership checks should reject the write. |  |  |
| 16.12 | Read another Employer's application through a client listener. | Application for an unrelated vacancy | Firestore rules should deny access. |  |  |
| 16.13 | Send a document PATCH or DELETE request without authentication. | `/api/documents/[id]` | The API should return HTTP 401 and should not modify data. |  |  |
| 16.14 | Use a revoked or expired session cookie on a protected page. | Invalid `apu_session` cookie | Session verification should fail and the user should be redirected to login. |  |  |

These tests cover page-level role enforcement, protected profile fields, record ownership, private documents, related-Employer access, Administrator access, direct Storage denial and session verification. Together, they provide evidence that authentication alone is insufficient and that every protected operation is checked against role and ownership requirements.

*Table 5.X: Profile, Password, Support and Shared Interface Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 17.1 | Open the account-settings page for each role. | Student, Employer and Administrator sessions | The current name, phone, read-only email and role information should be displayed. |  |  |
| 17.2 | Update valid account information. | Valid full name and phone | The changes should be stored, audited and reflected in the role layout. |  |  |
| 17.3 | Attempt to modify the read-only login email or role. | Manipulated form request | The protected fields should remain unchanged. |  |  |
| 17.4 | Change the password using an incorrect current password. | Incorrect existing password | Re-authentication should fail and the password should remain unchanged. |  |  |
| 17.5 | Change the password using fewer than 12 characters. | Short new password | The password change should be rejected. |  |  |
| 17.6 | Change the password without an uppercase, lowercase, number or symbol. | New password missing a required character type | The password change should be rejected by the mixed-character policy. |  |  |
| 17.7 | Change the password using valid values. | Correct current password and valid 12–128 character new password | Firebase Authentication should update the password, clear any temporary-password requirement and create an audit event. |  |  |
| 17.8 | Open the role-specific support page. | Student, Employer or Administrator support route | Appropriate guidance and safe-email reminders should appear. |  |  |
| 17.9 | Select the support email action. | Gmail support link | Gmail should open with the configured support address. |  |  |
| 17.10 | Navigate through the shared dashboard sidebar. | All visible links for each role | Every implemented navigation item should open the correct authorised page. |  |  |
| 17.11 | Operate dropdowns, dialogs, tabs and form controls using a keyboard. | Keyboard-only interaction | Focus should remain visible and each control should be operable without a mouse. |  |  |
| 17.12 | Trigger loading, success, warning and error states. | Slow, successful and failed operations | The appropriate feedback should be communicated, and duplicate submission should be disabled while processing. |  |  |
| 17.13 | Run project linting and the production build. | `npm run lint` and `npm run build` | Linting, TypeScript checking and production compilation should complete without errors. |  |  |

These tests cover shared account controls, password security, support access, role navigation, keyboard operation, system feedback and technical build verification. They complete the unit-testing plan by checking the common functions used throughout the Student, Employer and Administrator interfaces.
