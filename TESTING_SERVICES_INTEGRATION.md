# Testing Services Integration Guide

## 🎯 Overview

Integration options for automated candidate testing and assessment platforms with PVARA recruitment system.

## 🏆 Top Testing Platforms

### 1. **HackerRank for Work** ⭐ Recommended
**Best for:** Technical assessments, coding challenges

**Features:**
- Pre-built coding tests (50+ languages)
- Custom test creation
- Live coding interviews
- Plagiarism detection
- Auto-scoring
- Video proctoring

**API Integration:**
```javascript
// API Endpoints
POST /tests - Create test
GET /tests/{id} - Get test details
POST /tests/{id}/candidates - Invite candidates
GET /candidates/{id}/report - Get candidate results

// Response Format
{
  "candidate_id": "12345",
  "test_id": "test_67890",
  "score": 85,
  "percentile": 92,
  "time_taken": 3600,
  "questions": [
    {
      "id": "q1",
      "score": 10,
      "max_score": 10,
      "time_taken": 600
    }
  ],
  "status": "completed"
}
```

**Pricing:**
- Free: 1 test, 25 candidates
- Team: $100/month - 10 tests, 100 candidates
- Enterprise: Custom pricing

**Documentation:** https://www.hackerrank.com/work/apidocs

---

### 2. **Codility** ⭐ Recommended
**Best for:** Technical screening, remote hiring

**Features:**
- 400+ ready-made tests
- Real-world programming tasks
- Anti-cheating technology
- Automated scoring
- Technical interviews
- Skills reports

**API Integration:**
```javascript
// REST API
POST /api/v1/tests - Create test session
GET /api/v1/tests/{id} - Get test status
GET /api/v1/results/{test_id} - Get results

// Webhook for real-time updates
POST /webhooks/test-completed
{
  "event": "test.completed",
  "candidate_email": "john@example.com",
  "test_id": "ABC123",
  "score": 78,
  "max_score": 100,
  "completion_time": "2025-12-06T10:30:00Z",
  "skills_assessed": ["JavaScript", "Algorithms"],
  "report_url": "https://codility.com/reports/..."
}
```

**Pricing:**
- StartUp: $449/month - 100 tests
- Scale: $899/month - 500 tests
- Enterprise: Custom

**Documentation:** https://api-docs.codility.com/

---

### 3. **TestGorilla**
**Best for:** Skills testing across all roles (not just tech)

**Features:**
- 300+ tests (coding, cognitive, personality, language)
- Multi-test assessments
- Video questions
- Custom questions
- Anti-cheating measures
- Detailed analytics

**API Integration:**
```javascript
// API Structure
POST /v1/assessments - Create assessment
POST /v1/invitations - Send test invite
GET /v1/results/{assessment_id} - Get results

// Response
{
  "assessment_id": "assess_123",
  "candidate": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "tests": [
    {
      "test_name": "JavaScript (Coding): Intermediate",
      "score": 4.2,
      "max_score": 5.0,
      "percentile": 85
    },
    {
      "test_name": "Problem Solving",
      "score": 4.5,
      "max_score": 5.0,
      "percentile": 92
    }
  ],
  "overall_score": 87,
  "status": "completed",
  "completed_at": "2025-12-06T14:22:00Z"
}
```

**Pricing:**
- Starter: Free - 5 tests/month
- Pro: $75/month - Unlimited tests
- Enterprise: Custom

**Documentation:** https://developer.testgorilla.com/

---

### 4. **iMocha**
**Best for:** Enterprise-level skill assessments

**Features:**
- 2,500+ skills tests
- Coding simulators
- AI-powered proctoring
- Custom test builder
- Live interviews
- Integration with ATS

**API Integration:**
```javascript
// API Endpoints
POST /api/v2/test/invite - Send test invitation
GET /api/v2/test/result/{test_id} - Get test results
GET /api/v2/test/detailed-report/{test_id} - Detailed report

// Result Structure
{
  "test_id": "TID_12345",
  "candidate_name": "Ahmed Khan",
  "candidate_email": "ahmed@example.com",
  "test_name": "Full Stack Developer Assessment",
  "score_percentage": 82,
  "section_scores": {
    "frontend": 85,
    "backend": 78,
    "database": 84
  },
  "time_spent_minutes": 90,
  "status": "COMPLETED",
  "proctoring_alerts": 2,
  "recommendation": "STRONG_YES"
}
```

