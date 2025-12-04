// ========================================
// ADVANCED FEATURES UI COMPONENTS
// ========================================

import React from "react";
import {
  EmailTemplates,
  sendEmail,
  InterviewTypes,
  scheduleInterview,
  generateAvailabilitySlots,
  addMessage,
  applyAdvancedFilter,
  organizeByPipeline,
  submitInterviewerFeedback,
  generateOfferLetter,
  exportToCSV,
  notifySlack,
  calculateMetrics,
  getCompanySettings,
  updateCompanySettings,
} from "./AdvancedFeatures";

// EMAIL NOTIFICATIONS PANEL
export function EmailNotificationsPanel({ applications }) {
  const [sent, setSent] = React.useState([]);

  const sendNotification = (candidateId, templateType) => {
    const app = applications.find((a) => a.id === candidateId);
    if (!app) return;

    const job = JSON.parse(localStorage.getItem("PVARA_STATE") || "{}").jobs?.find((j) => j.id === app.jobId);
    let template;

    switch (templateType) {
      case "received":
        template = EmailTemplates.APPLICATION_RECEIVED(app.applicant.name, job?.title);
        break;
      case "shortlisted":
        template = EmailTemplates.APPLICATION_SHORTLISTED(app.applicant.name, job?.title);
        break;
      case "rejection":
        template = EmailTemplates.REJECTION(app.applicant.name, job?.title);
        break;
      default:
        return;
    }

    const email = sendEmail(app.applicant.email, template);
    setSent([email, ...sent]);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">📧 Email Notifications</h3>
      <div className="space-y-2 mb-3">
        {applications.slice(0, 5).map((app) => (
          <div key={app.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm">{app.applicant.name}</span>
            <div className="flex gap-1">
              <button
                onClick={() => sendNotification(app.id, "shortlisted")}
                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              >
                Shortlist
              </button>
              <button
                onClick={() => sendNotification(app.id, "rejection")}
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {sent.length > 0 && (
        <div className="text-xs text-green-600">
          ✅ {sent.length} emails sent
        </div>
      )}
    </div>
  );
}

// INTERVIEW SCHEDULING
export function InterviewSchedulingPanel() {
  const [interviews, setInterviews] = React.useState([]);
  const [formData, setFormData] = React.useState({ candidateId: "", type: "Phone Screen", date: "", notes: "" });
  const slots = generateAvailabilitySlots(formData.date || new Date().toISOString().split("T")[0]);

  const scheduleInterview_ = () => {
    if (!formData.candidateId || !formData.date) return;
    const interview = scheduleInterview(formData.candidateId, "", formData.type, formData.date, "", formData.notes);
    setInterviews([interview, ...interviews]);
    setFormData({ candidateId: "", type: "Phone Screen", date: "", notes: "" });
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">📅 Interview Scheduling</h3>
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Candidate ID"
          value={formData.candidateId}
          onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        >
          {InterviewTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <input
          type="text"
          placeholder="Interview notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <button
          onClick={scheduleInterview_}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Schedule Interview
        </button>
      </div>
      <div className="text-xs text-gray-600">{interviews.length} interviews scheduled</div>
    </div>
  );
}

// KANBAN PIPELINE VIEW
export function KanbanPipelineView({ applications }) {
  const pipeline = organizeByPipeline(applications);
  const stages = Object.keys(pipeline);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">📊 Candidate Pipeline</h3>
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {stages.map((stage) => (
            <div
              key={stage}
              className="min-w-64 bg-gray-50 rounded p-3 border-l-4 border-blue-500"
            >
              <div className="font-semibold text-sm mb-2 capitalize">
                {stage} ({pipeline[stage].length})
              </div>
              <div className="space-y-2">
                {pipeline[stage].slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-2 rounded border text-xs hover:shadow-md cursor-move"
                  >
                    <div className="font-semibold">{app.applicant.name}</div>
                    <div className="text-gray-600">Score: {(app.aiScore || 0).toFixed(1)}</div>
                  </div>
                ))}
                {pipeline[stage].length > 3 && (
                  <div className="text-xs text-gray-500 italic">
                    +{pipeline[stage].length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ADVANCED FILTER
export function AdvancedFilterPanel({ applications, onFilter }) {
  const [filters, setFilters] = React.useState({
    status: "",
    minScore: 0,
    maxScore: 100,
    searchText: "",
  });

  const applyFilters = () => {
    const filtered = applyAdvancedFilter(applications, filters);
    onFilter(filtered);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">🔍 Advanced Filters</h3>
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.searchText}
          onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min Score"
            value={filters.minScore}
            onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) || 0 })}
            className="flex-1 border p-2 rounded text-sm"
          />
          <input
            type="number"
            placeholder="Max Score"
            value={filters.maxScore}
            onChange={(e) => setFilters({ ...filters, maxScore: parseInt(e.target.value) || 100 })}
            className="flex-1 border p-2 rounded text-sm"
          />
        </div>
        <button
          onClick={applyFilters}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// OFFER MANAGEMENT
export function OfferManagementPanel({ applications }) {
  const [offers, setOffers] = React.useState([]);
  const [formData, setFormData] = React.useState({ candidateId: "", salary: "", startDate: "" });

  const generateOffer = () => {
    if (!formData.candidateId || !formData.salary) return;
    const app = applications.find((a) => a.id === formData.candidateId);
    if (!app) return;

    const offer = generateOfferLetter(app.applicant, { title: "Position", id: "", department: "" }, formData.salary, formData.startDate);
    setOffers([offer, ...offers]);
    setFormData({ candidateId: "", salary: "", startDate: "" });
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">💼 Offer Management</h3>
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Candidate ID"
          value={formData.candidateId}
          onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <input
          type="text"
          placeholder="Salary (e.g., $80,000)"
          value={formData.salary}
          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <button
          onClick={generateOffer}
          className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Generate Offer
        </button>
      </div>
      {offers.length > 0 && (
        <div className="text-xs text-green-600">✅ {offers.length} offers generated</div>
      )}
    </div>
  );
}

// ANALYTICS & REPORTS
export function AnalyticsReportsPanel({ applications }) {
  const [metrics, setMetrics] = React.useState(null);

  React.useEffect(() => {
    const m = calculateMetrics(applications);
    setMetrics(m);
  }, [applications]);

  const exportData = () => {
    exportToCSV(applications, "pvara-applications.csv");
    notifySlack(`📊 Report exported: ${applications.length} applications`);
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">📈 Analytics & Reports</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-xs text-gray-600">Total Applications</div>
          <div className="text-xl font-bold text-blue-600">{metrics.totalApplications}</div>
        </div>
        <div className="p-2 bg-green-50 rounded">
          <div className="text-xs text-gray-600">Hired</div>
          <div className="text-xl font-bold text-green-600">{metrics.hired}</div>
        </div>
        <div className="p-2 bg-yellow-50 rounded">
          <div className="text-xs text-gray-600">Conversion Rate</div>
          <div className="text-xl font-bold text-yellow-600">{metrics.conversionRate}%</div>
        </div>
        <div className="p-2 bg-purple-50 rounded">
          <div className="text-xs text-gray-600">Avg Time to Hire</div>
          <div className="text-xl font-bold text-purple-600">{metrics.avgTimeToHire}d</div>
        </div>
      </div>
      <button
        onClick={exportData}
        className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
      >
        📥 Export to CSV & Slack
      </button>
    </div>
  );
}

// SETTINGS & CUSTOMIZATION
export function SettingsPanel() {
  const [settings, setSettings] = React.useState(getCompanySettings());

  const saveSettings = () => {
    updateCompanySettings(settings);
    alert("✅ Settings saved!");
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-3">⚙️ Settings & Customization</h3>
      <div className="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Company Name"
          value={settings.companyName || ""}
          onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <input
          type="color"
          value={settings.primaryColor || "#1f7e4f"}
          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
          className="w-full border p-2 rounded text-sm"
        />
        <button
          onClick={saveSettings}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 text-sm"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default {
  EmailNotificationsPanel,
  InterviewSchedulingPanel,
  KanbanPipelineView,
  AdvancedFilterPanel,
  OfferManagementPanel,
  AnalyticsReportsPanel,
  SettingsPanel,
};
