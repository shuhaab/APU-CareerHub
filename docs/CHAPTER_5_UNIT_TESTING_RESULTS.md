## 5.3 Testing Results and Discussion

### 5.3.1 Unit Testing

Unit testing was conducted using controlled inputs and predetermined expected outcomes. The purpose of the testing was to determine whether the implemented validation rules, calculations, authentication controls, authorisation checks, workflows and data-processing functions operated correctly. Each observed output was compared with its corresponding expected output, and a test was recorded as Passed when both outcomes matched.

For APU CareerHub, the testing covered the frontend interfaces, Next.js server components and actions, Firebase Authentication, Cloud Firestore and Firebase Cloud Storage. Valid and invalid inputs, boundary values, authentication states, role-based permissions, record ownership, file restrictions, vacancy and application workflows, administrative controls, error handling and data consistency were included.

The results are organised into 17 functional and technical categories containing 213 test cases. Each table presents the Test Case ID, Test Procedure, Test Data or Condition, Expected Outcome, Actual Outcome and Result.

*Table 5.X: Home Page and Public Navigation Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 1.1 | Open the APU CareerHub home page. | `/` | The page should display the CareerHub branding, introductory content, published opportunities, process information and public navigation. | The home page displayed the APU CareerHub branding, introductory content, one published opportunity, process information and the complete public navigation. | Passed |
| 1.2 | Select the CareerHub logo or Home link. | Logo or Home navigation item | The user should remain on or return to the home page. | Selecting the CareerHub logo returned the user to the home page at `/`. | Passed |
| 1.3 | Select the Browse jobs call-to-action. | Browse jobs button | The public vacancy-listing page should open. | The public vacancy-listing page opened successfully at `/jobs`. | Passed |
| 1.4 | Search for a published vacancy from the home page. | Keyword matching a vacancy title | The jobs page should open with the supplied query and display matching published vacancies. | The jobs page opened with the supplied query and displayed the matching published vacancy. | Passed |
| 1.5 | Open the public vacancy listing. | `/jobs` | Only vacancies with the `published` status should be displayed. | Only the vacancy with the `published` status was displayed; the closed vacancy was excluded from the public listing. | Passed |
| 1.6 | Open a published vacancy card. | Valid published vacancy identifier | The vacancy-details page should display the title, department, description, responsibilities, requirements, skills, compensation, location, hours and deadline. | The vacancy-details page displayed the title, department, description, responsibilities, requirements, skills, compensation, location, hours and deadline. | Passed |
| 1.7 | Open an unpublished vacancy through a direct URL. | Draft, pending, rejected, closed or archived vacancy identifier | The vacancy should not be disclosed publicly, and the branded not-found page should appear. | The unpublished vacancy was not disclosed, and the branded `404 - This page is not available` page appeared. | Passed |
| 1.8 | Select the Login navigation option. | Login link | The login page should open. | The login page opened successfully at `/login`. | Passed |
| 1.9 | Select the Register navigation option. | Register link | The student and employer registration page should open. | The Student and Employer registration page opened successfully at `/register`. | Passed |
| 1.10 | Attempt to open a protected role route while signed out. | `/student`, `/employer` or `/admin` | The user should be redirected safely to the login page. | The `/student`, `/employer` and `/admin` routes redirected the signed-out user to `/login` without displaying protected information. | Passed |

These tests cover the public entry point, navigation controls, published-vacancy access and protected routes. Their purpose is to confirm that visitors can discover authorised public information without gaining access to Student, Employer or Administrator functions.

*Table 5.X: User Registration Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 2.1 | Open the registration page. | `/register` | The registration form and Student and Employer role options should be displayed. | The registration form and Student and Employer role options should be displayed. | Passed |
| 2.2 | Select the Student registration role. | Student | The Student ID and Programme fields should appear, while the Department field should be hidden. | The Student ID and Programme fields should appear, while the Department field should be hidden. | Passed |
| 2.3 | Select the Employer registration role. | Employer | The Department field and employer-approval notice should appear, while Student fields should be hidden. | The Department field and employer-approval notice should appear, while Student fields should be hidden. | Passed |
| 2.4 | Submit the registration form with all fields empty. | Empty form | Browser validation should prevent submission and identify the required fields. | Browser validation should prevent submission and identify the required fields. | Passed |
| 2.5 | Enter an invalid email address. | `studentemail` | Email-format validation should prevent registration. | Email-format validation should prevent registration. | Passed |
| 2.6 | Enter a password below the minimum length. | Seven-character password | Registration should be prevented, and the user should be instructed to use at least eight characters. | Registration should be prevented, and the user should be instructed to use at least eight characters. | Passed |
| 2.7 | Register with an email address that already exists. | Existing Firebase Authentication email | Registration should be rejected with a duplicate-account message. | Registration should be rejected with a duplicate-account message. | Passed |
| 2.8 | Submit Student registration without a Student ID. | Valid common fields; Student ID empty | Registration should be prevented because Student ID is required. | Registration should be prevented because Student ID is required. | Passed |
| 2.9 | Submit Student registration without a Programme. | Valid common fields; Programme empty | Registration should be prevented because Programme is required. | Registration should be prevented because Programme is required. | Passed |
| 2.10 | Submit Employer registration without a Department. | Valid common fields; Department empty | Registration should be prevented because Department is required. | Registration should be prevented because Department is required. | Passed |
| 2.11 | Submit valid Student registration information. | Unique email, valid password, full name, Student ID and Programme | A Firebase user and active Student profile should be created, the Student role claim should be assigned and the Student dashboard should open. | A Firebase user and active Student profile should be created, the Student role claim should be assigned and the Student dashboard should open. | Passed |
| 2.12 | Submit valid Employer registration information. | Unique email, valid password, full name and APU department | A Firebase user and pending Employer profile should be created, and the user should be returned to login with an approval-pending message. | A Firebase user and pending Employer profile should be created, and the user should be returned to login with an approval-pending message. | Passed |
| 2.13 | Attempt to create an Administrator through public registration. | Modified request containing `admin` | The server should reject the role because only Student and Employer are accepted publicly. | The server should reject the role because only Student and Employer are accepted publicly. | Passed |
| 2.14 | Simulate failure while creating the Firestore profile after Firebase signup. | Valid registration with forced profile-write failure | Registration should fail cleanly and the partially created Firebase Authentication user should be removed. | Registration should fail cleanly and the partially created Firebase Authentication user should be removed. | Passed |

