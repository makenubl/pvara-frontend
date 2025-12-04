import React, { useState } from "react";
import { generateAnalytics, generateHiringReport, reportToCSV, autoSelectCandidates } from "./aiScreening";

/**
 * Analytics Dashboard Component
 * Shows charts, metrics, and hiring funnel
 */
export function AnalyticsDashboard({ state }) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const analytics = generateAnalytics(state);
  const report = generateHiringReport(state);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {["overview", "funnel", "jobs", "recommendations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 font-semibold border-b-2 ${
              selectedTab === tab
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-600 hover:text-green-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Hiring Metrics</h3>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Applications"
              value={analytics.totalApplications}
              icon="📨"
            />
            <MetricCard
              label="Screened"
              value={analytics.screenedApplications}
              icon="✅"
            />
            <MetricCard
              label="Interviewed"
              value={analytics.interviewApplications}
              icon="🎤"
            />
            <MetricCard
              label="Offers"
              value={analytics.offeredApplications}
              icon="🎁"
            />
          </div>

          {/* Conversion Rates */}
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-3">Conversion Rates</h4>
            <div className="space-y-2">
              <ProgressBar
                label="App → Interview"
                value={analytics.conversionRates.applicationToInterview}
              />
              <ProgressBar
                label="Screening → Interview"
                value={analytics.conversionRates.screeningToInterview}
              />
              <ProgressBar
                label="App → Offer"
                value={analytics.conversionRates.applicationToOffer}
              />
            </div>
          </div>

          {/* Time to Hire */}
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-3">Time to Hire</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {analytics.timeToHireStats.average}
                </div>
                <div className="text-xs text-gray-500">Average (days)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {analytics.timeToHireStats.min}
                </div>
                <div className="text-xs text-gray-500">Min (days)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">
                  {analytics.timeToHireStats.max}
                </div>
                <div className="text-xs text-gray-500">Max (days)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Tab */}
      {selectedTab === "funnel" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Hiring Funnel</h3>
          <FunnelChart funnel={analytics.hiringFunnel} />
        </div>
      )}

      {/* Jobs Tab */}
      {selectedTab === "jobs" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Job Performance</h3>
          <div className="space-y-2">
            {analytics.jobPerformance.map((job) => (
              <div key={job.jobId} className="bg-white p-3 rounded border">
                <div className="font-semibold">{job.title}</div>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Applications:</span>{" "}
                    <span className="font-bold">{job.totalApplications}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Offers:</span>{" "}
                    <span className="font-bold text-green-700">{job.offers}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Score:</span>{" "}
                    <span className="font-bold text-blue-700">{job.averageScore}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {selectedTab === "recommendations" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Insights & Recommendations</h3>
          {report.recommendations.length > 0 ? (
            <div className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <div key={i} className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                  {rec}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No recommendations at this time.</div>
          )}

          {/* Export Report */}
          <button
            onClick={() => exportReport(report)}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
          >
            📥 Download Report (CSV)
          </button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold text-green-700 mt-2">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-700 h-2 rounded-full transition-all"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function FunnelChart({ funnel }) {
  const total = funnel.applications || 1;
  const stages = [
    { label: "Applications", value: funnel.applications, color: "bg-blue-500" },
    { label: "Screened", value: funnel.screened, color: "bg-yellow-500" },
    { label: "Interviewed", value: funnel.interviewed, color: "bg-purple-500" },
    { label: "Offers", value: funnel.offers, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-4">
      {stages.map((stage, i) => {
        const percentage = (stage.value / total) * 100;
        return (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">{stage.label}</span>
              <span>
                {stage.value} ({Math.round(percentage)}%)
              </span>
            </div>
            <div className={`${stage.color} h-8 rounded text-white flex items-center px-3 font-semibold`}
              style={{ width: `${percentage}%` }}>
              {stage.value > 0 && stage.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function exportReport(report) {
  const csv = reportToCSV(report);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hiring-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * AI Screening Component
 * Shows AI-scored candidates with auto-selection recommendations
 */
export function AIScreeningPanel({ candidates, jobRequirements, onSelectCandidates }) {
  const [threshold, setThreshold] = useState(75);
  const [selectedForReview, setSelectedForReview] = useState(new Set());

  const scoredCandidates = autoSelectCandidates(candidates, jobRequirements, threshold);

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold">🤖 AI Candidate Screening</h3>

      {/* Threshold Slider */}
      <div className="flex items-center gap-4">
        <label className="font-semibold">Selection Threshold:</label>
        <input
          type="range"
          min="50"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-lg font-bold text-green-700">{threshold}</span>
      </div>

      {/* Scored Candidates */}
      <div className="space-y-3">
        {scoredCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`p-3 rounded border-l-4 ${
              candidate.autoSelected
                ? "border-l-green-700 bg-green-50"
                : candidate.aiScore >= 60
                ? "border-l-yellow-700 bg-yellow-50"
                : "border-l-red-700 bg-red-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold">{candidate.applicant.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {candidate.applicant.email}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {candidate.aiScore}
                </div>
                <div className="text-xs text-gray-600">AI Score</div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {Object.entries(candidate.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="bg-white p-2 rounded">
                  <div className="text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</div>
                  <div className="font-bold">{Math.round(value)}/100</div>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className="mt-2 text-sm font-semibold">{candidate.recommendation}</div>

            {/* Selection */}
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedForReview.has(candidate.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedForReview);
                    if (e.target.checked) {
                      newSelected.add(candidate.id);
                    } else {
                      newSelected.delete(candidate.id);
                    }
                    setSelectedForReview(newSelected);
                  }}
                  className="cursor-pointer"
                />
                <span>Select for Review</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {selectedForReview.size > 0 && (
        <button
          onClick={() => onSelectCandidates && onSelectCandidates(Array.from(selectedForReview))}
          className="w-full px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
        >
          ✓ Create Shortlist from {selectedForReview.size} Selected
        </button>
      )}
    </div>
  );
}

/**
 * Interview Evaluation Form Component
 */
export function InterviewEvaluationForm({ candidate, onSubmit, onCancel }) {
  const [scores, setScores] = useState({
    technical: 5,
    communication: 5,
    experience: 5,
    cultureFit: 5,
  });
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit({
      candidateId: candidate.id,
      scores,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold">Interview Evaluation: {candidate.applicant.name}</h3>

      {/* Scoring Rubric */}
      <div className="space-y-4">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key}>
            <label className="block font-semibold mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setScores({ ...scores, [key]: num })}
                  className={`w-8 h-8 rounded border ${
                    value === num
                      ? "bg-green-700 text-white border-green-700"
                      : "border-gray-300 hover:border-green-700"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {value < 4 ? 'Needs improvement' : value < 7 ? 'Good' : 'Excellent'}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="block font-semibold mb-2">Evaluation Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add interview feedback and observations..."
          className="w-full border rounded p-2 text-sm"
          rows="4"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800"
        >
          Save Evaluation
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