**Pricing:**
- Professional: $199/month
- Business: $399/month
- Enterprise: Custom

**Documentation:** https://www.imocha.io/api-documentation

---

### 5. **Mettl (Mercer | Mettl)**
**Best for:** Enterprise assessments with AI proctoring

**Features:**
- 100,000+ questions
- 1,000+ tests
- AI proctoring
- Coding simulators
- Psychometric tests
- Interview intelligence

**API Integration:**
```javascript
// REST API
POST /assessments/send - Send assessment
GET /assessments/{id}/results - Get results
POST /webhooks/subscribe - Subscribe to events

// Webhook Payload
{
  "event_type": "ASSESSMENT_COMPLETED",
  "assessment_id": "MTL_987654",
  "candidate": {
    "id": "CAND_123",
    "name": "Fatima Ahmed",
    "email": "fatima@example.com"
  },
  "results": {
    "overall_percentage": 76,
    "sections": [
      {"name": "Technical Skills", "score": 80},
      {"name": "Problem Solving", "score": 72}
    ],
    "proctoring_score": 98,
    "recommendation": "PROCEED"
  },
  "completed_at": "2025-12-06T16:45:00Z"
}
```

**Pricing:**
- Contact for pricing (Enterprise-focused)

**Documentation:** https://docs.mettl.com/

---

### 6. **Vervoe**
**Best for:** Skills-based hiring with custom assessments

**Features:**
- AI-powered grading
- Real-world simulations
- Video responses
- Custom test builder
- Bias-free hiring
- ATS integration

**API Integration:**
```javascript
// API Calls
POST /api/v1/assessments - Create assessment
POST /api/v1/candidates - Add candidate
GET /api/v1/submissions/{id} - Get submission

// Response
{
  "submission_id": "SUB_456",
  "candidate_email": "candidate@example.com",
  "assessment_name": "Software Engineer Assessment",
  "overall_score": 8.3,
  "max_score": 10,
  "skills": [
    {"skill": "Coding", "score": 8.5},
    {"skill": "Problem Solving", "score": 8.1}
  ],
  "status": "graded",
  "submitted_at": "2025-12-06T11:30:00Z"
}
```

**Pricing:**
- Growth: $359/month
- Business: $599/month
- Enterprise: Custom

**Documentation:** https://vervoe.com/api-docs/

---

## 🏗️ Implementation Architecture

### Database Schema Addition

```javascript
// TestProvider Model
{
  _id: ObjectId,
  provider: 'hackerrank' | 'codility' | 'testgorilla' | 'imocha' | 'mettl' | 'vervoe',
  apiKey: String (encrypted),
  apiSecret: String (encrypted),
  webhookUrl: String,
  webhookSecret: String,
  isActive: Boolean,
  configuration: {
    defaultTestDuration: Number,
    autoSendInvites: Boolean,
    proctoring: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// Update Application Schema
{
  // ... existing fields
  testing: {
    provider: String,
    testId: String,
    invitedAt: Date,
    startedAt: Date,
    completedAt: Date,
    score: Number,
    maxScore: Number,
    percentile: Number,
    reportUrl: String,
    sections: [{
      name: String,
      score: Number,
      maxScore: Number
    }],
    proctoringAlerts: Number,
    recommendation: String,
    rawData: Object
  }
}
```

### Backend API Endpoints

```javascript
// /routes/testing.js

// Configure testing provider
POST /api/testing/providers
{
  "provider": "hackerrank",
  "apiKey": "your_api_key",
  "apiSecret": "your_api_secret",
  "configuration": {
    "autoSendInvites": true,
    "proctoring": true
  }
}

// Send test to candidate
POST /api/testing/send-test
{
  "applicationId": "app_123",
  "provider": "hackerrank",
  "testId": "test_456",
  "candidateEmail": "candidate@example.com",
  "candidateName": "John Doe"
}

// Get test results
GET /api/testing/results/:applicationId

// Webhook endpoint for providers
POST /api/webhooks/testing/:provider
{
  "event": "test.completed",
  "testId": "test_123",
  "candidateEmail": "candidate@example.com",
  "score": 85,
  "results": {...}
}

// List available tests from provider
GET /api/testing/available-tests/:provider

// Bulk send tests
POST /api/testing/bulk-send
{
  "applicationIds": ["app_1", "app_2", "app_3"],
  "provider": "codility",
  "testId": "test_789"
}
```