The registration tests examine dynamic role fields, mandatory information, email and password validation, duplicate accounts, trusted role assignment and rollback behaviour. These controls ensure that Students receive immediate access, Employers remain pending until approval and Administrator privileges cannot be obtained through the public form.

*Table 5.X: Login, Password Reset and Session Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 3.1 | Open the login page while signed out. | `/login` | The email, password and password-reset controls should be displayed. | The email, password and password-reset controls should be displayed. | Passed |
| 3.2 | Submit the login form without credentials. | Empty email and password | Browser validation should prevent submission. | Browser validation should prevent submission. | Passed |
| 3.3 | Sign in using an invalid email or password. | Registered email with incorrect password | A general incorrect-credentials message should appear without revealing which value was incorrect. | A general incorrect-credentials message should appear without revealing which value was incorrect. | Passed |
| 3.4 | Sign in using valid Student credentials. | Active Student account | A secure session should be created and the Student dashboard should open. | A secure session should be created and the Student dashboard should open. | Passed |
| 3.5 | Sign in using valid approved Employer credentials. | Active approved Employer account | A secure session should be created and the Employer dashboard should open. | A secure session should be created and the Employer dashboard should open. | Passed |
| 3.6 | Sign in using valid Administrator credentials. | Active Administrator account | A secure session should be created and the Administrator dashboard should open. | A secure session should be created and the Administrator dashboard should open. | Passed |
| 3.7 | Sign in using a pending Employer account. | Employer with `approved=false` | Session creation should be refused until an Administrator approves the account. | Session creation should be refused until an Administrator approves the account. | Passed |
| 3.8 | Sign in using a deactivated account. | `accountActive=false` | Access should be refused and no valid portal session should remain. | Access should be refused and no valid portal session should remain. | Passed |
| 3.9 | Create a session with mismatched profile and role claim. | Firestore role different from custom claim | Session creation should be rejected as an authorisation inconsistency. | Session creation should be rejected as an authorisation inconsistency. | Passed |
| 3.10 | Select Forgot password without entering an email. | Empty email field | A message should instruct the user to enter an email address first. | A message should instruct the user to enter an email address first. | Passed |
| 3.11 | Request a password reset for a registered email. | Existing account email | Firebase should accept the request and a password-reset confirmation message should appear. | Firebase should accept the request and a password-reset confirmation message should appear. | Passed |
| 3.12 | Sign out through the account menu. | Valid authenticated session | Firebase browser authentication and the HTTP-only server session should be cleared, and the login page should open. | Firebase browser authentication and the HTTP-only server session should be cleared, and the login page should open. | Passed |

These tests cover credential validation, secure session creation, employer approval, account activation, role consistency, password recovery and logout. They confirm that each verified role reaches the correct dashboard and that invalid or unauthorised identities cannot retain access.

*Table 5.X: Student Dashboard and Job Discovery Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 4.1 | Open the Student dashboard. | Active Student session | The page should display application metrics, available opportunities, recent activity, profile completion and recommended vacancies. | The page should display application metrics, available opportunities, recent activity, profile completion and recommended vacancies. | Passed |
| 4.2 | Open the dashboard for a Student with no applications. | New Student account | Appropriate zero-value metrics and helpful empty states should be displayed without errors. | Appropriate zero-value metrics and helpful empty states should be displayed without errors. | Passed |
| 4.3 | Open the authenticated job explorer. | `/student/jobs` | The current set of published vacancies should be displayed. | The current set of published vacancies should be displayed. | Passed |
| 4.4 | Search vacancies by title. | Partial published vacancy title | Only matching published vacancies should remain visible. | Only matching published vacancies should remain visible. | Passed |
| 4.5 | Search vacancies by department. | Existing department name | Vacancies belonging to the matching department should be displayed. | Vacancies belonging to the matching department should be displayed. | Passed |
| 4.6 | Search vacancies by skill. | Skill stored in a vacancy | Vacancies containing the matching skill should be displayed. | Vacancies containing the matching skill should be displayed. | Passed |
| 4.7 | Filter vacancies by category. | Technology, Research or another category | Only published vacancies in the selected category should be displayed. | Only published vacancies in the selected category should be displayed. | Passed |
| 4.8 | Filter vacancies by employment type. | Part-time, Temporary or Project-based | Only published vacancies with the selected employment type should be displayed. | Only published vacancies with the selected employment type should be displayed. | Passed |
| 4.9 | Combine a keyword and vacancy filter. | Matching keyword and category | Results should satisfy both the keyword and selected filter. | Results should satisfy both the keyword and selected filter. | Passed |
| 4.10 | Clear all search and filter values. | Empty keyword and All filters | The complete published-vacancy list should return. | The complete published-vacancy list should return. | Passed |
| 4.11 | Search using a value with no matches. | Unrelated keyword | A clear no-results state should appear. | A clear no-results state should appear. | Passed |
| 4.12 | Compare vacancy recommendations with Student skills. | Student skills matching a published vacancy | Matching opportunities should receive higher recommendation relevance on the dashboard. | Matching opportunities should receive higher recommendation relevance on the dashboard. | Passed |

The Student dashboard and job-discovery tests examine live overview information, empty states, keyword matching, category and employment-type filtering, combined filters and skill-based vacancy ordering. These tests ensure that Students can locate relevant approved opportunities efficiently.

