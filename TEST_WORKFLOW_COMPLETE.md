# Test Management Workflow - Complete Guide

## Quick Start ⚡

**System Status:** ✅ Running
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Tests Available: 21 assessments across 5 categories

## Complete Workflow

### Phase 1: Job Creation with Test Selection

1. **Login as Admin/HR**
   - Navigate to "Job List"

2. **Create New Job**
   - Click "Create New Job"
   - Fill in job details:
     * Title (e.g., "Senior Full Stack Developer")
     * Department
     * Location
     * Salary Range
     * Description
     * Requirements

3. **Select Required Tests**
   - Click "Select Tests" button
   - Tests are grouped by category with emoji indicators:
     * 💻 Technical (5 tests)
     * 🧠 Cognitive (6 tests)
     * 🎭 Personality (5 tests)
     * 🤝 Soft Skills (3 tests)
     * 📋 Regulatory (2 tests)

4. **Configure Each Test**
   - Click test to add it
   - Set as Mandatory or Optional
   - Configure passing score (default 60%)
   - Tests appear below with configuration

5. **Example Configuration**
   ```
   Senior Full Stack Developer Position:
   - JavaScript (Coding): Intermediate ✅ Mandatory, 70% pass
   - React Development ✅ Mandatory, 70% pass
   - Problem Solving ✅ Mandatory, 65% pass
   - Critical Thinking ⭕ Optional, 60% pass
   - Communication Skills ✅ Mandatory, 70% pass
   ```

6. **Save Job**
   - Tests are now automatically assigned
   - Candidates who apply will need to complete these tests

---

### Phase 2: Application Review

1. **Candidates Apply**
   - Via public application form
   - Applications show in "HR Review"

2. **Initial Screening**
   - Review applications in HR Review
   - Use AI Screening if needed
   - Move qualified candidates to "screening" status

3. **Check Test Requirements**
   - Each application shows required tests from the job
   - Tests are auto-assigned based on job configuration

---

### Phase 3: Test Management (Consolidated Screen)

#### Navigate to Test Management
- Single menu item: "Test Management"
- Shows workflow indicator (Stage 3 of 5)

#### Filter Options

**By Position:**
```
All Positions
├─ Senior Full Stack Developer (3 tests)
├─ Backend Engineer (2 tests)
└─ Frontend Developer (4 tests)
```

**By Status:**
- **Ready (Blue)**: Candidates ready to receive tests
- **Pending (Yellow)**: Tests sent, awaiting completion
- **Completed (Purple)**: Tests finished, results available

#### Quick Stats Dashboard
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  Ready to Send      │  │  Awaiting Completion│  │  Tests Completed    │
│       12            │  │         5           │  │         8           │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

---

### Phase 4: Sending Tests

1. **View Ready Candidates**
   - Click "Ready" filter
   - See all candidates in screening stage

2. **Review Auto-Assigned Tests**
   - Each candidate shows:
     * Name and email
     * Position applied for
     * Required tests (from job configuration)
     * Test details (duration, passing score)

3. **Select Candidates**
   - Use checkboxes to select multiple candidates
   - Or click "Select All"

4. **Send Tests in Bulk**
   - Click "Send Tests to X Selected"
   - Tests are sent via TestGorilla API
   - Status changes to "Test Sent"

5. **What Happens:**
   ```
   API Call: POST /api/testing/send-test
   {
     applicationId: "abc123",
     assessmentId: "js-coding-intermediate",
     assessmentName: "JavaScript (Coding): Intermediate"
   }
   
   Response: Test invitation sent to candidate's email
   Status: screening → test-invited (pending)
   ```

---

### Phase 5: Tracking Progress

1. **Switch to Pending Tab**
   - See all candidates with active tests

2. **Monitor Test Status**
   - **Test Sent**: Invitation delivered
   - **In Progress**: Candidate started the test
   - **Pending**: Awaiting completion

