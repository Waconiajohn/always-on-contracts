# 🤖 AUTOMATED TEST EXECUTION CHECKLIST

This checklist can be used for manual testing or as a basis for automated test scripts.

---

## 🔐 AUTHENTICATION TESTS

### Test Suite: AUTH-001 to AUTH-010

```bash
# Test AUTH-001: User Registration
□ Navigate to /auth
□ Click "Sign Up" toggle
□ Enter full name: "Test User"
□ Enter email: "test@example.com"
□ Enter password: "TestPass123"
□ Click "Sign Up" button
✓ Expected: Success toast "Account created!"
✓ Expected: Form switches to login mode
✓ Expected: User can now log in

# Test AUTH-002: Password Validation
□ Navigate to /auth (signup mode)
□ Enter password: "weak" (< 8 chars)
□ Click "Sign Up"
✓ Expected: Error "Password too short"

□ Enter password: "alllowercase" (no uppercase)
□ Click "Sign Up"  
✓ Expected: Error "Weak password"

□ Enter password: "NoNumbers" (no digits)
□ Click "Sign Up"
✓ Expected: Error "Weak password"

# Test AUTH-003: Login with Valid Credentials
□ Navigate to /auth
□ Enter email: [your test account]
□ Enter password: [your test password]
□ Click "Sign In"
✓ Expected: Success toast "Welcome back!"
✓ Expected: Redirect to /command-center or /career-vault/onboarding
✓ Expected: Session persists after page refresh

# Test AUTH-004: Rate Limiting
□ Navigate to /auth
□ Enter wrong password 5 times in a row
✓ Expected: After 5th attempt, error "Too many attempts"
✓ Expected: Locked out for 15 minutes
□ Wait 15 minutes
□ Try logging in again
✓ Expected: Counter reset, can attempt login

# Test AUTH-005: Protected Route Enforcement
□ Open browser in incognito mode
□ Navigate to /job-search (without logging in)
✓ Expected: Redirect to /auth
□ Navigate to /career-vault (without logging in)
✓ Expected: Redirect to /auth
```

---

## 🔍 JOB SEARCH TESTS

### Test Suite: JOB-001 to JOB-015