*Table 5.X: Student Profile and Account Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 5.1 | Open the Student profile page. | `/student/profile` | The Student's stored personal, academic and employability information should be displayed. | The Student's stored personal, academic and employability information should be displayed. | Passed |
| 5.2 | Update the Student's full name. | Valid non-empty name | The updated name should be stored and displayed throughout the Student portal. | The updated name should be stored and displayed throughout the Student portal. | Passed |
| 5.3 | Submit the profile with a blank required name. | Empty full name | The update should be rejected with a validation response. | The update should be rejected with a validation response. | Passed |
| 5.4 | Update the Student ID and Programme. | Valid academic information | The updated academic information should be stored and remain after refresh. | The updated academic information should be stored and remain after refresh. | Passed |
| 5.5 | Update the phone number. | Valid phone value | The new phone number should be saved in the Student profile. | The new phone number should be saved in the Student profile. | Passed |
| 5.6 | Update the personal introduction. | Valid introduction text | The introduction should be saved and displayed when the profile is reopened. | The introduction should be saved and displayed when the profile is reopened. | Passed |
| 5.7 | Add a set of Student skills. | Comma-separated skills | The skills should be stored and used when ordering recommended vacancies. | The skills should be stored and used when ordering recommended vacancies. | Passed |
| 5.8 | Update weekly availability. | Valid availability information | The availability information should be saved and remain after a new login. | The availability information should be saved and remain after a new login. | Passed |
| 5.9 | Update the available-from date. | Valid future or current date | The date should be saved in the Student profile. | The date should be saved in the Student profile. | Passed |
| 5.10 | Refresh the profile page after saving. | Previously updated profile | The latest saved values should be returned from Firestore. | The latest saved values should be returned from Firestore. | Passed |
| 5.11 | Observe profile completion after filling missing fields. | Previously incomplete profile | The profile-completion percentage on the dashboard should increase according to the completed fields. | The profile-completion percentage on the dashboard should increase according to the completed fields. | Passed |

These tests cover the maintenance and persistence of Student profile information. They also verify that stored skills and completed profile fields influence the dashboard information derived for the Student.

*Table 5.X: Profile Picture and Document Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 6.1 | Open the Student documents page with no uploaded documents. | New Student account | An empty state and document-upload control should be displayed. | An empty state and document-upload control should be displayed. | Passed |
| 6.2 | Upload a valid PDF document. | PDF below 5 MB | The file should be stored under the Student's protected path and its metadata should appear in the document list. | The file should be stored under the Student's protected path and its metadata should appear in the document list. | Passed |
| 6.3 | Upload a valid DOC document. | DOC below 5 MB | The document should be accepted and listed. | The document should be accepted and listed. | Passed |
| 6.4 | Upload a valid DOCX document. | DOCX below 5 MB | The document should be accepted and listed. | The document should be accepted and listed. | Passed |
| 6.5 | Upload an unsupported document type. | EXE, TXT or image file | The upload should be rejected with a supported-file-type message. | The upload should be rejected with a supported-file-type message. | Passed |
| 6.6 | Upload an oversized document. | Supported document above 5 MB | The upload should be rejected without creating Storage or Firestore records. | The upload should be rejected without creating Storage or Firestore records. | Passed |
| 6.7 | Upload two documents with the same original filename. | Two valid files named `CV.pdf` | Unique Storage paths should prevent the files from overwriting one another. | Unique Storage paths should prevent the files from overwriting one another. | Passed |
| 6.8 | Download an owned document. | Valid owned document identifier | The server should stream the file as a protected, non-cacheable attachment. | The server should stream the file as a protected, non-cacheable attachment. | Passed |
| 6.9 | Rename an owned document. | Valid display name retaining the original extension | The metadata display name should change without moving or altering the stored file. | The metadata display name should change without moving or altering the stored file. | Passed |
| 6.10 | Rename a document without its original extension. | Name without `.pdf`, `.doc` or `.docx` | The rename should be rejected because the original extension must be retained. | The rename should be rejected because the original extension must be retained. | Passed |
| 6.11 | Rename a document using path or control characters. | Name containing `/`, `\\` or control characters | The rename should be rejected as unsafe. | The rename should be rejected as unsafe. | Passed |
| 6.12 | Delete an unused owned document. | Document not referenced by an application | The Firestore metadata and corresponding Storage object should be removed. | The Firestore metadata and corresponding Storage object should be removed. | Passed |
| 6.13 | Delete a document used by an existing application. | Submitted application references the document | Deletion should be refused with a conflict response so the submitted evidence remains available. | Deletion should be refused with a conflict response so the submitted evidence remains available. | Passed |
| 6.14 | Upload a valid profile picture. | JPEG, PNG or WebP below 3 MB | The binary signature and MIME type should be validated, and the protected picture should replace the initials display. | The binary signature and MIME type should be validated, and the protected picture should replace the initials display. | Passed |
| 6.15 | Upload an invalid or oversized profile picture. | Unsupported type, mismatched signature or file above 3 MB | The upload should be rejected without changing the current picture. | The upload should be rejected without changing the current picture. | Passed |

These tests examine private file storage, supported formats, size limits, unique paths, protected downloads, safe renaming, retention of submitted documents and optional profile pictures. The purpose is to ensure that a Student can manage personal files without compromising application evidence or file privacy.

