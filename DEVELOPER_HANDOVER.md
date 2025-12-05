# PVARA Recruitment Portal - Developer Handover Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Workflow System](#workflow-system)
4. [Key Components](#key-components)
5. [State Management](#state-management)
6. [Setup Instructions](#setup-instructions)
7. [Deployment](#deployment)
8. [Feature Details](#feature-details)
9. [Code Standards](#code-standards)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**PVARA Recruitment Portal** is a complete end-to-end recruitment management system built with React. It manages the entire candidate journey from application submission to job offer acceptance.

### Technology Stack
- **Frontend**: React 18+ (Hooks-based, functional components)
- **Styling**: Tailwind CSS (utility-first with custom glass-morphism effects)
- **State**: localStorage persistence (key: `pvara_v3`)
- **Authentication**: Role-based access control (Admin, HR, Recruiter roles)
- **No Backend**: Fully client-side application (ready for API integration)

### Current Branch
- **Main Branch**: `main`
- **Latest Feature**: `feature/recruitment-workflow-complete`

---

## 🏗️ Architecture

### File Structure
```
src/
├── PvaraPhase2.jsx              # Main app container with routing & state
├── AuthContext.jsx              # Authentication & role management
├── ToastContext.jsx             # Global notification system
├── SettingsPanel.jsx            # System configuration (NEW)
├── TestManagement.jsx           # Stage 3: Test management
├── InterviewManagement.jsx      # Stage 4: Interview scheduling & feedback
├── OfferManagement.jsx          # Stage 5: Job offer management
├── CandidateList.jsx            # Reusable candidate list with filters
├── JobList.jsx                  # Job posting management (Admin)
├── ApplicationForm.jsx          # Public job application form
├── MyCandidateApplications.jsx  # Candidate portal
├── CandidateLogin.jsx           # Candidate authentication
├── AuditLog.jsx                 # System audit trail
├── aiScreening.js               # AI evaluation logic
└── index.css                    # Global styles + Tailwind

public/
├── index.html
├── manifest.json
└── robots.txt
```

### Design Patterns
1. **Single State Container**: All state managed in `PvaraPhase2.jsx`
2. **Prop Drilling**: Parent-to-child data flow (consider Context API for future refactoring)
3. **localStorage Persistence**: Auto-save on every state change
4. **Role-Based Views**: Conditional rendering based on user roles
5. **Component Composition**: Reusable components with props

---

## 🔄 Workflow System

### 5-Stage Sequential Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌──────┐    ┌───────────┐    ┌───────┐
│  HR Review  │ -> │ AI Screening │ -> │ Test │ -> │ Interview │ -> │ Offer │
│  (Stage 1)  │    │  (Stage 2)   │    │ (3)  │    │   (4)     │    │  (5)  │
└─────────────┘    └──────────────┘    └──────┘    └───────────┘    └───────┘
```

### Stage Transitions (Automatic)

| From Stage | To Stage | Trigger | Status Change |
|------------|----------|---------|---------------|
| New Application | HR Review | Submit | `submitted` |
| HR Review | AI Screening | HR Action | `screening` |
| AI Screening | Test | AI Score ≥60 | `screening` (ready for test) |
| Test | Interview | Test Pass (≥70%) | `interview` |
| Test | Rejected | Test Fail (<70%) | `rejected` |
| Interview | Offer | Score ≥7.0 OR Hire | Eligible for offer |
| Offer | Hired | Candidate Accepts | `offer.status: accepted` |

### Status Codes
```javascript
// Application Status
'submitted'      // New application
'screening'      // Being reviewed/AI screened
'test-invited'   // Test sent to candidate
'interview'      // Interview stage
'phone-interview' // Phone interview variant
'offer'          // Offer extended
'rejected'       // Rejected at any stage

// Offer Status
offer.status: 'pending' | 'accepted' | 'rejected'

// Test Status
testResults.status: 'invited' | 'in-progress' | 'completed'
```

---

## 🧩 Key Components

### 1. PvaraPhase2.jsx (Main Container)
**Purpose**: Central state management and routing

**Key Functions**:
```javascript
// Application Management
changeApplicationStatus(id, newStatus)  // Change candidate status
submitApplication(formData)             // New application submission
handleBulkAction(ids, action)           // Bulk status changes

// AI & Evaluation
handleAIEvaluation()                    // Batch AI screening
batchEvaluateApplications(apps)         // AI scoring logic

// Test Management
onSendTest(candidateIds)                // Send test invitations
onRecordTestResult(id, results)         // Record pass/fail + auto-progression

// Interview Management
onInterviewFeedback(id, feedback)       // Save interview ratings

// Offer Management
onExtendOffer(id, offerDetails)         // Create job offer
onAcceptOffer(id)                       // Mark offer accepted
onRejectOffer(id)                       // Mark offer rejected
onWithdrawOffer(id)                     // Withdraw offer

// Audit Trail
audit(action, details)                  // Log all actions
```

**State Structure**:
```javascript
{
  jobs: [...],                // Job postings
  applications: [...],        // All candidate applications
  audit: [...],              // Audit trail
  toasts: [...],             // Notifications
  settings: {
    email: {...},            // SMTP configuration
    emailTemplates: {...},   // 6 email templates
    scoring: {...},          // Weight configuration
    system: {...}            // Automation toggles
  }
}
```

### 2. TestManagement.jsx (Stage 3)
**Purpose**: Manage candidate testing phase

**Features**:
- Send test invitations (bulk or individual)
- Track test status (invited → completed)
- Record test results with pass/fail
- **Auto-progression**: Pass (≥70%) → Interview, Fail → Rejected

**Props**:
```javascript
{
  applications: Array,
  jobs: Array,
  onSendTest: Function(candidateIds),
  onRecordTestResult: Function(id, {score, passed, notes})
}
```

**Key Logic**:
```javascript
// Automatic progression on test result recording
const newStatus = results.passed ? 'interview' : 'rejected';
// Update application with test results + new status
```

### 3. InterviewManagement.jsx (Stage 4)
**Purpose**: Conduct interviews and collect feedback

**Features**:
- Schedule interviews (metadata only, no calendar integration yet)
- Collect 4-category ratings (Technical, Communication, Culture Fit, Problem Solving)
- Calculate overall score (average of 4 categories)
- Determine offer eligibility (score ≥7.0 OR "Hire" recommendation)

**Props**:
```javascript
{
  applications: Array,
  jobs: Array,
  onInterviewFeedback: Function(id, {
    technicalRating: 1-10,
    communicationRating: 1-10,
    cultureFitRating: 1-10,
    problemSolvingRating: 1-10,
    recommendation: 'hire' | 'maybe' | 'reject',
    notes: String
  })
}
```

**Offer Eligibility Logic**:
```javascript
const isEligible = 
  feedback.recommendation === 'hire' || 
  overallScore >= 7.0;
```

### 4. OfferManagement.jsx (Stage 5 - Final)
**Purpose**: Extend and manage job offers

**Features**:
- Show eligible candidates (interview score ≥7.0 OR hire recommendation)
- Extend offers with salary, start date, benefits
- Track offer status (pending → accepted/rejected)
- Action buttons: Accept, Reject, Withdraw, Revise

**Props**:
```javascript
{
  applications: Array,
  jobs: Array,
  onExtendOffer: Function(id, {salary, startDate, benefits, notes}),
  onAcceptOffer: Function(id),
  onRejectOffer: Function(id),
  onWithdrawOffer: Function(id)
}
```

### 5. SettingsPanel.jsx (NEW)
**Purpose**: System configuration

**5 Tabs**:
1. **Email**: SMTP configuration (Gmail, SendGrid, Custom)
2. **Templates**: 6 editable email templates
3. **Users**: User management (Admin/HR display)
4. **Scoring**: AI scoring weights (Education: 40%, Experience: 40%, Interview: 20%)
5. **System**: Automation toggles

**Email Templates**:
```javascript
{
  applicationReceived: {subject, body},
  shortlisted: {subject, body},
  testInvitation: {subject, body},
  interviewScheduled: {subject, body},
  offerExtended: {subject, body},
  rejection: {subject, body}
}
```

**Template Variables**:
- `{candidateName}` - Full name
- `{jobTitle}` - Position applied for
- `{date}`, `{time}`, `{location}` - Interview details
- `{salary}`, `{startDate}` - Offer details
- `{testLink}` - Assessment URL

### 6. CandidateList.jsx
**Purpose**: Reusable candidate table with filters

**Features**:
- Search (name, email, CNIC, degree, phone)
- Status filters (New, Screening, Interview, Offer, Rejected)
- Bulk actions (Move to AI Screening, Reject, Compare)
- AI Score display
- Top 10% filter (based on AI scores)
- Notes system (internal HR notes)
- Comparison modal (up to 4 candidates)

**Props**:
```javascript
{
  candidates: Array,
  onStatusChange: Function(id, status),
  onAIEvaluate: Function(),
  onBulkAction: Function(ids, action),
  onAddNote: Function(id, note),
  onExport: Function(candidates),
  onMoveToTest: Function(ids),      // NEW - for HR Review
  showStageActions: Boolean          // NEW - show stage-specific actions
}
```

---

## 💾 State Management

### localStorage Schema
```javascript
// Key: "pvara_v3"
{
  jobs: [
    {
      id: "job-xxx",
      title: String,
      department: String,
      grade: String,
      description: String,
      locations: Array<String>,
      openings: Number,
      employmentType: "Full-time" | "Part-time" | "Contract",
      salary: {min: Number, max: Number},
      status: "open" | "closed",
      createdAt: ISO String,
      fields: {
        degreeRequired: {value: String, mandatory: Boolean},
        minExperience: {value: Number, mandatory: Boolean},
        uploads: {value: {cv: Boolean, coverLetter: Boolean}, mandatory: Boolean}
      }
    }
  ],
  applications: [
    {
      id: "app-xxx",
      jobId: String,
      status: String,
      submittedAt: ISO String,
      applicant: {
        name: String,
        email: String,
        phone: String,
        cnic: String,
        degree: String,
        experienceYears: Number,
        cv: String,           // File path or data URL
        coverLetter: String   // Optional
      },
      aiScore: Number,        // 0-100
      aiRecommendation: String,
      testResults: {
        status: String,
        score: Number,        // 0-100
        passed: Boolean,      // ≥70%
        notes: String,
        recorded: Boolean,
        completedAt: ISO String
      },
      interviewFeedback: {
        technicalRating: Number,      // 1-10
        communicationRating: Number,  // 1-10
        cultureFitRating: Number,     // 1-10
        problemSolvingRating: Number, // 1-10
        overallScore: String,         // Calculated average
        recommendation: String,       // 'hire' | 'maybe' | 'reject'
        notes: String,
        timestamp: ISO String
      },
      offer: {
        status: String,       // 'pending' | 'accepted' | 'rejected'
        salary: String,
        startDate: ISO String,
        benefits: String,
        notes: String,
        extendedAt: ISO String
      },
      notes: [
        {
          id: String,
          text: String,
          author: String,
          timestamp: ISO String
        }
      ]
    }
  ],
  audit: [
    {
      id: String,
      action: String,
      details: Object,
      timestamp: ISO String,
      user: String
    }
  ],
  settings: {
    email: {
      enabled: Boolean,
      provider: 'gmail' | 'sendgrid' | 'custom',
      smtpHost: String,
      smtpPort: String,
      smtpUser: String,
      smtpPassword: String,
      fromEmail: String,
      fromName: String
    },
    emailTemplates: {
      applicationReceived: {subject: String, body: String},
      shortlisted: {subject: String, body: String},
      testInvitation: {subject: String, body: String},
      interviewScheduled: {subject: String, body: String},
      offerExtended: {subject: String, body: String},
      rejection: {subject: String, body: String}
    },
    scoring: {
      education: Number,    // % weight (default 40)
      experience: Number,   // % weight (default 40)
      interview: Number     // % weight (default 20)
      // Total must = 100
    },
    system: {
      autoEmailOnSubmit: Boolean,
      autoEmailOnStatusChange: Boolean,
      requireApprovalForOffers: Boolean,
      allowCandidateWithdrawal: Boolean
    }
  },
  toasts: []  // Temporary notifications
}
```

### State Persistence
- **Auto-save**: Every `setState()` call triggers `localStorage.setItem()`
- **Auto-load**: Initial state loaded from localStorage on mount
- **Fallback**: If no saved state, `defaultState()` generates sample data

---

## 🚀 Setup Instructions

### Prerequisites
```bash
node >= 14.x
npm >= 6.x
```

### Installation
```bash
# Clone repository
git clone https://github.com/makenubl/pvara-frontend.git
cd pvara-frontend

# Checkout latest feature branch
git checkout feature/recruitment-workflow-complete

# Install dependencies
npm install

# Start development server
npm start
# App runs on http://localhost:3000
```

### Environment Variables
Currently none required (fully client-side). For future API integration, create `.env`:
```bash
REACT_APP_API_URL=https://api.pvara.com
REACT_APP_SMTP_ENDPOINT=/api/send-email
```

### Build for Production
```bash
npm run build
# Creates optimized build in /build directory
```

---

## 🌐 Deployment

### Netlify (Recommended)
1. **Connect Repository**: Link GitHub repo to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Deploy**: Automatic on push to `main`

### Configuration
**netlify.toml** (already included):
```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Manual Deploy
```bash
npm run build
npx netlify-cli deploy --prod --dir=build
```

### Other Platforms
- **Vercel**: Connect GitHub → Auto-deploy
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3 + CloudFront**: Upload build/ folder

---

## ✨ Feature Details

### 1. Role-Based Access Control

**Roles**:
```javascript
// Admin: Full access (create jobs, manage users, view all)
'admin'

// HR: Recruitment workflow (review, test, interview, offer)
'hr'

// Recruiter: Limited access (view candidates, add notes)
'recruiter'

// Candidate: Public access (browse jobs, apply, track)
null (unauthenticated)
```

**Login Credentials** (Demo):
```javascript
// Username = Role, Password = anything
admin / any-password
hr / any-password
recruiter / any-password
viewer / any-password
```

**Access Matrix**:
| Feature | Admin | HR | Recruiter | Candidate |
|---------|-------|----|-----------| --------- |
| Browse Jobs | ✅ | ✅ | ✅ | ✅ |
| Apply for Jobs | ✅ | ✅ | ✅ | ✅ |
| Track Applications | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Jobs | ✅ | ❌ | ❌ | ❌ |
| HR Review | ✅ | ✅ | ✅ | ❌ |
| Test Management | ✅ | ✅ | ✅ | ❌ |
| Interview Management | ✅ | ✅ | ✅ | ❌ |
| Offer Management | ✅ | ✅ | ✅ | ❌ |
| Settings | ✅ | ✅ | ✅ | ❌ |
| Audit Log | ✅ | ✅ | ❌ | ❌ |

### 2. AI Screening System

**Algorithm** (`aiScreening.js`):
```javascript
// 1. Fuzzy keyword matching (job description vs candidate profile)
const keywords = extractKeywords(jobDescription);
const matches = keywords.filter(kw => 
  candidateText.includes(kw)
).length;

// 2. Education scoring (40%)
const educationScore = 
  degreeLevel === required ? 100 :
  degreeLevel > required ? 90 :
  degreeLevel < required ? 30 : 0;

// 3. Experience scoring (40%)
const expScore = 
  candidateYears >= requiredYears ? 100 :
  candidateYears / requiredYears * 100;

// 4. Final score (weighted)
const aiScore = 
  (educationScore * 0.4) + 
  (expScore * 0.4) + 
  (keywordMatchScore * 0.2);

// 5. Recommendation
const recommendation = 
  aiScore >= 75 ? "Strong Match" :
  aiScore >= 60 ? "Good Match" :
  aiScore >= 40 ? "Potential Match" :
  "Weak Match";
```

**Customization**:
Edit weights in Settings → Scoring tab

### 3. Email System (Ready for Integration)

**Current State**: UI complete, templates editable, no actual sending

**Integration Steps**:
1. Set up backend email service (Node.js + Nodemailer or SendGrid API)
2. Add API endpoint: `POST /api/send-email`
3. Update `SettingsPanel.jsx` test email function:
```javascript
const handleTestEmail = async () => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      to: settings.email.fromEmail,
      subject: 'Test Email',
      body: 'SMTP configuration is working!'
    })
  });
  // Handle response
};
```

**Template Variables Replacement**:
```javascript
function fillTemplate(template, data) {
  return template
    .replace(/{candidateName}/g, data.name)
    .replace(/{jobTitle}/g, data.jobTitle)
    .replace(/{date}/g, data.date)
    .replace(/{time}/g, data.time)
    // ... etc
}
```

### 4. Audit Trail

**Logged Actions**:
- Job creation/editing/deletion
- Application status changes
- Test sending/result recording
- Interview feedback submission
- Offer extension/acceptance/rejection
- Settings changes

**Audit Entry Format**:
```javascript
{
  id: uuid(),
  action: 'send-test',
  details: {candidateId: 'xxx', testId: 'yyy'},
  timestamp: new Date().toISOString(),
  user: currentUser.username
}
```

**View**: Audit Log page (Admin & HR only)

### 5. Candidate Portal

**Features**:
- Browse all open job postings
- Apply with CV upload
- Track application status in real-time
- View interview schedules
- See offer details

**Login**: CNIC-based authentication (demo: any CNIC works)

---

## 📝 Code Standards

### Component Structure
```javascript
/**
 * ComponentName - Brief description
 * 
 * @param {Object} props - Component props
 * @param {Array} props.data - Description
 * @param {Function} props.onAction - Description
 */
function ComponentName({ data, onAction }) {
  // 1. State declarations
  const [state, setState] = useState(initialValue);
  
  // 2. Refs
  const ref = useRef(null);
  
  // 3. Context
  const { user } = useAuth();
  
  // 4. Memoized values
  const computed = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  // 5. Callbacks
  const handleClick = useCallback(() => {
    // logic
  }, [dependencies]);
  
  // 6. Effects
  useEffect(() => {
    // side effects
    return () => {
      // cleanup
    };
  }, [dependencies]);
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### Naming Conventions
- **Components**: PascalCase (`TestManagement.jsx`)
- **Functions**: camelCase (`handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_KEY`)
- **CSS Classes**: kebab-case (`glass-button`)
- **Props**: camelCase (`onStatusChange`)

### State Updates
```javascript
// ❌ BAD - Direct mutation
state.applications[0].status = 'new';

// ✅ GOOD - Immutable update
setState(prev => ({
  ...prev,
  applications: prev.applications.map(app =>
    app.id === targetId 
      ? {...app, status: 'new'}
      : app
  )
}));
```

### Error Handling
```javascript
try {
  // risky operation
  const result = await someAsyncOperation();
  addToast('Success!', {type: 'success'});
} catch (error) {
  console.error('Operation failed:', error);
  addToast('Failed: ' + error.message, {type: 'error'});
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. State Not Persisting
**Symptom**: Data resets on page refresh

**Solution**:
- Check browser console for localStorage errors
- Verify `STORAGE_KEY = "pvara_v3"`
- Clear localStorage and reload: `localStorage.clear()`

#### 2. Toast Notifications Not Showing
**Symptom**: No success/error messages

**Solution**:
- Ensure `ToastContext` wraps entire app
- Check `Toasts.jsx` component is rendered
- Verify `addToast()` is called with correct params

#### 3. Role-Based Views Not Working
**Symptom**: Can't access certain pages

**Solution**:
- Check login credentials (username = role)
- Verify `AuthContext.hasRole()` logic
- Console log `user` object to debug

#### 4. AI Screening Not Scoring
**Symptom**: All candidates show "N/A" for AI score

**Solution**:
- Click "AI Screen All" button in HR Review
- Check `aiScreening.js` for errors
- Ensure job description has keywords

#### 5. Candidate Not Progressing to Next Stage
**Symptom**: Status doesn't change after action

**Solution**:
- Verify automatic progression logic in handlers
- Check test score threshold (≥70% to pass)
- Check interview score (≥7.0 for offer eligibility)
- Look at browser console for errors

### Debug Mode
Add to `PvaraPhase2.jsx`:
```javascript
useEffect(() => {
  console.log('Current State:', state);
}, [state]);
```

### Reset Application
```javascript
// In browser console:
localStorage.removeItem('pvara_v3');
window.location.reload();
```

---

## 🔐 Security Considerations

### Current Limitations (Client-Side App)
1. **No Real Authentication**: Demo auth only, easily bypassable
2. **Data Exposure**: All data visible in localStorage
3. **No API Security**: No JWT, sessions, or CSRF protection
4. **File Upload**: Currently stores as base64 (memory intensive)

### Recommended Backend Implementation
```javascript
// Authentication
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

// Jobs
GET /api/jobs
POST /api/jobs (admin only)
PUT /api/jobs/:id (admin only)
DELETE /api/jobs/:id (admin only)

// Applications
GET /api/applications (HR+)
POST /api/applications (public)
PUT /api/applications/:id/status (HR+)
POST /api/applications/:id/test-result (HR+)
POST /api/applications/:id/interview-feedback (HR+)
POST /api/applications/:id/offer (HR+)

// File Uploads
POST /api/upload/cv
POST /api/upload/cover-letter
GET /api/files/:id (authenticated)

// Email
POST /api/email/send

// Audit
GET /api/audit (admin only)
```

### Environment Variables for Production
```bash
REACT_APP_API_BASE_URL=https://api.pvara.com
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_SENTRY_DSN=xxx
```

---

## 📊 Performance Optimization

### Current Optimizations
1. **React.memo**: Used in `CandidateList` sub-components
2. **useCallback**: Prevents unnecessary re-renders
3. **useMemo**: Expensive calculations cached
4. **Lazy Loading**: Consider for future routes

### Potential Improvements
```javascript
// 1. Code splitting
const TestManagement = React.lazy(() => import('./TestManagement'));

// 2. Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

// 3. Debounced search
import { debounce } from 'lodash';
const debouncedSearch = debounce(handleSearch, 300);

// 4. IndexedDB instead of localStorage
// For large file storage (CVs, etc.)

// 5. Service Worker for offline support
// PWA capabilities
```

---

## 🎨 UI/UX Guidelines

### Color Palette
```css
/* Primary */
--green-700: #15803d  /* Primary actions, active states */
--green-600: #16a34a  /* Buttons, success */
--green-50: #f0fdf4   /* Backgrounds */

/* Secondary */
--blue-600: #2563eb   /* Interview stage */
--purple-600: #9333ea /* Test stage */
--yellow-600: #ca8a04 /* Pending/Warning */
--red-600: #dc2626    /* Rejected/Error */

/* Neutrals */
--gray-900: #111827   /* Headings */
--gray-700: #374151   /* Body text */
--gray-500: #6b7280   /* Secondary text */
--gray-100: #f3f4f6   /* Borders, dividers */
```

### Glass-morphism Effect
```css
.glass-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-sidebar {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(240, 253, 244, 0.95)
  );
  backdrop-filter: blur(20px);
}
```

### Responsive Breakpoints
```javascript
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px

// Tailwind classes:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
```

---

## 📦 NPM Scripts

```json
{
  "start": "react-scripts start",          // Dev server
  "build": "react-scripts build",          // Production build
  "test": "react-scripts test",            // Jest tests
  "eject": "react-scripts eject",          // ⚠️ One-way operation
  "lint": "eslint src/**/*.{js,jsx}",      // (if added)
  "format": "prettier --write src/**/*"    // (if added)
}
```

---

## 🧪 Testing

### Current Status
- No tests implemented yet
- Placeholder test file exists: `App.test.js`

### Recommended Test Strategy
```javascript
// 1. Unit tests (Jest)
// Test utility functions
describe('aiScreening', () => {
  test('calculates correct score', () => {
    const score = calculateScore(candidate, job);
    expect(score).toBeGreaterThan(0);
  });
});

// 2. Component tests (React Testing Library)
import { render, screen, fireEvent } from '@testing-library/react';

test('renders candidate list', () => {
  render(<CandidateList candidates={mockData} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

// 3. Integration tests
test('complete workflow from application to offer', async () => {
  // Multi-step test
});

// 4. E2E tests (Playwright or Cypress)
// Test full user journeys
```

---

## 🚦 CI/CD Pipeline

### GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📚 Additional Resources

### Documentation
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Related Files
- `FEATURES.md` - Feature list
- `DEPLOYMENT.md` - Deployment guide
- `README.md` - Project readme

### Contact
- **Repository**: https://github.com/makenubl/pvara-frontend
- **Branch**: `feature/recruitment-workflow-complete`
- **Last Updated**: December 5, 2025

---

## 🎯 Future Enhancements

### High Priority
1. **Backend API Integration**
   - REST API with Node.js/Express
   - PostgreSQL database
   - JWT authentication
   - File upload to S3/cloud storage

2. **Real Email Sending**
   - SMTP integration (Nodemailer)
   - Email queue system
   - Template rendering engine

3. **Calendar Integration**
   - Google Calendar API for interviews
   - Automated scheduling
   - Reminder emails

### Medium Priority
4. **Advanced Search**
   - Elasticsearch integration
   - Fuzzy search
   - Filters: location, salary, experience

5. **Reporting & Analytics**
   - Charts (Chart.js or Recharts)
   - Hiring metrics dashboard
   - Time-to-hire tracking
   - Conversion rates

6. **Notifications**
   - Real-time WebSocket updates
   - Browser push notifications
   - SMS notifications (Twilio)

### Low Priority
7. **Video Interviews**
   - Zoom/Teams integration
   - Record interview notes
   - AI interview analysis

8. **Mobile App**
   - React Native app
   - Candidate mobile experience

9. **Multi-language Support**
   - i18n setup
   - Urdu/English toggle

---

## ✅ Final Checklist for Handover

- [x] Code pushed to `feature/recruitment-workflow-complete`
- [x] All features documented
- [x] Architecture explained
- [x] State structure defined
- [x] Workflow diagram provided
- [x] Setup instructions included
- [x] Deployment guide complete
- [x] Troubleshooting section added
- [x] Future enhancements listed
- [x] Code standards documented

**Status**: ✅ Ready for developer handover

---

**End of Documentation**

For questions or clarifications, review the codebase or create GitHub issues.