```bash
# Test JOB-001: Basic Job Search
□ Login and navigate to /job-search
□ Enter search query: "Product Manager"
□ Enter location: "San Francisco"
□ Click "Search"
✓ Expected: Loading indicator appears
✓ Expected: Search completes in <5 seconds
✓ Expected: Results display with job cards
✓ Expected: Toast shows "Found X jobs in Y.Zs"

# Test JOB-002: Search Filters
□ On /job-search page
□ Set Posted filter to "Last 7 days"
□ Set Remote to "Remote"
□ Set Employment Type to "Full-time"
□ Enable "Contract Only" toggle
□ Click "Search"
✓ Expected: Results match all selected filters
✓ Expected: Filter count badge shows "(3 applied)"

# Test JOB-003: Boolean Search Manual Entry
□ Navigate to /job-search
□ Click "Advanced Filters" to expand
□ Enter boolean string: '("Product Manager" OR "Program Manager") AND Agile NOT junior'
□ Click "Search"
✓ Expected: Google Jobs results include boolean query
✓ Expected: Boolean string persists in input field
□ Click "Copy for LinkedIn"
✓ Expected: String copied to clipboard
✓ Expected: Toast "Copied for LinkedIn"

# Test JOB-004: Boolean AI Assistant - Opening
□ Navigate to /job-search  
□ Click "Advanced Filters" to expand
□ Click "Let AI Build Your Boolean Search" button
✓ Expected: Modal dialog opens
✓ Expected: AI greeting message appears
✓ Expected: Input field is focused and ready

# Test JOB-005: Boolean AI Assistant - Conversation
□ With AI assistant open
□ Type: "Product Manager"
□ Press Enter or click "Send"
✓ Expected: User message appears on right (blue background)
✓ Expected: Loading indicator appears
✓ Expected: AI response appears on left (gray background)
✓ Expected: AI asks follow-up question (e.g., "What required skills?")
□ Continue conversation for 3-5 exchanges
✓ Expected: Each message alternates sides
✓ Expected: Responses are coherent and relevant

# Test JOB-006: Chat Scrolling
□ With AI assistant open  
□ Send 10+ messages to overflow chat area
✓ Expected: Scrollbar appears when content overflows
✓ Expected: Chat auto-scrolls to bottom after each message
✓ Expected: User can manually scroll up to read history
✓ Expected: New messages don't disrupt manual scroll position

# Test JOB-007: Boolean String Generation
□ Complete AI conversation until boolean string is generated
✓ Expected: AI provides well-formed boolean string
✓ Expected: String contains proper operators (AND, OR, NOT, quotes)
✓ Expected: String explanation is clear
✓ Expected: "Copy" and "Use This Search" buttons appear below string

# Test JOB-008: Copy Boolean String
□ After AI generates boolean string
□ Click "Copy" button
✓ Expected: Button text changes to "Copied" with checkmark
✓ Expected: Toast notification "Copied!"
✓ Expected: String is in clipboard
□ Paste into text editor
✓ Expected: Correct string pasted

# Test JOB-009: Apply Boolean Search (ENHANCED)
□ After AI generates boolean string
□ Click "Use This Search" button
✓ Expected: Modal closes immediately
✓ Expected: Advanced Filters section expands automatically
✓ Expected: Boolean string populates input field
✓ Expected: Toast "Search applied!"
✓ Expected: User can immediately see the applied string

# Test JOB-010: Multi-Source Search Progress
□ Execute any job search
✓ Expected: Progress card appears during search
✓ Expected: Shows "Searching 7 sources..."
✓ Expected: Source names listed: Google Jobs, Greenhouse, Lever, etc.
✓ Expected: Checkmarks (✓) appear as sources complete
✓ Expected: All sources marked as complete when done

# Test JOB-011: Search Results Display
□ After search completes
✓ Expected: Job cards display with:
  - Job title (bold)
  - Company name
  - Location
  - Salary range (if available)
  - Posted date (relative, e.g., "2 days ago")
  - Match score badge (if user has vault)
  - "Add to Queue" button
✓ Expected: Results sorted by match score (high to low)

# Test JOB-012: Add Job to Queue
□ Click "Add to Queue" on any job card
✓ Expected: Loading state on button
✓ Expected: Toast "Added to queue"
✓ Expected: Job record created in opportunity_matches table
✓ Expected: Can view in /opportunities page

# Test JOB-013: Empty Search Results
□ Search for nonsensical term: "zxzxzxzxzx"
✓ Expected: No results found
✓ Expected: Helpful empty state message
✓ Expected: No error thrown

# Test JOB-014: Vault Suggestions
□ Login with account that has completed vault
□ Navigate to /job-search
✓ Expected: Blue card appears at top with "💡 From your Career Vault:"
✓ Expected: 5 badge buttons with suggested job titles
□ Click any suggested title badge
✓ Expected: Search query populated with that title
✓ Expected: Ready to click "Search"

# Test JOB-015: Reset Boolean AI Chat
□ Open Boolean AI assistant
□ Have a conversation (3+ messages)
□ Click "Reset" button
✓ Expected: Confirmation or immediate reset
✓ Expected: Chat history cleared
✓ Expected: AI greeting message reappears
✓ Expected: Ready for new conversation
```

---

## 📄 RESUME PROCESSING TESTS

### Test Suite: VAULT-001 to VAULT-010