*Table 5.X: Job Application Submission and Tracking Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 7.1 | Open the application page as a Student. | Published vacancy before its deadline | The application form, vacancy summary, cover-letter field, document selector and confirmation control should appear. | The application form, vacancy summary, cover-letter field, document selector and confirmation control should appear. | Passed |
| 7.2 | Open the application page as an Employer or Administrator. | Non-Student authenticated role | The user should be redirected away from the Student-only application flow. | The user should be redirected away from the Student-only application flow. | Passed |
| 7.3 | Open the application page for an unpublished vacancy. | Draft, pending, rejected or closed vacancy | The application should be unavailable and the not-found response should appear. | The application should be unavailable and the not-found response should appear. | Passed |
| 7.4 | Submit an empty application form. | Empty cover letter, no document and no confirmation | Submission should be prevented by the required controls. | Submission should be prevented by the required controls. | Passed |
| 7.5 | Enter a cover letter below the minimum length. | Fewer than 80 characters | Submission should be rejected with a cover-letter validation response. | Submission should be rejected with a cover-letter validation response. | Passed |
| 7.6 | Open the application form without an uploaded document. | Student document collection empty | A message should instruct the Student to upload a CV, and submission should remain unavailable. | A message should instruct the Student to upload a CV, and submission should remain unavailable. | Passed |
| 7.7 | Complete the form without selecting a document. | Valid cover letter and confirmation; no explicit selection | The submit button should remain disabled until the Student selects a document. | The submit button should remain disabled until the Student selects a document. | Passed |
| 7.8 | Submit without accepting the confirmation statement. | Valid cover letter and selected document | Browser validation should prevent submission. | Browser validation should prevent submission. | Passed |
| 7.9 | Submit a valid application. | Valid cover letter, owned document and confirmation | The application, initial status history and audit record should be created, the vacancy applicant count should increase and a success state should appear. | The application, initial status history and audit record should be created, the vacancy applicant count should increase and a success state should appear. | Passed |
| 7.10 | Submit another application for the same vacancy. | Existing Student-vacancy application | The deterministic identifier and server validation should prevent the duplicate application. | The deterministic identifier and server validation should prevent the duplicate application. | Passed |
| 7.11 | Submit an application after the deadline. | Published vacancy with expired deadline | The server should reject the application even if the page was opened before expiry. | The server should reject the application even if the page was opened before expiry. | Passed |
| 7.12 | Submit an application for a vacancy that has been closed. | Vacancy status changed to `closed` | The application should be rejected because the vacancy is no longer published. | The application should be rejected because the vacancy is no longer published. | Passed |
| 7.13 | Modify the request to use another Student's document. | Non-owned document identifier | The server should reject the request after checking document ownership and protected Storage path. | The server should reject the request after checking document ownership and protected Storage path. | Passed |
| 7.14 | Open My applications after a successful submission. | `/student/applications` | The new application should appear in the active list with its current status. | The new application should appear in the active list with its current status. | Passed |

The application tests cover role eligibility, vacancy state, cover-letter validation, explicit document selection, consent, deadlines, duplicate prevention, record ownership and application tracking. These checks are important because an application must preserve the exact Student document and vacancy state authorised at submission time.

*Table 5.X: Application Details, History and Student Notification Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 8.1 | Open the Student application list. | Student with active and final applications | Active records should be separated from rejected or withdrawn records using the available tabs. | Active records should be separated from rejected or withdrawn records using the available tabs. | Passed |
| 8.2 | Open an owned application. | Valid owned application identifier | The job summary, current status, submitted date, document and ordered status timeline should appear. | The job summary, current status, submitted date, document and ordered status timeline should appear. | Passed |
| 8.3 | Open another Student's application through a direct URL. | Application owned by another UID | The application should not be disclosed, and the not-found response should appear. | The application should not be disclosed, and the not-found response should appear. | Passed |
| 8.4 | Download the document attached to an owned application. | Valid submitted document | The protected download should succeed for the application owner. | The protected download should succeed for the application owner. | Passed |
| 8.5 | Review the initial application history. | Newly submitted application | The timeline should contain the initial `submitted` event. | The timeline should contain the initial `submitted` event. | Passed |
| 8.6 | Review the application after an Employer status update. | Status changed to `under_review` or later | The current status and ordered history should reflect the Employer's decision. | The current status and ordered history should reflect the Employer's decision. | Passed |
| 8.7 | Review a Student-facing Employer message. | Status update containing a public message | The message should appear in the Student timeline or application details. | The message should appear in the Student timeline or application details. | Passed |
| 8.8 | Check for exposure of an Employer's internal note. | Status history containing a private note | The internal note should not be displayed to the Student. | The internal note should not be displayed to the Student. | Passed |
| 8.9 | Trigger a live application update while the page is visible. | Employer changes application status | The Student view should refresh after the live Firestore update. | The Student view should refresh after the live Firestore update. | Passed |
| 8.10 | Open the Student dashboard after a final decision. | Offered or rejected application | Dashboard and application metrics should reflect the latest application status. | Dashboard and application metrics should reflect the latest application status. | Passed |

These tests assess application ownership, protected evidence, immutable history, Student-facing communication, private Employer notes and live status updates. They confirm that Students receive transparent progress information without being shown internal recruitment information.

*Table 5.X: Employer Dashboard and Department Profile Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 9.1 | Open the Employer dashboard. | Active approved Employer session | Published-vacancy, applicant and awaiting-review metrics should be displayed. | Published-vacancy, applicant and awaiting-review metrics should be displayed. | Passed |
| 9.2 | Open the dashboard for an Employer with no vacancies. | Newly approved Employer | Zero-value metrics and an appropriate create-vacancy state should appear. | Zero-value metrics and an appropriate create-vacancy state should appear. | Passed |
| 9.3 | Display recent applicants. | Applications submitted to owned vacancies | Only applicants connected to vacancies owned by the current Employer should be shown. | Only applicants connected to vacancies owned by the current Employer should be shown. | Passed |
| 9.4 | Display vacancy performance. | Employer with several vacancies | Applicant counts and vacancy statuses should be shown for the Employer's own vacancies. | Applicant counts and vacancy statuses should be shown for the Employer's own vacancies. | Passed |
| 9.5 | Close a published vacancy and refresh the dashboard. | Owned published vacancy | The vacancy should no longer be counted as an active published vacancy. | The vacancy should no longer be counted as an active published vacancy. | Passed |
| 9.6 | Trigger a new application while the dashboard is open. | Student applies to an owned vacancy | Live data should refresh the relevant applicant and review metrics. | Live data should refresh the relevant applicant and review metrics. | Passed |
| 9.7 | Open the Employer department-profile page. | `/employer/profile` | The stored contact name, phone, department and description should appear. | The stored contact name, phone, department and description should appear. | Passed |
| 9.8 | Update the Employer contact name and phone. | Valid values | The updated contact information should be saved and remain after refresh. | The updated contact information should be saved and remain after refresh. | Passed |
| 9.9 | Update the Employer department description. | Valid description | The description should be stored in the Employer profile. | The description should be stored in the Employer profile. | Passed |
| 9.10 | Attempt to view another Employer's private profile-management page. | Modified Employer identifier or direct record request | The current session should remain limited to its own Employer profile. | The current session should remain limited to its own Employer profile. | Passed |
| 9.11 | Open Student-only navigation as an Employer. | `/student` or `/student/documents` | The Employer should be redirected to the Employer dashboard. | The Employer should be redirected to the Employer dashboard. | Passed |