3. **Test Information Display**
   ```
   John Doe
   john@example.com
   Senior Full Stack Developer
   
   Testing Progress
   ├─ Sent: Jan 15, 2025
   └─ Required Tests:
      • JavaScript (60min, 70% pass)
      • React (45min, 70% pass)
      • Problem Solving (30min, 65% pass)
   ```

4. **Demo Feature: Simulate Completion**
   - Click "Simulate Completion (Demo)"
   - Generates realistic test results
   - Useful for testing the system

---

### Phase 6: Viewing Results

1. **Switch to Completed Tab**
   - See all candidates who finished tests

2. **Results Summary on Card**
   ```
   Testing Progress
   ├─ Overall Score: 85%
   └─ Section Breakdown:
      • Coding Proficiency: ████████░░ 78%
      • Problem Solving:    ██████████ 92%
      • Best Practices:     ████████░░ 85%
   
   Recommendation: STRONG_YES
   ```

3. **View Full Results**
   - Click "View Full Results" button
   - Modal opens with detailed breakdown

4. **Results Modal Content**
   ```
   ┌────────────────────────────────────┐
   │      Overall Score: 85%            │
   │      Percentile: 78th              │
   └────────────────────────────────────┘
   
   Section Breakdown:
   • Coding Proficiency:     78/100  ████████░░
   • Problem Solving:        92/100  ██████████
   • Best Practices:         85/100  ████████░░
   • Code Quality:           80/100  ████████░░
   
   Time Taken: 48 minutes
   Completed: Jan 15, 2025 10:30 AM
   
   Recommendation: STRONG_YES
   ```

---

### Phase 7: Moving to Interview

1. **From Results Card**
   - Click "Move to Interview" button
   - Candidate status changes to "interview"
   - Toast notification: "Candidate moved to interview stage"

2. **From Results Modal**
   - After reviewing full details
   - Click "Move to Interview Stage" button
   - Same outcome

3. **What Happens:**
   ```
   Application Status: screening → interview
   Audit Log: "move-to-interview" event recorded
   Next Step: Candidate appears in Interview Management
   ```

---

## Test Categories Deep Dive

### Technical Tests (💻)

**JavaScript (Coding): Intermediate**
- Duration: 60 minutes
- Assesses: ES6+, async/await, promises, DOM manipulation
- Recommended for: Frontend, Full Stack roles

**React Development**
- Duration: 45 minutes
- Assesses: Components, hooks, state management, routing
- Recommended for: Frontend, Full Stack roles

**Node.js Backend**
- Duration: 50 minutes
- Assesses: Express, APIs, middleware, database integration
- Recommended for: Backend, Full Stack roles

**Python (Coding): Intermediate**
- Duration: 60 minutes
- Assesses: Data structures, algorithms, OOP, libraries
- Recommended for: Data Science, Backend roles

**Full Stack Developer**
- Duration: 90 minutes
- Comprehensive assessment of frontend + backend skills
- Recommended for: Full Stack roles

### Cognitive Tests (🧠)

**Problem Solving**
- Duration: 30 minutes
- Assesses: Analytical thinking, pattern recognition
- Recommended for: All technical roles

**Critical Thinking**
- Duration: 25 minutes
- Assesses: Logical reasoning, decision making
- Recommended for: Senior roles, leadership positions

**Numerical Reasoning**
- Duration: 20 minutes
- Assesses: Data interpretation, math skills
- Recommended for: Finance, Analytics roles

**Verbal Reasoning**
- Duration: 20 minutes
- Assesses: Reading comprehension, communication
- Recommended for: Client-facing roles

**Abstract Reasoning**
- Duration: 25 minutes
- Assesses: Pattern recognition, creative thinking
- Recommended for: Design, problem-solving roles

**Attention to Detail**
- Duration: 15 minutes
- Assesses: Accuracy, consistency, quality focus
- Recommended for: QA, Accounting roles

### Personality Tests (🎭)

**Big 5 (OCEAN) Personality**
- Duration: 20 minutes
- Assesses: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- Recommended for: Cultural fit assessment

**Emotional Intelligence**
- Duration: 25 minutes
- Assesses: Self-awareness, empathy, social skills
- Recommended for: Leadership, team roles