```bash
# Test VAULT-001: PDF Resume Upload
□ Navigate to /career-vault/onboarding
□ Click "Choose File" or drag-drop zone
□ Select a valid PDF resume (< 5MB)
□ Click "Upload Resume"
✓ Expected: Loading indicator "Processing..."
✓ Expected: Success toast "Resume Uploaded"
✓ Expected: Progress bar advances
✓ Expected: Redirects to "Career Goals" step

# Test VAULT-002: DOCX Resume Upload
□ Navigate to /career-vault/onboarding
□ Upload a .docx resume file
✓ Expected: Processing via Lovable AI
✓ Expected: Success within 5 seconds
✓ Expected: Text extracted correctly

# Test VAULT-003: TXT Resume Upload
□ Navigate to /career-vault/onboarding
□ Upload a .txt resume file
✓ Expected: Instant text extraction
✓ Expected: Success toast immediately
✓ Expected: Proceeds to next step

# Test VAULT-004: Invalid File Handling
□ Try uploading a .jpg image file
✓ Expected: Error "Unsupported file type"

□ Try uploading a scanned PDF (image-based)
✓ Expected: Error "No text found in PDF"
✓ Expected: Helpful message about OCR

□ Try uploading a 1-line PDF
✓ Expected: Error about insufficient content

# Test VAULT-005: Career Goals Setting
□ After resume upload completes
✓ Expected: Redirect to "Career Goals" step
□ Select 2-3 target roles (e.g., "Product Manager", "Director of Product")
□ Select 1-2 target industries (e.g., "Technology", "Healthcare")
□ Click "Continue"
✓ Expected: Goals saved to career_vault table
✓ Expected: Progress bar advances
✓ Expected: Redirects to "Choose Power Level" step

# Test VAULT-006: Milestone Parsing with Career Focus
□ After setting career goals
□ Click "Start Intelligence Extraction"
✓ Expected: Toast "Extracting career milestones..."
✓ Expected: parse-resume-milestones function called
✓ Expected: 8-12 jobs extracted (only relevant ones)
✓ Expected: Each job has relevance_score ≥ 50%
✓ Expected: Jobs saved to vault_resume_milestones table
✓ Expected: Progress bar advances

# Test VAULT-007: Resume Replace vs Enhance
□ User with existing vault data
□ Navigate to /career-vault/onboarding
□ Upload a new resume
✓ Expected: Modal appears "Replace or Enhance?"
□ Click "Replace Vault"
✓ Expected: Confirmation that data will be deleted
✓ Expected: All vault tables cleared for user
✓ Expected: Fresh start with new resume

□ OR Click "Enhance Vault"
✓ Expected: New resume data merged with existing
✓ Expected: Previous intelligence retained

# Test VAULT-008: Vault Completion Progress
□ Login with partially complete vault
✓ Expected: Completion % calculated correctly
✓ Expected: Progress bar on dashboard shows accurate %
□ Complete one interview response
✓ Expected: Completion % increases
✓ Expected: Updated in real-time

# Test VAULT-009: Resume Storage Bucket
□ Upload any resume
✓ Expected: File saved to Supabase storage 'resumes' bucket
✓ Expected: File path: {user_id}/{timestamp}_{filename}
✓ Expected: File accessible via storage API
✓ Expected: RLS policies protect file (user_id check)

# Test VAULT-010: Resume Processing Error Handling
□ Upload a corrupted PDF file
✓ Expected: Graceful error message
✓ Expected: User can retry upload
✓ Expected: Error logged to processing_logs table
✓ Expected: No crash or blank screen
```

---

## 🎯 INTERVIEW PREPARATION TESTS

### Test Suite: INTERVIEW-001 to INTERVIEW-010