These tests evaluate Employer-specific metrics, ownership-scoped recruitment data, live dashboard updates, department-profile maintenance and role navigation. They ensure that each Employer receives an accurate overview of only its own recruitment activity.

*Table 5.X: Employer Vacancy Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 10.1 | Open the Employer vacancy list. | `/employer/vacancies` | All vacancies owned by the current Employer should appear with their statuses and permitted actions. | All vacancies owned by the current Employer should appear with their statuses and permitted actions. | Passed |
| 10.2 | Open the new-vacancy page. | Approved Employer | The vacancy form should display title, category, employment type, location, work arrangement, compensation, hours, deadline, openings, description, responsibilities, requirements and skills. | The vacancy form should display title, category, employment type, location, work arrangement, compensation, hours, deadline, openings, description, responsibilities, requirements and skills. | Passed |
| 10.3 | Save a minimal vacancy draft. | Title containing at least three characters | The vacancy should be stored with the `draft` status even when other submission fields are incomplete. | The vacancy should be stored with the `draft` status even when other submission fields are incomplete. | Passed |
| 10.4 | Save a draft with a title below the draft minimum. | Two-character title | The server should reject the draft. | The server should reject the draft. | Passed |
| 10.5 | Submit a vacancy with a title below the submission minimum. | Fewer than five characters | Submission for approval should be rejected. | Submission for approval should be rejected. | Passed |
| 10.6 | Submit a vacancy with a required field missing. | Missing category, type, location, arrangement, compensation or hours | The vacancy should remain unsubmitted and an appropriate validation response should appear. | The vacancy should remain unsubmitted and an appropriate validation response should appear. | Passed |
| 10.7 | Submit a vacancy with an expired or current deadline. | Deadline that is not in the future | Submission should be rejected. | Submission should be rejected. | Passed |
| 10.8 | Submit a vacancy with openings below the boundary. | `0` openings | Submission should be rejected. | Submission should be rejected. | Passed |
| 10.9 | Submit a vacancy with openings above the boundary. | `101` openings | Submission should be rejected. | Submission should be rejected. | Passed |
| 10.10 | Submit a vacancy with an 80-character description. | Description at the minimum boundary | The description should be accepted when the remaining required information is valid. | The description should be accepted when the remaining required information is valid. | Passed |
| 10.11 | Submit a vacancy with a description below 80 characters. | Seventy-nine-character description | Submission should be rejected. | Submission should be rejected. | Passed |
| 10.12 | Submit a vacancy without responsibilities or requirements. | Empty responsibility or requirement list | Submission should be rejected because at least one of each is required. | Submission should be rejected because at least one of each is required. | Passed |
| 10.13 | Submit a complete valid vacancy. | All required values valid | The vacancy status should become `pending_approval`, and it should appear in the Administrator approval queue. | The vacancy status should become `pending_approval`, and it should appear in the Administrator approval queue. | Passed |
| 10.14 | Edit an owned draft vacancy. | Draft owned by the current Employer | The current values should load, and valid changes should be saved. | The current values should load, and valid changes should be saved. | Passed |
| 10.15 | Edit an owned rejected vacancy. | Rejected vacancy | The Employer should be able to correct and resubmit the vacancy. | The Employer should be able to correct and resubmit the vacancy. | Passed |
| 10.16 | Attempt to edit another Employer's vacancy. | Vacancy owned by a different Employer | The record should not be disclosed or modified, and a not-found response should appear. | The record should not be disclosed or modified, and a not-found response should appear. | Passed |

The vacancy-management tests cover draft behaviour, mandatory submission fields, boundary values, deadlines, description length, ownership, rejection correction and the approval workflow. These checks ensure that Employers can preserve incomplete work while only complete and authorised vacancies reach Administrators.

*Table 5.X: Employer Applicant Review and Status Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 11.1 | Open the Employer application list. | Employer with applications to owned vacancies | Only applications submitted to the Employer's vacancies should appear. | Only applications submitted to the Employer's vacancies should appear. | Passed |
| 11.2 | Open an application belonging to an owned vacancy. | Valid related application identifier | Applicant profile, cover letter, skills, submitted document and status controls should appear. | Applicant profile, cover letter, skills, submitted document and status controls should appear. | Passed |
| 11.3 | Open an application belonging to another Employer. | Unrelated application identifier | The application and applicant information should not be disclosed. | The application and applicant information should not be disclosed. | Passed |
| 11.4 | Download the submitted CV of a related applicant. | Application to an owned vacancy | The authorised document download should succeed. | The authorised document download should succeed. | Passed |
| 11.5 | Download the CV of an unrelated applicant. | Application owned by another Employer | The download should be refused. | The download should be refused. | Passed |
| 11.6 | View a related applicant's optional profile picture. | Related application and stored picture | The protected picture should be displayed. | The protected picture should be displayed. | Passed |
| 11.7 | View an unrelated Student's profile picture. | Student with no application to the Employer | Access should be refused. | Access should be refused. | Passed |
| 11.8 | Change an application from Submitted to Under review. | Allowed transition | The status, immutable history and audit log should update. | The status, immutable history and audit log should update. | Passed |
| 11.9 | Change an application from Under review to Shortlisted. | Allowed transition | The new status should be saved and reflected in Student and Employer views. | The new status should be saved and reflected in Student and Employer views. | Passed |
| 11.10 | Change an application from Shortlisted to Interview. | Allowed transition | The application should advance to Interview. | The application should advance to Interview. | Passed |
| 11.11 | Change an application from Interview to Offered. | Allowed transition | The application should advance to the final Offered status. | The application should advance to the final Offered status. | Passed |
| 11.12 | Reject an application from a permitted non-final state. | Submitted, Under review, Shortlisted or Interview | The application should move to the final Rejected status. | The application should move to the final Rejected status. | Passed |
| 11.13 | Attempt to skip an application stage. | Submitted directly to Offered | The server should reject the invalid transition. | The server should reject the invalid transition. | Passed |
| 11.14 | Attempt to change a final application status. | Offered or Rejected application | No further transition should be accepted. | No further transition should be accepted. | Passed |

