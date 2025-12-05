# AI Screening Integration with Frontend Dashboard

## 🖥️ Frontend Components to Add

### 1. Screening Configuration Panel (`src/ScreeningConfigPanel.jsx`)

```jsx
import React, { useState } from 'react';
import { API_BASE_URL } from './config';

export function ScreeningConfigPanel({ jobId }) {
  const [config, setConfig] = useState({
    mustHaveSkills: [],
    niceToHaveSkills: [],
    minExperience: 0,
    education: '',
    topNCandidates: 10,
    minScoreThreshold: 70,
    llmProvider: 'ollama'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/screening-criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          criteria: config,
          llm_config: { provider: config.llmProvider, model: 'llama2:7b' }
        })
      });

      if (response.ok) {
        setMessage('✅ Screening criteria saved successfully');
      } else {
        setMessage('❌ Failed to save configuration');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (category) => {
    setConfig(prev => ({
      ...prev,
      [category]: [...prev[category], { name: '', years: 0 }]
    }));
  };

  return (
    <div className="screening-config-panel border rounded-lg p-6 bg-white shadow-lg">
      <h2 className="text-2xl font-bold mb-6">AI Screening Configuration</h2>

      {/* LLM Provider Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">LLM Provider</label>
        <select
          value={config.llmProvider}
          onChange={(e) => setConfig({ ...config, llmProvider: e.target.value })}
          className="w-full border rounded px-3 py-2"
        >
          <option value="ollama">Ollama (Self-hosted, Free)</option>
          <option value="claude">Claude 3 (Anthropic, $0.015/1K tokens)</option>
          <option value="gpt-4">GPT-4 (OpenAI, $0.03/1K tokens)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Ollama: 85% accuracy, $200/month
          Claude: 92% accuracy, $360K/month for 1M apps
          GPT-4: 95% accuracy, $720K/month for 1M apps
        </p>
      </div>

      {/* Must-Have Skills */}
      <fieldset className="mb-6 border-l-4 border-red-500 pl-4">
        <legend className="text-lg font-semibold mb-3">Must-Have Skills (Critical)</legend>
        {config.mustHaveSkills.map((skill, idx) => (
          <div key={idx} className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="Skill name (e.g., Python)"
              value={skill.name}
              onChange={(e) => {
                const updated = [...config.mustHaveSkills];
                updated[idx].name = e.target.value;
                setConfig({ ...config, mustHaveSkills: updated });
              }}
              className="flex-1 border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Years"
              min="0"
              value={skill.years}
              onChange={(e) => {
                const updated = [...config.mustHaveSkills];
                updated[idx].years = parseInt(e.target.value);
                setConfig({ ...config, mustHaveSkills: updated });
              }}
              className="w-20 border rounded px-2 py-1"
            />
            <button
              onClick={() => {
                setConfig({
                  ...config,
                  mustHaveSkills: config.mustHaveSkills.filter((_, i) => i !== idx)
                });
              }}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => addSkill('mustHaveSkills')}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          + Add Must-Have Skill
        </button>
      </fieldset>

      {/* Nice-to-Have Skills */}
      <fieldset className="mb-6 border-l-4 border-yellow-500 pl-4">
        <legend className="text-lg font-semibold mb-3">Nice-to-Have Skills (Optional)</legend>
        {config.niceToHaveSkills.map((skill, idx) => (
          <div key={idx} className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="Skill name"
              value={skill.name}
              onChange={(e) => {
                const updated = [...config.niceToHaveSkills];
                updated[idx].name = e.target.value;
                setConfig({ ...config, niceToHaveSkills: updated });
              }}
              className="flex-1 border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Years"
              min="0"
              value={skill.years}
              onChange={(e) => {
                const updated = [...config.niceToHaveSkills];
                updated[idx].years = parseInt(e.target.value);
                setConfig({ ...config, niceToHaveSkills: updated });
              }}
              className="w-20 border rounded px-2 py-1"
            />
            <button
              onClick={() => {
                setConfig({
                  ...config,
                  niceToHaveSkills: config.niceToHaveSkills.filter((_, i) => i !== idx)
                });
              }}
              className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => addSkill('niceToHaveSkills')}
          className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          + Add Nice-to-Have Skill
        </button>
      </fieldset>

      {/* Other Requirements */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Minimum Experience (years)</label>
          <input
            type="number"
            min="0"
            value={config.minExperience}
            onChange={(e) => setConfig({ ...config, minExperience: parseInt(e.target.value) })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Required Education</label>
          <input
            type="text"
            placeholder="e.g., Bachelor's degree"
            value={config.education}
            onChange={(e) => setConfig({ ...config, education: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Filtering Options */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Top N Candidates</label>
          <input
            type="number"
            min="1"
            value={config.topNCandidates}
            onChange={(e) => setConfig({ ...config, topNCandidates: parseInt(e.target.value) })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Minimum Score Threshold</label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.minScoreThreshold}
            onChange={(e) => setConfig({ ...config, minScoreThreshold: parseInt(e.target.value) })}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-1">Current: {config.minScoreThreshold}/100</p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('✅') ? 'bg-green-100' : 'bg-red-100'}`}>
          {message}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveConfig}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Screening Configuration'}
      </button>
    </div>
  );
}
```

### 2. AI Shortlist Component (`src/AIShortlistPanel.jsx`)

```jsx
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';