**Work Style Assessment**
- Duration: 15 minutes
- Assesses: Collaboration, autonomy, structure preference
- Recommended for: Team dynamics

**Leadership Potential**
- Duration: 30 minutes
- Assesses: Decision making, vision, influence
- Recommended for: Management roles

**Stress Management**
- Duration: 20 minutes
- Assesses: Resilience, coping strategies
- Recommended for: High-pressure roles

### Soft Skills Tests (🤝)

**Communication Skills**
- Duration: 20 minutes
- Assesses: Written/verbal clarity, active listening
- Recommended for: All roles

**Teamwork & Collaboration**
- Duration: 25 minutes
- Assesses: Cooperation, conflict resolution
- Recommended for: Team-based roles

**Time Management**
- Duration: 15 minutes
- Assesses: Prioritization, organization
- Recommended for: Project management roles

### Regulatory Tests (📋)

**GDPR Compliance**
- Duration: 30 minutes
- Assesses: Data protection, privacy regulations
- Recommended for: Handling user data

**Employment Law**
- Duration: 35 minutes
- Assesses: Labor regulations, compliance
- Recommended for: HR, Management roles

---

## Test Combinations by Role

### Full Stack Developer
```
✅ Required:
- JavaScript (Coding): Intermediate (70%)
- React Development (70%)
- Node.js Backend (70%)
- Problem Solving (65%)

⭕ Optional:
- Critical Thinking (60%)
- Communication Skills (60%)
```

### Senior Leadership
```
✅ Required:
- Critical Thinking (75%)
- Leadership Potential (70%)
- Emotional Intelligence (70%)

⭕ Optional:
- Stress Management (65%)
- Communication Skills (75%)
```

### Data Analyst
```
✅ Required:
- Python (Coding): Intermediate (70%)
- Numerical Reasoning (75%)
- Attention to Detail (70%)
- Problem Solving (65%)

⭕ Optional:
- Communication Skills (60%)
```

### HR Manager
```
✅ Required:
- Employment Law (75%)
- GDPR Compliance (70%)
- Emotional Intelligence (75%)
- Communication Skills (75%)

⭕ Optional:
- Leadership Potential (70%)
```

---

## API Integration

### Mock Mode (Current)
```javascript
// services/testgorilla.service.js
getMockAssessments() {
  // Returns 21 pre-configured tests
  // Works without API key
}
```

### Production Mode (Future)
```javascript
// Get real API key from TestGorilla
const TESTGORILLA_API_KEY = 'your_api_key';

async getAssessments() {
  const response = await axios.get(
    'https://api.testgorilla.com/v1/assessments',
    { headers: { 'Authorization': `Bearer ${TESTGORILLA_API_KEY}` }}
  );
  return response.data;
}
```

---

## Troubleshooting

### Tests not appearing in Test Management?
- Check that job has `requiredTests` configured
- Verify candidate status is "screening"
- Ensure job filter is set correctly

### Send tests button not working?
- Must select at least one candidate
- Check backend is running (port 5000)
- View browser console for errors

### Results not showing?
- Use "Simulate Completion" for demo
- In production, set up TestGorilla webhooks
- Check application has `testing.results` object

### Move to Interview not working?
- Verify `onMoveToInterview` callback is passed
- Check application status updates in state
- Look for audit log entry

---

## Benefits

✅ **No Duplicate Screens**: Single unified Test Management  
✅ **Auto-Assignment**: Tests selected during job creation  
✅ **Bulk Operations**: Send tests to multiple candidates at once  
✅ **Real-Time Tracking**: Monitor progress with status filters  
✅ **Detailed Results**: Section-by-section breakdown with percentiles  
✅ **Seamless Workflow**: Move to interview with one click  
✅ **Comprehensive Tests**: 21 assessments across 5 categories  
✅ **Flexible Configuration**: Mandatory/optional, custom passing scores  

---

**System Status:** ✅ Ready for Use  
**Last Updated:** January 2025  
**Documentation:** Complete