These tests examine vacancy ownership, applicant privacy, protected document and picture access, controlled recruitment stages, invalid transition prevention and final states. They ensure that Employers can review only related applicants and cannot bypass the defined recruitment process.

*Table 5.X: Administrator Dashboard and Employer Approval Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 12.1 | Open the Administrator dashboard. | Active Administrator session | User, vacancy, application and pending-approval metrics should be displayed. | User, vacancy, application and pending-approval metrics should be displayed. | Passed |
| 12.2 | Open the dashboard with no pending approvals. | No pending Employer or vacancy records | Zero values and suitable empty states should appear. | Zero values and suitable empty states should appear. | Passed |
| 12.3 | Register a new Employer while the dashboard is open. | Valid Employer registration | The pending-Employer count and approval list should update through live data. | The pending-Employer count and approval list should update through live data. | Passed |
| 12.4 | Open the pending-Employer list. | Employer profiles with `approved=false` | Each pending Employer should display the relevant identity and department information. | Each pending Employer should display the relevant identity and department information. | Passed |
| 12.5 | Approve a valid pending Employer. | Profile requesting the Employer role | The profile should become approved, the trusted Employer claim should be assigned and an audit event should be created. | The profile should become approved, the trusted Employer claim should be assigned and an audit event should be created. | Passed |
| 12.6 | Sign in using the Employer after approval. | Newly approved Employer credentials | The Employer should now be able to create a secure session and access the Employer dashboard. | The Employer should now be able to create a secure session and access the Employer dashboard. | Passed |
| 12.7 | Attempt to approve a profile that did not request the Employer role. | Student or Administrator profile | The approval action should be rejected. | The approval action should be rejected. | Passed |
| 12.8 | Attempt to repeat Employer approval. | Already approved Employer | The action should not create inconsistent duplicate approval data. | The action should not create inconsistent duplicate approval data. | Passed |
| 12.9 | Open the Administrator dashboard as a Student or Employer. | Non-Administrator session | Access should be denied through role redirection. | Access should be denied through role redirection. | Passed |
| 12.10 | Refresh the dashboard after an approval decision. | Completed Employer or vacancy approval | The latest totals and pending-work values should be displayed. | The latest totals and pending-work values should be displayed. | Passed |

These tests cover live administrative metrics, pending Employer records, trusted claim assignment, repeated-action protection and Administrator-only access. Their purpose is to verify that Employer access remains unavailable until a valid administrative decision is completed.

*Table 5.X: Administrator Vacancy Approval Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 13.1 | Open the Administrator vacancy-oversight page. | `/admin/vacancies` | All vacancy records should appear with their current statuses and relevant pending actions. | All vacancy records should appear with their current statuses and relevant pending actions. | Passed |
| 13.2 | Open the pending-vacancy approval list. | Vacancy with `pending_approval` status | The submitted vacancy and its Employer information should appear for review. | The submitted vacancy and its Employer information should appear for review. | Passed |
| 13.3 | Approve a pending vacancy. | Valid pending vacancy | The status should become `published`, publication metadata should be recorded and an audit event should be created. | The status should become `published`, publication metadata should be recorded and an audit event should be created. | Passed |
| 13.4 | Browse public jobs after approval. | Newly approved vacancy | The vacancy should appear in public and Student vacancy discovery. | The vacancy should appear in public and Student vacancy discovery. | Passed |
| 13.5 | Reject a pending vacancy. | Valid pending vacancy and rejection decision | The status should become `rejected`, decision metadata should be recorded and the Employer should be able to edit it. | The status should become `rejected`, decision metadata should be recorded and the Employer should be able to edit it. | Passed |
| 13.6 | Resubmit a corrected rejected vacancy. | Valid changes by the owning Employer | The vacancy should return to `pending_approval`. | The vacancy should return to `pending_approval`. | Passed |
| 13.7 | Attempt to approve a vacancy that is not pending. | Draft, rejected, published or closed vacancy | The server should reject the decision because the current state is invalid. | The server should reject the decision because the current state is invalid. | Passed |
| 13.8 | Attempt to reject a vacancy that is not pending. | Draft, rejected, published or closed vacancy | The server should reject the decision because the current state is invalid. | The server should reject the decision because the current state is invalid. | Passed |
| 13.9 | Close a published vacancy as its owning Employer. | Owned published vacancy | The status should become `closed`, closure metadata should be recorded and the vacancy should disappear from public discovery. | The status should become `closed`, closure metadata should be recorded and the vacancy should disappear from public discovery. | Passed |
| 13.10 | Attempt to close another Employer's published vacancy. | Unrelated Employer session | The closure action should be refused by the ownership check. | The closure action should be refused by the ownership check. | Passed |
| 13.11 | Refresh Student and Employer views after an Administrator decision. | Approved or rejected vacancy | All affected views should display the latest vacancy state. | All affected views should display the latest vacancy state. | Passed |
| 13.12 | Confirm that a closed vacancy is excluded from active metrics. | Recently closed vacancy | Public opportunities and Employer active-vacancy totals should no longer include the vacancy. | Public opportunities and Employer active-vacancy totals should no longer include the vacancy. | Passed |
| 13.13 | Review the audit log after vacancy approval, rejection or closure. | Completed vacancy action | The appropriate actor, action type, target and timestamp should be recorded. | The appropriate actor, action type, target and timestamp should be recorded. | Passed |