### Service Layer

```javascript
// /services/testingService.js

class TestingService {
  constructor(provider) {
    this.provider = provider;
    this.client = this.initializeClient(provider);
  }

  async sendTest(candidateData, testConfig) {
    switch(this.provider) {
      case 'hackerrank':
        return await this.sendHackerRankTest(candidateData, testConfig);
      case 'codility':
        return await this.sendCodilityTest(candidateData, testConfig);
      case 'testgorilla':
        return await this.sendTestGorillaTest(candidateData, testConfig);
      // ... other providers
    }
  }

  async getResults(testId) {
    // Fetch results from provider API
  }

  async handleWebhook(payload) {
    // Process webhook data
    // Update application in database
    // Send notification to recruiter
  }
}
```

---

## 🎨 Frontend Integration

### TestManagement Component Updates

```jsx
// Add provider selection
<select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
  <option value="hackerrank">HackerRank</option>
  <option value="codility">Codility</option>
  <option value="testgorilla">TestGorilla</option>
  <option value="imocha">iMocha</option>
  <option value="mettl">Mettl</option>
  <option value="vervoe">Vervoe</option>
</select>

// Display test results
<div className="test-results-card">
  <div className="score-display">
    <div className="circular-progress">
      <span className="score">{application.testing.score}</span>
      <span className="max-score">/{application.testing.maxScore}</span>
    </div>
    <div className="percentile">
      Top {100 - application.testing.percentile}%
    </div>
  </div>
  
  <div className="section-scores">
    {application.testing.sections.map(section => (
      <div className="section" key={section.name}>
        <span className="section-name">{section.name}</span>
        <ProgressBar 
          value={section.score} 
          max={section.maxScore} 
        />
        <span className="section-score">
          {section.score}/{section.maxScore}
        </span>
      </div>
    ))}
  </div>
  
  <div className="test-metadata">
    <div className="metadata-item">
      <svg>...</svg>
      <span>Completed: {formatDate(application.testing.completedAt)}</span>
    </div>
    <div className="metadata-item">
      <svg>...</svg>
      <span>Duration: {formatDuration(application.testing.duration)}</span>
    </div>
    {application.testing.proctoringAlerts > 0 && (
      <div className="metadata-item warning">
        <svg>...</svg>
        <span>{application.testing.proctoringAlerts} Proctoring Alerts</span>
      </div>
    )}
  </div>
  
  <a 
    href={application.testing.reportUrl} 
    target="_blank"
    className="view-full-report-btn"
  >
    View Full Report
  </a>
</div>
```

---

## 📊 Comparison Matrix

| Feature | HackerRank | Codility | TestGorilla | iMocha | Mettl | Vervoe |
|---------|------------|----------|-------------|---------|--------|--------|
| **Tech Focus** | ✅ Strong | ✅ Strong | ⚠️ Medium | ✅ Strong | ✅ Strong | ⚠️ Medium |
| **Non-Tech Tests** | ❌ Limited | ❌ Limited | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Good |
| **API Quality** | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good | ⚠️ Basic |
| **Webhooks** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Free Tier** | ✅ Yes | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Proctoring** | ✅ Video | ✅ Advanced | ✅ Basic | ✅ AI | ✅ AI | ⚠️ Limited |
| **Custom Tests** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Price/Month** | $100+ | $449+ | $75+ | $199+ | Enterprise | $359+ |
| **Setup Time** | 2-3 hours | 2-3 hours | 1-2 hours | 3-4 hours | 4-5 hours | 2-3 hours |

---

## 🚀 Recommended Implementation Plan

### Phase 1: Core Integration (Week 1)
1. **Choose Primary Provider**: Start with **HackerRank** or **TestGorilla**
   - HackerRank: If focus is technical roles
   - TestGorilla: If hiring across all roles

2. **Backend Setup**:
   - Add TestProvider model
   - Create testing routes
   - Implement service layer
   - Set up webhooks