```bash
# Test INTERVIEW-001: Interview Question Generation
□ Navigate to /interview-prep
□ Select a job from dropdown
□ Click "Generate Interview Questions"
✓ Expected: 10+ questions generated
✓ Expected: Questions relevant to job role
✓ Expected: Mix of behavioral and technical questions
✓ Expected: Questions saved to database

# Test INTERVIEW-002: Company Research Panel
□ On /interview-prep page
□ Enter company name: "Google"
□ Click "Research Company"
✓ Expected: Loading indicator
✓ Expected: Company info displayed (culture, values, news)
✓ Expected: Data sourced from Perplexity API
✓ Expected: Research saved for later reference

# Test INTERVIEW-003: STAR Story Builder
□ Navigate to /interview-prep
□ Click "Build STAR Story"
□ Fill in:
  - Situation: [describe context]
  - Task: [describe responsibility]
  - Action: [describe what you did]
  - Result: [describe outcome]
□ Click "Save Story"
✓ Expected: Story saved to vault_interview_responses
✓ Expected: Story appears in stories list
✓ Expected: Can reuse story for multiple questions

# Test INTERVIEW-004: 3-2-1 Framework Builder
□ Navigate to /interview-prep
□ Select job from list
□ Click "Generate 3-2-1 Framework"
✓ Expected: AI generates framework:
  - 3 achievements that prove fit
  - 2 challenges you can solve
  - 1 unique value proposition
✓ Expected: Framework saved
✓ Expected: Can edit and refine

# Test INTERVIEW-005: 30-60-90 Day Plan Generator
□ On /interview-prep page
□ Select target job
□ Click "Generate 30-60-90 Plan"
✓ Expected: AI creates detailed plan with:
  - First 30 days: Learning phase
  - 60 days: Contributing phase
  - 90 days: Leading phase
✓ Expected: Plan is specific to role/company
✓ Expected: Can export to PDF or print

# Test INTERVIEW-006: Elevator Pitch Builder
□ Navigate to /interview-prep
□ Click "Build Elevator Pitch"
□ AI generates 30-second pitch
✓ Expected: Pitch includes:
  - Current role summary
  - Key achievements
  - Career goals
  - Value proposition
✓ Expected: Pitch is 30-45 seconds when read aloud
✓ Expected: Can practice with timer

# Test INTERVIEW-007: Interview Response Validation
□ Answer an interview question
□ Submit response
✓ Expected: AI validates response using dual-AI audit
✓ Expected: Feedback on:
  - Structure (STAR format)
  - Specificity (quantifiable results)
  - Relevance to question
  - Professional tone
✓ Expected: Suggestions for improvement
✓ Expected: Score out of 100

# Test INTERVIEW-008: Interview Follow-up Generator
□ After mock interview session
□ Click "Generate Follow-up Email"
✓ Expected: AI creates personalized thank-you email
✓ Expected: Email mentions specific interview topics
✓ Expected: Reinforces fit for role
✓ Expected: Professional and concise
✓ Expected: Can edit before sending

# Test INTERVIEW-009: Panel Interview Guide
□ Navigate to /interview-prep
□ Enter panel interview details (multiple interviewers)
□ Click "Generate Panel Guide"
✓ Expected: AI creates strategy for each interviewer
✓ Expected: Tailored talking points per person
✓ Expected: Time management tips
✓ Expected: Follow-up strategy

# Test INTERVIEW-010: Interview Communication Tracking
□ Send interview follow-up
✓ Expected: Communication saved to interview_communications table
✓ Expected: Status tracked: draft → sent → received
✓ Expected: Follow-up reminders set
✓ Expected: Can view communication history per job
```

---

## 💼 LINKEDIN TOOLS TESTS

### Test Suite: LINKEDIN-001 to LINKEDIN-010

