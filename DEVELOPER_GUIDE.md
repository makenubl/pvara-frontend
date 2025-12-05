# PVARA Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Code Structure](#code-structure)
5. [Data Flow](#data-flow)
6. [Key Components](#key-components)
7. [State Management](#state-management)
8. [Email System](#email-system)
9. [Adding New Features](#adding-new-features)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

PVARA is an enterprise recruitment management system built with React. It manages the complete candidate lifecycle from application to offer, with features like:

- AI-powered candidate screening
- Sequential workflow enforcement
- Email notifications
- Audit logging
- Role-based access control
- CSV export
- Customizable email templates

**Tech Stack:**
- Frontend: React 19, TailwindCSS
- Backend: Node.js, Express (email server)
- Storage: localStorage (client-side persistence)
- Email: Nodemailer (Gmail/SendGrid/AWS SES)
- Testing: Jest, Playwright

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PVARA Frontend (React)                    │
│                                                               │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Job       │  │ HR       │  │ Test     │  │ Interview  │ │
│  │ Posting   │→ │ Review   │→ │ Mgmt     │→ │ Mgmt       │ │
│  └───────────┘  └──────────┘  └──────────┘  └────────────┘ │
│        ↓             ↓              ↓              ↓         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Shortlist → Offer Management → Audit          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   State Management (localStorage: pvara_v3)           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────┬─┘
                           │                                │
                    ┌──────▼──────┐                ┌───────▼────────┐
                    │ Email       │                │ Browser        │
                    │ Server      │                │ localStorage   │
                    │ (Optional)  │                │ (Required)     │
                    └─────────────┘                └────────────────┘
```

### Component Hierarchy

```
App
└── PvaraPhase2 (Main Orchestrator)
    ├── Header (Logo, Navigation, User Menu)
    ├── Sidebar Navigation
    │   ├── Jobs
    │   ├── Apply
    │   ├── Candidate Login
    │   ├── Dashboard
    │   ├── Admin Panel
    │   ├── HR Review (CandidateList)
    │   ├── Test Management
    │   ├── Interview Management
    │   ├── Shortlists
    │   ├── Offer Management
    │   ├── Audit Log
    │   └── Settings
    └── Main Content Area (view-based routing)
        ├── JobList
        ├── ApplicationForm
        ├── CandidateLogin
        ├── MyCandidateApplications
        ├── AnalyticsDashboard
        ├── CandidateList (HR Review)
        ├── TestManagement
        ├── InterviewManagement
        ├── ShortlistPanel
        ├── OfferManagement
        ├── AuditLog
        └── Settings
```

---

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/makenubl/pvara-frontend.git
cd pvara-frontend

# Install dependencies
npm install

# Start development server (frontend only)
npm start

# Start both frontend + email server
npm run dev

# Run tests
npm test

# Run E2E tests
npx playwright test

# Build for production
npm run build
```

### Environment Variables

Create `.env` file:

```env
# Email Configuration (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

### Demo Accounts

```javascript
// Admin
Username: demo
Password: demo123

// HR User
Username: hr
Password: hr123

// Recruiter
Username: recruiter
Password: rec123
```

---

## Code Structure

```
pvara-frontend/
├── src/
│   ├── PvaraPhase2.jsx          # Main app orchestrator
│   ├── Settings.jsx              # Email template editor
│   ├── TestManagement.jsx        # Test invitation & results
│   ├── InterviewManagement.jsx   # Interview feedback system
│   ├── OfferManagement.jsx       # Job offer management
│   ├── ShortlistPanel.jsx        # Shortlist management
│   ├── CandidateList.jsx         # HR review (10 features)
│   ├── JobList.jsx               # Job CRUD operations
│   ├── ApplicationForm.jsx       # Candidate application form
│   ├── AuditLog.jsx              # Compliance audit trail
│   ├── AuthContext.jsx           # Authentication provider
│   ├── ToastContext.jsx          # Toast notifications
│   ├── aiScreening.js            # AI candidate evaluation
│   └── index.js                  # Entry point
├── server.js                     # Email backend server
├── .env.example                  # Environment template
├── EMAIL_SETUP.md                # Email configuration guide
├── DEVELOPER_GUIDE.md            # This file
└── README.md                     # Quick start guide
```

---

## Data Flow

### State Structure

```javascript
state = {
  jobs: [                        // Job postings
    {
      id: "job-123",
      title: "Senior Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      deadline: "2025-12-31",
      description: "...",
      requirements: "...",
      salary: { min: 100000, max: 150000, currency: "USD" },
      createdAt: "2025-01-01T00:00:00Z"
    }
  ],
  
  applications: [                // Candidate applications
    {
      id: "app-456",
      jobId: "job-123",
      status: "submitted",        // See status flow below
      applicant: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        cnic: "12345-1234567-1",
        degree: "BS Computer Science",
        experienceYears: 5
      },
      aiScore: 85,                // 0-100
      aiRecommendation: "strong-yes",
      testResults: {              // Added after test sent
        status: "completed",
        score: 90,
        passed: true,
        notes: "Excellent performance"
      },
      interviewFeedback: {        // Added after interview
        technicalRating: 5,
        communicationRating: 4,
        cultureFitRating: 5,
        overallScore: 4.7,
        recommendation: "hire",
        comments: "Strong candidate",
        interviewer: "Jane Smith",
        timestamp: "2025-01-15T10:00:00Z"
      },
      offer: {                    // Added when offer extended
        salary: "$120,000",
        startDate: "2025-02-01",
        benefits: "Full benefits package",
        notes: "Negotiated salary",
        status: "pending",        // pending/accepted/declined
        extendedAt: "2025-01-20T00:00:00Z",
        extendedBy: "Admin User"
      },
      notes: [                    // Internal HR notes
        {
          id: "note-789",
          text: "Strong technical skills",
          author: "HR Manager",
          timestamp: "2025-01-10T00:00:00Z"
        }
      ],
      createdAt: "2025-01-01T00:00:00Z"
    }
  ],
  
  shortlists: [                   // Candidate shortlists
    {
      id: "sl-101",
      name: "Top Candidates Q1",
      items: ["app-456"],         // Application IDs
      createdAt: "2025-01-15T00:00:00Z"
    }
  ],
  
  hrUsers: [                      // HR user accounts (admin-managed)
    {
      id: "hr-001",
      username: "hr.john",
      password: "hashed",         // In production, hash passwords!
      name: "John HR",
      createdAt: "2025-01-01T00:00:00Z"
    }
  ],
  
  audit: [                        // Audit trail for compliance
    {
      timestamp: "2025-01-01T10:30:00Z",
      user: "admin",
      action: "create-job",
      details: { jobId: "job-123", title: "Senior Developer" }
    }
  ],
  
  toasts: []                      // Toast notifications (transient)
}
```

### Status Flow

```
submitted → screening → test-invited → interview → shortlisted → offer
                ↓             ↓            ↓            ↓           ↓
            rejected      rejected     rejected     rejected   accepted/declined
```

**Status Definitions:**
- `submitted` - Initial application state
- `screening` - AI screening complete, awaiting HR review
- `test-invited` - Test invitation sent
- `interview` - Test passed, ready for interview
- `shortlisted` - Interview complete, added to shortlist
- `offer` - Job offer extended
- `rejected` - Rejected at any stage

---

## Key Components

### PvaraPhase2.jsx (Main Orchestrator)

**Responsibilities:**
- State management and persistence
- View routing (view-based SPA)
- Handler functions for all CRUD operations
- Email notification triggers
- Audit logging
- Toast notifications

**Key Handlers:**
```javascript
// Job Management
createJob(jobData)
editJob(jobId, updates)
deleteJob(jobId)

// Application Management
handleSendTest(candidateIds)           // Send test invitations
handleRecordTestResult(candidateId, results)
handleInterviewFeedback(candidateId, feedback)
handleAddToShortlist(shortlistId, candidateIds)
handleExtendOffer(candidateId, offerDetails)
handleWithdrawOffer(candidateId)
handleReject(candidateId)

// Bulk Operations
handleBulkAction(action, candidateIds)

// Export
handleExport(candidates)               // CSV export
```

### CandidateList.jsx (HR Review - 10 Features)

**Features:**
1. Bulk selection with checkboxes
2. Floating action toolbar
3. Internal notes system
4. Side-by-side comparison (2-4 candidates)
5. CSV export
6. Two-panel job filtering
7. Status filter buckets
8. Batch AI screening
9. Real-time search
10. Interview feedback form

**Usage:**
```jsx
<CandidateList
  applications={state.applications}
  jobs={state.jobs}
  onSendTest={handleSendTest}
  onRecordTestResult={handleRecordTestResult}
  onInterviewFeedback={handleInterviewFeedback}
  onAddToShortlist={handleAddToShortlist}
  onReject={handleReject}
  onUpdateNotes={handleUpdateNotes}
  onExport={handleExport}
/>
```

### TestManagement.jsx

**Purpose:** Manage test invitations and record results

**Features:**
- Send test invitations (bulk or individual)
- Record test results (score, pass/fail, notes)
- Auto-progression: pass → interview, fail → rejected
- Job-grouped candidate display
- Status filtering

### InterviewManagement.jsx

**Purpose:** Collect and manage interview feedback

**Features:**
- 3-rating system (Technical, Communication, Culture Fit)
- Overall score calculation
- Hire/Maybe/No-Hire recommendation
- Bulk add to shortlist
- Edit existing feedback

### OfferManagement.jsx

**Purpose:** Extend and manage job offers

**Features:**
- Offer creation (salary, start date, benefits)
- Offer status tracking (pending/accepted/declined)
- Edit and withdraw offers
- Complete candidate history display

### Settings.jsx

**Purpose:** Customize email templates

**Features:**
- Visual template editor
- Variable system ({{candidateName}}, etc.)
- Live preview
- Reset to defaults
- Email sender configuration

---

## State Management

### LocalStorage Persistence

All state is automatically persisted to localStorage:

```javascript
// Automatic save on every state change
useEffect(() => {
  saveState(state);
}, [state]);

// Load on mount
useEffect(() => {
  const loaded = loadState();
  if (loaded) setState(loaded);
}, []);
```

### Storage Keys

```javascript
'pvara_v3'                 // Main application state
'pvara_email_templates'    // Custom email templates
'pvara_email_settings'     // Email sender configuration
'PVARA_EMAILS'             // Email log (debugging)
```

### State Updates

Always use functional updates to ensure latest state:

```javascript
// ✅ Correct
setState(prevState => ({
  ...prevState,
  applications: prevState.applications.map(app =>
    app.id === candidateId
      ? { ...app, status: 'interview' }
      : app
  )
}));

// ❌ Wrong - may use stale state
setState({
  ...state,
  applications: state.applications.map(...)
});
```

---

## Email System

### Architecture

```
Frontend                Backend              Email Service
  ↓                       ↓                      ↓
sendEmailNotification → /api/send-email-template → Nodemailer
  ↓                       ↓                      ↓
Custom Templates    Variable Replacement    Gmail/SendGrid
  ↓                       ↓                      ↓
localStorage        {{candidateName}}       SMTP Send
```

### Sending Emails

```javascript
// Automatically called by handlers
await sendEmailNotification(
  'john@example.com',
  'TEST_INVITED',
  {
    candidateName: 'John Doe',
    jobTitle: 'Senior Developer'
  }
);
```

### Custom Templates

Templates stored in localStorage, loaded by Settings page:

```javascript
{
  "APPLICATION_RECEIVED": {
    "subject": "Welcome {{candidateName}}!",
    "body": "Dear {{candidateName}},\n\nThank you for applying..."
  }
}
```

### Variable Replacement

Backend automatically replaces variables:

```javascript
const replaceVariables = (text) => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data?.[key] || match;
  });
};
```

---

## Adding New Features

### Example: Add "Screening Notes" Feature

**Step 1: Update State Structure**

```javascript
// In PvaraPhase2.jsx default state
applications: [
  {
    // ... existing fields
    screeningNotes: ""  // Add new field
  }
]
```

**Step 2: Create Handler**

```javascript
const handleUpdateScreeningNotes = useCallback((candidateId, notes) => {
  setState(prevState => ({
    ...prevState,
    applications: prevState.applications.map(app =>
      app.id === candidateId
        ? { ...app, screeningNotes: notes }
        : app
    )
  }));
  
  audit("update-screening-notes", { candidateId });
  addToast("Screening notes updated", { type: "success" });
}, [audit, addToast]);
```

**Step 3: Add UI**

```jsx
// In CandidateList.jsx or create new component
<textarea
  value={candidate.screeningNotes || ''}
  onChange={(e) => onUpdateScreeningNotes(candidate.id, e.target.value)}
  className="..."
  placeholder="Add screening notes..."
/>
```

**Step 4: Pass Handler**

```jsx
// In PvaraPhase2.jsx
<CandidateList
  // ... existing props
  onUpdateScreeningNotes={handleUpdateScreeningNotes}
/>
```

**Step 5: Add Audit Logging**

```javascript
audit("update-screening-notes", {
  candidateId,
  timestamp: new Date().toISOString()
});
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- PvaraPhase2.test.js

# Run with coverage
npm test -- --coverage
```

### E2E Tests (Playwright)

```bash
# Install browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run specific test
npx playwright test tests/e2e.spec.js

# Open UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### Manual Testing Checklist

- [ ] Create job posting
- [ ] Submit application
- [ ] AI screening runs
- [ ] Send test invitation
- [ ] Record test results
- [ ] Add interview feedback
- [ ] Add to shortlist
- [ ] Extend offer
- [ ] Check audit log
- [ ] Customize email template
- [ ] Export CSV
- [ ] Test email notifications

---

## Deployment

### Frontend (Netlify)

```bash
# Build production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build

# Or connect GitHub repo for auto-deploy
```

### Backend (Heroku/Railway/Render)

```bash
# Deploy email server
git push heroku main

# Set environment variables
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password

# Check logs
heroku logs --tail
```

### Environment Variables (Production)

```env
# Frontend
REACT_APP_API_URL=https://your-backend.herokuapp.com

# Backend
EMAIL_USER=recruitment@your-company.com
EMAIL_PASSWORD=your-app-password
PORT=5000
NODE_ENV=production
```

---

## Troubleshooting

### Common Issues

**1. State not persisting**
- Check localStorage quota (5-10MB limit)
- Clear storage: `localStorage.clear()`
- Check console for errors

**2. Emails not sending**
- Verify backend is running: `npm run server`
- Check .env configuration
- Test with curl: `curl http://localhost:5000/health`
- Check Gmail App Password settings

**3. Build errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf build && npm run build`
- Check Node version: `node --version` (requires 16+)

**4. Status progression not working**
- Check handler functions in PvaraPhase2.jsx
- Verify status values match expected strings
- Check audit log for errors

**5. Role-based access issues**
- Check user role in auth context
- Verify hasRole() function logic
- Check sidebar button conditions

### Debug Tools

```javascript
// In browser console

// View entire state
JSON.parse(localStorage.getItem('pvara_v3'))

// View email templates
JSON.parse(localStorage.getItem('pvara_email_templates'))

// View email log
JSON.parse(localStorage.getItem('PVARA_EMAILS'))

// Clear all data
localStorage.clear()

// Check state size
new Blob([localStorage.getItem('pvara_v3')]).size + ' bytes'
```

### Performance Optimization

```javascript
// Use React.memo for expensive components
const CandidateCard = React.memo(({ candidate }) => {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.candidate.id === nextProps.candidate.id;
});

// Use useCallback for handlers passed as props
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Use useMemo for expensive calculations
const filteredCandidates = useMemo(() => {
  return applications.filter(app => app.status === 'interview');
}, [applications]);
```

---

## Best Practices

### Code Style

```javascript
// Use descriptive variable names
const candidateApplications = applications.filter(...)  // ✅
const apps = applications.filter(...)                   // ❌

// Always add comments for complex logic
// Calculate average interview score across all ratings
const avgScore = (technical + communication + cultureFit) / 3;

// Use async/await instead of .then()
const result = await sendEmail(...)  // ✅
sendEmail(...).then(...)             // ❌

// Destructure props
const { applications, jobs, onSendTest } = props;  // ✅
```

### State Management

```javascript
// Keep state flat when possible
// ✅ Good
applications: [{ id: 1, status: 'interview' }]

// ❌ Avoid deep nesting
applications: { byId: { 1: { data: { status: 'interview' }}}}

// Use functional updates
setState(prev => ({ ...prev, count: prev.count + 1 }))  // ✅
setState({ ...state, count: state.count + 1 })          // ❌
```

### Error Handling

```javascript
// Always handle errors gracefully
try {
  await sendEmail(...)
} catch (error) {
  console.error('Email failed:', error);
  addToast('Email could not be sent', { type: 'error' });
}

// Validate input
if (!candidateId || !offerDetails.salary) {
  addToast('Missing required fields', { type: 'error' });
  return;
}
```

---

## API Reference

### PvaraPhase2 Props

The main component doesn't receive props, but manages all state internally.

### CandidateList Props

```typescript
interface CandidateListProps {
  applications: Application[];
  jobs: Job[];
  onSendTest: (candidateIds: string[]) => void;
  onRecordTestResult: (candidateId: string, results: TestResults) => void;
  onInterviewFeedback: (candidateId: string, feedback: InterviewFeedback) => void;
  onAddToShortlist: (candidateId: string, shortlistName: string) => void;
  onReject: (candidateId: string) => void;
  onUpdateNotes: (candidateId: string, notes: Note[]) => void;
  onExport: (candidates: Application[]) => void;
}
```

### Email Notification Function

```typescript
async function sendEmailNotification(
  to: string,
  templateType: 'APPLICATION_RECEIVED' | 'TEST_INVITED' | 'APPLICATION_SHORTLISTED' | 'OFFER_EXTENDED',
  data: {
    candidateName: string;
    jobTitle: string;
    salary?: string;
    date?: string;
    time?: string;
  }
): Promise<boolean>
```

---

## Resources

- [React Documentation](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Nodemailer](https://nodemailer.com/)
- [Playwright Testing](https://playwright.dev/)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## Support

For issues or questions:
1. Check this guide
2. Review EMAIL_SETUP.md for email issues
3. Check console logs for errors
4. Review audit log in application
5. Clear localStorage and test with fresh data

---

**Last Updated:** December 2025
**Version:** 2.0