3. **Database Updates**:
   - Update Application schema
   - Add testing fields
   - Create indexes

### Phase 2: Frontend Integration (Week 2)
1. **Settings Panel**:
   - Add provider configuration UI
   - API key management
   - Test provider connection

2. **TestManagement Updates**:
   - Provider selection dropdown
   - Send test button
   - Bulk actions

3. **Results Display**:
   - Score cards
   - Section breakdown
   - Report links

### Phase 3: Advanced Features (Week 3)
1. **Automation**:
   - Auto-send tests when status changes
   - Scheduled reminders
   - Auto-scoring integration

2. **Analytics**:
   - Test completion rates
   - Average scores by job
   - Provider comparison

3. **Multi-Provider Support**:
   - Add 2-3 more providers
   - Provider comparison tool
   - Automatic failover

---

## 💡 Code Examples

### Backend Integration Example

```javascript
// /services/hackerrank.service.js
const axios = require('axios');

class HackerRankService {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: 'https://www.hackerrank.com/x/api/v3',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendTest(candidate, testId) {
    try {
      const response = await this.client.post('/tests/send', {
        test_id: testId,
        candidates: [{
          email: candidate.email,
          full_name: candidate.name
        }],
        send_email: true
      });

      return {
        success: true,
        testLinkId: response.data.id,
        expiresAt: response.data.expires_at
      };
    } catch (error) {
      console.error('HackerRank API Error:', error);
      throw new Error('Failed to send test');
    }
  }

  async getResults(testId) {
    const response = await this.client.get(`/tests/${testId}/report`);
    return {
      score: response.data.score,
      maxScore: response.data.max_score,
      percentile: response.data.percentile,
      sections: response.data.questions.map(q => ({
        name: q.name,
        score: q.score,
        maxScore: q.max_score
      })),
      reportUrl: response.data.report_url
    };
  }
}

module.exports = HackerRankService;
```

### Webhook Handler

```javascript
// /routes/webhooks.js
router.post('/webhooks/testing/:provider', async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;

  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(provider, req);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process based on provider
    const testingService = new TestingService(provider);
    const result = await testingService.handleWebhook(payload);

    // Update application
    await Application.findOneAndUpdate(
      { 'testing.testId': result.testId },
      {
        'testing.completedAt': new Date(),
        'testing.score': result.score,
        'testing.maxScore': result.maxScore,
        'testing.percentile': result.percentile,
        'testing.sections': result.sections,
        'testing.reportUrl': result.reportUrl,
        'testing.rawData': payload
      }
    );

    // Send notification
    await notificationService.sendTestCompletedNotification(result);

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

---

## 🎯 Best Practices

### Security
1. **Encrypt API Keys**: Use encryption for storing credentials
2. **Validate Webhooks**: Always verify webhook signatures
3. **Rate Limiting**: Implement rate limits on API calls
4. **Audit Logs**: Track all test-related actions

### Performance
1. **Async Processing**: Use queues for webhook processing
2. **Caching**: Cache test templates and provider configs
3. **Retry Logic**: Implement exponential backoff for API failures

### User Experience
1. **Real-time Updates**: Use WebSockets for live score updates
2. **Email Notifications**: Notify on test sent/completed
3. **Clear Instructions**: Provide candidate-facing test guides
4. **Mobile Friendly**: Ensure test links work on mobile

---

## 📈 Success Metrics

Track these metrics post-integration:
- Test invitation rate
- Test completion rate
- Average test scores by job
- Time from test sent → completed
- Correlation between test scores and job performance
- Provider API uptime
- Cost per test by provider

---

## 🔗 Next Steps

1. **Choose Provider**: Evaluate based on your needs
2. **Get API Access**: Sign up and obtain credentials
3. **Set Up Sandbox**: Test integration in development
4. **Implement Backend**: Add API routes and services
5. **Update Frontend**: Build UI components
6. **Test Webhooks**: Verify real-time updates work
7. **Go Live**: Deploy and monitor

---

**Recommendation**: Start with **TestGorilla** (broader skills, free tier, easy API) or **HackerRank** (if tech-focused, strong brand, good docs).

Both have excellent APIs, webhooks, and documentation to get started quickly!