```bash
# Test LINKEDIN-001: Profile Optimization
□ Navigate to /linkedin-profile-builder
□ Enter current profile sections
□ Click "Optimize Profile"
✓ Expected: AI analyzes each section
✓ Expected: Optimization score displayed (0-100)
✓ Expected: Specific suggestions for:
  - Headline
  - About section
  - Experience bullets
  - Skills
✓ Expected: Before/after comparison shown

# Test LINKEDIN-002: Post Generation
□ Navigate to /linkedin-blogging-agent  
□ Enter topic or focus
□ Select tone: Professional / Inspirational / Educational
□ Click "Generate Post"
✓ Expected: AI creates LinkedIn post:
  - Hook in first 2 lines
  - 1-3 paragraphs of content
  - Call-to-action
  - 3-5 relevant hashtags
✓ Expected: Character count displayed
✓ Expected: Preview shows mobile + desktop view

# Test LINKEDIN-003: Human Writing Analyzer
□ After generating post
□ Click "Analyze Human-ness"
✓ Expected: Score 0-100 for how human text sounds
✓ Expected: Flags if text sounds too "AI-generated"
✓ Expected: Suggestions to make more authentic
✓ Expected: Checks for:
  - Overused AI phrases
  - Unnatural phrasing
  - Lack of personal voice

# Test LINKEDIN-004: Series Planner
□ Navigate to /linkedin-blogging-agent
□ Click "Plan a Series"
□ Enter:
  - Series topic: "Career Transitions"
  - Length: 5 posts
  - Industry: "Technology"
  - Experience level: "10 years"
□ Click "Generate Outline"
✓ Expected: AI creates 5-post outline with:
  - Post 1: Introduction/Hook
  - Posts 2-4: Deep dives
  - Post 5: Conclusion/CTA
✓ Expected: Each post has title + key points
✓ Expected: Logical progression across posts

# Test LINKEDIN-005: Post Quality Check
□ After generating post
□ Click "Quality Check"
✓ Expected: Checks for:
  - Engagement hooks
  - Clear value proposition
  - Appropriate length (800-1200 chars)
  - Hashtag relevance
  - Call-to-action strength
✓ Expected: Score out of 100
✓ Expected: Specific improvement suggestions

# Test LINKEDIN-006: Weekly Posting Calendar
□ Navigate to /linkedin-blogging-agent
□ Click "View Calendar"
✓ Expected: Calendar view shows:
  - Scheduled posts
  - Best posting times
  - Content gaps
  - Engagement predictions
✓ Expected: Can drag-drop to reschedule
✓ Expected: Reminders for posting days

# Test LINKEDIN-007: Skills Tag Input
□ In profile optimizer
□ Add skills: "Product Management, Agile, Scrum"
✓ Expected: Autocomplete suggestions from LinkedIn
✓ Expected: Can add custom skills
✓ Expected: Skills ranked by importance
✓ Expected: Skills mapped to job targets

# Test LINKEDIN-008: Character Counter
□ While editing LinkedIn post
□ Type content
✓ Expected: Real-time character count
✓ Expected: Color changes:
  - Green: 800-1200 (optimal)
  - Yellow: 1200-3000 (acceptable)
  - Red: >3000 (too long)
✓ Expected: Warning if under 200 chars

# Test LINKEDIN-009: Profile Progress Tracker
□ Navigate to /linkedin-profile-builder
✓ Expected: Progress bars for each section:
  - Headline: % complete
  - About: % complete
  - Experience: % complete
  - Skills: % complete
✓ Expected: Overall profile strength score
✓ Expected: Comparison to industry benchmarks

# Test LINKEDIN-010: Series Dashboard
□ Navigate to /linkedin-blogging-agent
□ Click "Series Dashboard"
✓ Expected: Shows all created series
✓ Expected: For each series:
  - Title and topic
  - Completion status (X of Y posts done)
  - Engagement metrics (if posted)
  - Next post suggestion
✓ Expected: Can resume incomplete series
```

---

## 🚀 PERFORMANCE TESTS

```bash
# Test PERF-001: Page Load Times
□ Measure time to interactive for each page:
✓ Expected: /job-search < 2 seconds
✓ Expected: /career-vault < 2 seconds
✓ Expected: /interview-prep < 2 seconds
✓ Expected: /command-center < 2 seconds

# Test PERF-002: Job Search Response Time
□ Execute job search with filters
✓ Expected: Results in < 5 seconds (7 sources)
✓ Expected: Google Jobs < 2 seconds
✓ Expected: Company boards < 3 seconds total
✓ Expected: Deduplication < 500ms

# Test PERF-003: Resume Processing Time
□ Upload standard PDF resume (2 pages)
✓ Expected: Text extraction < 3 seconds
✓ Expected: AI analysis < 5 seconds
✓ Expected: Total processing < 10 seconds

# Test PERF-004: AI Response Times
□ Generate boolean search string
✓ Expected: First response < 3 seconds
□ Generate interview questions
✓ Expected: 10 questions < 8 seconds
□ Generate LinkedIn post
✓ Expected: Post generation < 5 seconds

# Test PERF-005: Database Query Performance
□ Check Career Vault dashboard load
✓ Expected: Complex queries < 1 second
✓ Expected: No N+1 query issues
✓ Expected: Proper indexing on foreign keys
```

---

## 🔒 SECURITY TESTS