The vacancy-approval tests cover administrative review, publication, rejection, Employer correction, state validation, closure, live updates and auditability. They verify that only approved vacancies become publicly available and that every significant decision remains traceable.

*Table 5.X: Administrator User and Administrator-Account Management Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 14.1 | Open the Administrator user-management page. | `/admin/users` | User, Administrator and pending-Employer tabs should display the relevant accounts. | User, Administrator and pending-Employer tabs should display the relevant accounts. | Passed |
| 14.2 | Deactivate an active Student account. | Active Student target | Firestore and Firebase Authentication should both mark the account inactive, refresh tokens should be revoked and an audit event should be created. | Firestore and Firebase Authentication should both mark the account inactive, refresh tokens should be revoked and an audit event should be created. | Passed |
| 14.3 | Attempt to sign in using the deactivated Student account. | Deactivated credentials | Session creation should be refused. | Session creation should be refused. | Passed |
| 14.4 | Reactivate a deactivated Student or Employer account. | Inactive non-Administrator target | Firestore and Firebase Authentication should restore the account to active status. | Firestore and Firebase Authentication should restore the account to active status. | Passed |
| 14.5 | Attempt to deactivate the currently signed-in Administrator. | Current Administrator target | The action should be rejected to prevent self-deactivation. | The action should be rejected to prevent self-deactivation. | Passed |
| 14.6 | Attempt to deactivate the final active Administrator. | Only active Administrator remaining | The transaction should be rejected so the system retains administrative access. | The transaction should be rejected so the system retains administrative access. | Passed |
| 14.7 | Manage another Administrator using an ordinary Administrator account. | `canManageAdmins=false` | Activation or deactivation of the Administrator target should be refused. | Activation or deactivation of the Administrator target should be refused. | Passed |
| 14.8 | Manage another Administrator using the primary Administrator. | `canManageAdmins=true` | The authorised activation or deactivation should be completed and audited. | The authorised activation or deactivation should be completed and audited. | Passed |
| 14.9 | Open the create-Administrator dialog as an ordinary Administrator. | `canManageAdmins=false` | Administrator-creation controls should not be available. | Administrator-creation controls should not be available. | Passed |
| 14.10 | Create an Administrator using the primary Administrator. | Valid name, unique email, department and strong temporary password | A Firebase user, trusted Administrator claim and active Firestore profile should be created with `mustChangePassword=true`. | A Firebase user, trusted Administrator claim and active Firestore profile should be created with `mustChangePassword=true`. | Passed |
| 14.11 | Create an Administrator with mismatched temporary passwords. | Different password and confirmation | Creation should be prevented. | Creation should be prevented. | Passed |
| 14.12 | Create an Administrator with a weak temporary password. | Fewer than 12 characters or missing required character type | Creation should be rejected by the password policy. | Creation should be rejected by the password policy. | Passed |
| 14.13 | Sign in as a newly created Administrator. | Valid temporary credentials | The user should be redirected to the account page and required to change the temporary password before protected actions. | The user should be redirected to the account page and required to change the temporary password before protected actions. | Passed |
| 14.14 | Simulate a Firestore failure during Administrator creation. | Auth user created; profile write forced to fail | The newly created Firebase Authentication user should be deleted to avoid an incomplete privileged account. | The newly created Firebase Authentication user should be deleted to avoid an incomplete privileged account. | Passed |

These tests evaluate account activation, Firebase and Firestore consistency, token revocation, self-protection, preservation of the final Administrator and primary-Administrator privileges. They also test secure Administrator creation and rollback to prevent incomplete or unauthorised privileged accounts.

*Table 5.X: Administrator Application Monitoring and Audit-Log Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 15.1 | Open the Administrator application-overview page. | `/admin/applications` | Applications across all Employers and Students should appear in a read-only overview. | Applications across all Employers and Students should appear in a read-only overview. | Passed |
| 15.2 | Review an application record in the overview. | Valid application | Student, vacancy, Employer, submission date and current status information should be displayed. | Student, vacancy, Employer, submission date and current status information should be displayed. | Passed |
| 15.3 | Confirm the page does not expose unsupported Administrator decisions. | Current overview-only interface | No application-detail or decision workflow should be represented as available. | No application-detail or decision workflow should be represented as available. | Passed |
| 15.4 | Open the Administrator audit-log page. | `/admin/audit-logs` | The latest recorded security and operational events should appear. | The latest recorded security and operational events should appear. | Passed |
| 15.5 | Verify the audit-log result limit. | More than 100 stored events | The page should display the latest 100 events in descending time order. | The page should display the latest 100 events in descending time order. | Passed |
| 15.6 | Review a sign-in and sign-out audit event. | Completed authentication actions | The action category, actor and timestamp should be displayed. | The action category, actor and timestamp should be displayed. | Passed |
| 15.7 | Review a profile or password-change event. | Completed profile or password update | The corresponding audit event should appear without exposing password values. | The corresponding audit event should appear without exposing password values. | Passed |
| 15.8 | Review an Employer or vacancy approval event. | Completed administrative approval | The Administrator actor, target and decision should be identifiable. | The Administrator actor, target and decision should be identifiable. | Passed |
| 15.9 | Review an application submission or status event. | Completed Student submission or Employer decision | The relevant application action should appear in the audit trail. | The relevant application action should appear in the audit trail. | Passed |
| 15.10 | Open the audit-log page as a Student or Employer. | Non-Administrator session | Access should be denied through role enforcement and Firestore rules. | Access should be denied through role enforcement and Firestore rules. | Passed |

These tests examine cross-portal application oversight and the latest operational and security records. The scope remains consistent with the implemented website: Administrators can monitor applications but the current Administrator interface does not provide an application-detail decision workflow.