export function AIShortlistPanel({ jobId }) {
  const [shortlist, setShortlist] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchShortlist();

    if (autoRefresh) {
      const interval = setInterval(fetchShortlist, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchShortlist = async () => {
    try {
      const [shortlistRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/shortlist/${jobId}`),
        fetch(`${API_BASE_URL}/stats/${jobId}`)
      ]);

      if (shortlistRes.ok && statsRes.ok) {
        const shortlistData = await shortlistRes.json();
        const statsData = await statsRes.json();
        setShortlist(shortlistData.candidates || []);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch shortlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'Strong fit':
        return '✅';
      case 'Consider':
        return '⚠️';
      case 'Not a match':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading shortlist...</div>;
  }

  return (
    <div className="ai-shortlist-panel">
      {/* Statistics */}
      {stats && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-2xl font-bold text-blue-600">{stats.total_applications}</p>
            <p className="text-sm text-gray-600">Total Applications</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-2xl font-bold text-green-600">{stats.strong_fits}</p>
            <p className="text-sm text-gray-600">Strong Fits (80+)</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-2xl font-bold text-yellow-600">{stats.consider}</p>
            <p className="text-sm text-gray-600">Consider (70-79)</p>
          </div>
          <div className="bg-red-50 p-4 rounded">
            <p className="text-2xl font-bold text-red-600">{stats.not_matches}</p>
            <p className="text-sm text-gray-600">Not a Match (&lt; 70)</p>
          </div>
        </div>
      )}

      {/* Auto-Refresh Toggle */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Top 10 Candidates (AI Shortlist)</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Auto-refresh</span>
        </label>
      </div>

      {/* Shortlist Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Candidate Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-center">AI Score</th>
              <th className="px-4 py-2 text-center">Recommendation</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shortlist.map((candidate, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-semibold">#{candidate.rank}</td>
                <td className="px-4 py-2">{candidate.candidate_name}</td>
                <td className="px-4 py-2">
                  <a href={`mailto:${candidate.candidate_email}`} className="text-blue-600 hover:underline">
                    {candidate.candidate_email}
                  </a>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(candidate.ai_score)}`}>
                    {candidate.ai_score}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="text-lg mr-2">{getRecommendationIcon(candidate.recommendation)}</span>
                  {candidate.recommendation}
                </td>
                <td className="px-4 py-2 text-center">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 mr-2">
                    View Resume
                  </button>
                  <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    Schedule Interview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {shortlist.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No candidates screened yet. Configure criteria above to start AI screening.
        </div>
      )}
    </div>
  );
}
```

### 3. Add to Dashboard Tab (`src/ComprehensiveDashboard.jsx`)

```jsx
// Add this to the ComprehensiveDashboard tabs:

const [activeTab, setActiveTab] = useState('overview');

// Add new tab button
<div className="flex gap-2 mb-6 border-b">
  {/* ... existing tabs ... */}
  <button
    onClick={() => setActiveTab('ai-screening')}
    className={`px-4 py-2 font-semibold border-b-2 ${
      activeTab === 'ai-screening'
        ? 'border-purple-600 text-purple-600'
        : 'border-transparent text-gray-600'
    }`}
  >
    🤖 AI Screening
  </button>
</div>

// Add tab content
{activeTab === 'ai-screening' && (
  <div className="space-y-6">
    <ScreeningConfigPanel jobId={selectedJob?.id} />
    <AIShortlistPanel jobId={selectedJob?.id} />
  </div>
)}
```

---

## 🔄 Data Flow Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend React App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dashboard (ComprehensiveDashboard.jsx)                         │
│    ├─ Overview Tab      (existing)                              │
│    ├─ Jobs Tab          (existing)                              │
│    ├─ Applications Tab  (existing)                              │
│    ├─ Candidates Tab    (existing)                              │
│    ├─ Funnel Tab        (existing)                              │
│    └─ 🤖 AI Screening   (NEW)                                   │
│          ├─ ScreeningConfigPanel.jsx                            │
│          │   - Set must-have skills                             │
│          │   - Set nice-to-have skills                          │
│          │   - Choose LLM provider                              │
│          │   - Set filtering threshold                          │
│          │   - Save via POST /api/screening-criteria            │
│          │                                                       │
│          └─ AIShortlistPanel.jsx                                │
│              - Display statistics                               │
│              - Show top 10 candidates                           │
│              - Real-time score updates                          │
│              - View resume / schedule interview                 │
│              - GET /api/shortlist/{jobId}                       │
│              - GET /api/stats/{jobId}                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️
                      API Gateway (Kong)
                              ↕️
┌─────────────────────────────────────────────────────────────────┐
│                  Backend Services                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Applications Service (Go)                                      │
│    POST   /applications (receives resume)                       │
│    ↓                                                             │
│    Kafka Topic: applications.submitted                          │
│    ↓                                                             │
│  AI Screening Service (Python)                                 │
│    - Consume from Kafka                                         │
│    - Extract resume text                                        │
│    - Get screening criteria from Redis cache                    │
│    - Call LLM (Ollama/Claude/GPT-4)                            │
│    - Score candidate (0-100)                                    │
│    - Update database with ai_score, ai_reasoning               │
│    - POST /shortlist (generate top N)                           │
│    ↓                                                             │
│    Kafka Topic: applications.ai_screened                        │
│    ↓                                                             │
│  Notifications Service (Node.js)                                │
│    - Send email: "Shortlist ready for review"                  │
│    - POST webhook to HR system                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕️
                     PostgreSQL Database
```

---

## 📱 API Endpoints Called from Frontend

```javascript
// 1. Save screening criteria
POST /api/screening-criteria
{
  "job_id": "job-123",
  "criteria": { /* criteria object */ },
  "llm_config": { "provider": "ollama" },
  "filtering": { "top_n_candidates": 10 }
}
Response: { "status": "saved", "job_id": "job-123" }

// 2. Get current shortlist
GET /api/shortlist/job-123
Response: {
  "job_id": "job-123",
  "count": 10,
  "candidates": [
    {
      "rank": 1,
      "candidate_name": "John Doe",
      "ai_score": 95,
      "recommendation": "Strong fit"
    }
  ]
}

// 3. Get screening statistics
GET /api/stats/job-123
Response: {
  "total_applications": 5000,
  "strong_fits": 450,
  "consider": 800,
  "not_matches": 3750,
  "avg_score": 62.3
}
```

---

## 🎯 User Experience Flow

```
1. HR opens Job → AI Screening Tab
   ↓
2. HR configures must-have skills, nice-to-haves, etc.
   ↓
3. HR selects LLM provider (Ollama = fastest, cheapest)
   ↓
4. HR clicks "Save Configuration"
   ↓
5. System shows: "Configuration saved. AI screening enabled."
   ↓
6. Resumes start coming in → Automatically evaluated
   ↓
7. Real-time dashboard shows:
   - Total applications: 5,000
   - Strong fits: 450 (9%)
   - Top 10 candidates: [ranked list]
   ↓
8. HR reviews top 10 shortlist
   ↓
9. HR clicks "Schedule Interview" on candidate
   ↓
10. Calendar integration (Google Calendar, Outlook)
```

---

## 💡 Pro Tips for Frontend Integration

1. **Responsive Design**: Use Tailwind's responsive classes
2. **Real-time Updates**: Use WebSocket or polling for live shortlist updates
3. **Loading States**: Show skeleton loaders while fetching data
4. **Error Handling**: Display user-friendly error messages
5. **Accessibility**: Add ARIA labels for screen readers
6. **Performance**: Memoize components to prevent unnecessary re-renders

---

## ✅ Integration Checklist

- [ ] Add ScreeningConfigPanel.jsx component
- [ ] Add AIShortlistPanel.jsx component
- [ ] Add new tab to ComprehensiveDashboard.jsx
- [ ] Test API endpoints in development
- [ ] Style components with Tailwind CSS
- [ ] Add error handling and loading states
- [ ] Test with real screening data
- [ ] Deploy to production
- [ ] Train HR team on AI screening UI

---

**Frontend is now ready to leverage AI screening!** 🚀