```bash
# Test SEC-001: RLS Policy Enforcement
□ Login as User A
□ Try to access User B's data via API
✓ Expected: 403 Forbidden or empty result
✓ Expected: No cross-user data leakage

# Test SEC-002: SQL Injection Prevention
□ In job search, enter: "test' OR '1'='1"
✓ Expected: No SQL injection possible
✓ Expected: Input properly sanitized

# Test SEC-003: XSS Prevention
□ In LinkedIn post, enter: "<script>alert('xss')</script>"
✓ Expected: Script tags escaped
✓ Expected: No script execution

# Test SEC-004: CORS Protection
□ Try calling edge functions from different origin
✓ Expected: CORS headers allow/deny correctly
✓ Expected: OPTIONS preflight works

# Test SEC-005: Rate Limiting
□ Call parse-resume function 100 times rapidly
✓ Expected: Rate limit kicked in
✓ Expected: 429 Too Many Requests response
✓ Expected: Retry-After header present

# Test SEC-006: JWT Verification
□ Try calling protected function without auth token
✓ Expected: 401 Unauthorized
□ Try with invalid token
✓ Expected: 401 Unauthorized
□ Try with expired token
✓ Expected: 401 Unauthorized

# Test SEC-007: File Upload Security
□ Try uploading .exe file
✓ Expected: Rejected (file type validation)
□ Try uploading 50MB file
✓ Expected: Rejected (size limit)
□ Try malicious PDF with embedded script
✓ Expected: Text extracted safely, script ignored
```

---

## 📱 RESPONSIVE DESIGN TESTS

```bash
# Test RESP-001: Mobile View (375px width)
□ Resize browser to 375px wide
□ Navigate through all pages
✓ Expected: No horizontal scroll
✓ Expected: Touch targets ≥ 44px
✓ Expected: Text readable without zoom
✓ Expected: Navigation accessible (hamburger menu)

# Test RESP-002: Tablet View (768px width)
□ Resize to tablet dimensions
✓ Expected: 2-column layouts where appropriate
✓ Expected: Images scale correctly
✓ Expected: Cards stack properly

# Test RESP-003: Desktop View (1920px width)
□ Open on large desktop monitor
✓ Expected: Content centered, not stretched
✓ Expected: Max-width containers prevent excessive line length
✓ Expected: Multi-column layouts utilized
```

---

## 🎯 EDGE CASE TESTS

```bash
# Test EDGE-001: Empty States
□ View job search with no results
✓ Expected: Friendly empty state message
□ View career vault with no data
✓ Expected: Clear call-to-action to start
□ View opportunities list when empty
✓ Expected: Helpful onboarding message

# Test EDGE-002: Network Failures
□ Disconnect internet during job search
✓ Expected: Error message with retry option
✓ Expected: No blank screens
✓ Expected: Previous data still visible

# Test EDGE-003: Concurrent Operations
□ Upload 3 resumes simultaneously
✓ Expected: All process correctly
✓ Expected: No race conditions
✓ Expected: Proper queue management

# Test EDGE-004: Long-Running Operations
□ Start resume processing
□ Close browser tab
□ Reopen after 5 minutes
✓ Expected: Processing completed
✓ Expected: Results available
✓ Expected: No data loss

# Test EDGE-005: Extremely Long Content
□ Enter 10,000 character job description
✓ Expected: Handled gracefully
✓ Expected: Truncation or scrolling
✓ Expected: No layout breaking
```

---

## ✅ TEST COMPLETION CHECKLIST

**Before marking test suite complete:**

□ All authentication flows tested
□ All job search features tested
□ All resume processing paths tested
□ All Career Vault flows tested
□ All interview prep tools tested
□ All LinkedIn tools tested
□ Performance benchmarks met
□ Security tests passed
□ Responsive design verified
□ Edge cases handled
□ Error messages user-friendly
□ Loading states appropriate
□ Success feedback clear
□ No console errors during normal use
□ No network errors in production

---

## 📊 TEST METRICS

Track these metrics during testing:

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| Page Load Time | < 2s | _____s | □ |
| Job Search Time | < 5s | _____s | □ |
| Resume Processing | < 10s | _____s | □ |
| AI Response Time | < 5s | _____s | □ |
| Zero Console Errors | Yes | _____  | □ |
| Zero Network Fails | Yes | _____  | □ |
| Mobile Usable | Yes | _____  | □ |
| Tests Passed | 100% | _____% | □ |

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-14  
**Maintained By:** AI Test Engineer