*Table 5.X: Role-Based Access, File Privacy and Security Rules Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 16.1 | Access a Student route using an Employer or Administrator account. | `/student/profile`, `/student/documents` or another Student route | The user should be redirected to the dashboard belonging to the authenticated role. | The user should be redirected to the dashboard belonging to the authenticated role. | Passed |
| 16.2 | Access an Employer route using a Student or Administrator account. | `/employer/vacancies` or another Employer route | The user should be redirected safely and should not receive Employer data. | The user should be redirected safely and should not receive Employer data. | Passed |
| 16.3 | Access an Administrator route using a Student or Employer account. | `/admin/users` or another Administrator route | Access should be denied. | Access should be denied. | Passed |
| 16.4 | Read another Student's Firestore profile directly from the browser. | Modified client request | Firestore rules should deny the unauthorised read. | Firestore rules should deny the unauthorised read. | Passed |
| 16.5 | Modify protected role or approval fields in the current user's profile. | Client update containing `role`, `approved` or other protected access data | Firestore rules or server validation should refuse the change. | Firestore rules or server validation should refuse the change. | Passed |
| 16.6 | Read another Student's document metadata directly. | Non-owner Student session | Firestore rules should deny access. | Firestore rules should deny access. | Passed |
| 16.7 | Download another Student's private document without a related application. | Unrelated document identifier | The protected API should return an unauthorised or not-found response. | The protected API should return an unauthorised or not-found response. | Passed |
| 16.8 | Download an applicant document as the related Employer. | Application belongs to an owned vacancy | The protected API should permit the download. | The protected API should permit the download. | Passed |
| 16.9 | Download a Student document as an Administrator. | Valid Administrator session and document | The protected API should permit authorised administrative access. | The protected API should permit authorised administrative access. | Passed |
| 16.10 | Access a Cloud Storage object directly from the browser. | Direct Storage SDK or object request | Storage rules should deny direct client access. | Storage rules should deny direct client access. | Passed |
| 16.11 | Create or update another Employer's vacancy through a modified request. | Unrelated job identifier | Server ownership checks should reject the write. | Server ownership checks should reject the write. | Passed |
| 16.12 | Read another Employer's application through a client listener. | Application for an unrelated vacancy | Firestore rules should deny access. | Firestore rules should deny access. | Passed |
| 16.13 | Send a document PATCH or DELETE request without authentication. | `/api/documents/[id]` | The API should return HTTP 401 and should not modify data. | The API should return HTTP 401 and should not modify data. | Passed |
| 16.14 | Use a revoked or expired session cookie on a protected page. | Invalid `apu_session` cookie | Session verification should fail and the user should be redirected to login. | Session verification should fail and the user should be redirected to login. | Passed |

These tests cover page-level role enforcement, protected profile fields, record ownership, private documents, related-Employer access, Administrator access, direct Storage denial and session verification. Together, they provide evidence that authentication alone is insufficient and that every protected operation is checked against role and ownership requirements.

*Table 5.X: Profile, Password, Support and Shared Interface Test Table*

| Test Case ID | Test Procedure | Test Data/Condition | Expected Outcome | Actual Outcome | Result |
|---|---|---|---|---|---|
| 17.1 | Open the account-settings page for each role. | Student, Employer and Administrator sessions | The current name, phone, read-only email and role information should be displayed. | The current name, phone, read-only email and role information should be displayed. | Passed |
| 17.2 | Update valid account information. | Valid full name and phone | The changes should be stored, audited and reflected in the role layout. | The changes should be stored, audited and reflected in the role layout. | Passed |
| 17.3 | Attempt to modify the read-only login email or role. | Manipulated form request | The protected fields should remain unchanged. | The protected fields should remain unchanged. | Passed |
| 17.4 | Change the password using an incorrect current password. | Incorrect existing password | Re-authentication should fail and the password should remain unchanged. | Re-authentication should fail and the password should remain unchanged. | Passed |
| 17.5 | Change the password using fewer than 12 characters. | Short new password | The password change should be rejected. | The password change should be rejected. | Passed |
| 17.6 | Change the password without an uppercase, lowercase, number or symbol. | New password missing a required character type | The password change should be rejected by the mixed-character policy. | The password change should be rejected by the mixed-character policy. | Passed |
| 17.7 | Change the password using valid values. | Correct current password and valid 12–128 character new password | Firebase Authentication should update the password, clear any temporary-password requirement and create an audit event. | Firebase Authentication should update the password, clear any temporary-password requirement and create an audit event. | Passed |
| 17.8 | Open the role-specific support page. | Student, Employer or Administrator support route | Appropriate guidance and safe-email reminders should appear. | Appropriate guidance and safe-email reminders should appear. | Passed |
| 17.9 | Select the support email action. | Gmail support link | Gmail should open with the configured support address. | Gmail should open with the configured support address. | Passed |
| 17.10 | Navigate through the shared dashboard sidebar. | All visible links for each role | Every implemented navigation item should open the correct authorised page. | Every implemented navigation item should open the correct authorised page. | Passed |
| 17.11 | Operate dropdowns, dialogs, tabs and form controls using a keyboard. | Keyboard-only interaction | Focus should remain visible and each control should be operable without a mouse. | Focus should remain visible and each control should be operable without a mouse. | Passed |
| 17.12 | Trigger loading, success, warning and error states. | Slow, successful and failed operations | The appropriate feedback should be communicated, and duplicate submission should be disabled while processing. | The appropriate feedback should be communicated, and duplicate submission should be disabled while processing. | Passed |
| 17.13 | Run project linting and the production build. | `npm run lint` and `npm run build` | Linting, TypeScript checking and production compilation should complete without errors. | ESLint completed without errors. The production build compiled successfully, TypeScript checking completed successfully and all 28 static pages were generated. | Passed |

These tests cover shared account controls, password security, support access, role navigation, keyboard operation, system feedback and technical build verification. They complete the unit-testing plan by checking the common functions used throughout the Student, Employer and Administrator interfaces.

