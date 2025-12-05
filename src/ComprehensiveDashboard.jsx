import React, { useState, useMemo } from "react";

/**
 * Comprehensive End-to-End Dashboard Component
 * Shows the complete recruitment workflow from jobs → applications → interviews → offers
 */
export function ComprehensiveDashboard({ state, onGenerateTestData }) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [expandedJob, setExpandedJob] = useState(null);

  // Extract data from state - memoized to prevent dependency issues
  const jobs = useMemo(() => state.jobs || [], [state.jobs]);
  const applications = useMemo(() => state.applications || [], [state.applications]);
  const candidates = useMemo(() => state.candidates || [], [state.candidates]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const statusCounts = {};
    applications.forEach((app) => {
      const status = app.status || "submitted";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const jobMetrics = jobs.map((job) => {
      const jobApps = applications.filter((a) => a.jobId === job.id);
      return {
        id: job.id,
        title: job.title,
        department: job.department,
        openings: job.openings || 1,
        applicationsCount: jobApps.length,
        byStatus: {
          submitted: jobApps.filter((a) => a.status === "submitted").length,
          screening: jobApps.filter((a) => a.status === "screening").length,
          interviewed: jobApps.filter(
            (a) => a.status === "interviewed"
          ).length,
          offer: jobApps.filter((a) => a.status === "offer").length,
          rejected: jobApps.filter((a) => a.status === "rejected").length,
          hired: jobApps.filter((a) => a.status === "hired").length,
        },
      };
    });

    return {
      totalJobs: jobs.length,
      totalApplications: applications.length,
      totalCandidates: candidates.length,
      statusCounts,
      jobMetrics,
      applicationsByStatus: statusCounts,
    };
  }, [jobs, applications, candidates]);

  // Calculate funnel data
  const funnelData = useMemo(() => {
    const submitted = applications.filter((a) => a.status === "submitted").length;
    const screening = applications.filter((a) => a.status === "screening").length;
    const interviewed = applications.filter((a) => a.status === "interviewed").length;
    const offer = applications.filter((a) => a.status === "offer").length;
    const hired = applications.filter((a) => a.status === "hired").length;

    return [
      { stage: "Applications", count: submitted, percentage: 100 },
      {
        stage: "Screening",
        count: screening,
        percentage: submitted > 0 ? Math.round((screening / submitted) * 100) : 0,
      },
      {
        stage: "Interviewed",
        count: interviewed,
        percentage: submitted > 0 ? Math.round((interviewed / submitted) * 100) : 0,
      },
      {
        stage: "Offers",
        count: offer,
        percentage: submitted > 0 ? Math.round((offer / submitted) * 100) : 0,
      },
      {
        stage: "Hired",
        count: hired,
        percentage: submitted > 0 ? Math.round((hired / submitted) * 100) : 0,
      },
    ];
  }, [applications]);

  const getStatusColor = (status) => {
    const colors = {
      submitted: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      screening: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
      interviewed: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
      offer: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
      hired: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    };
    return colors[status] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Recruitment Dashboard</h2>
        {onGenerateTestData && metrics.totalApplications === 0 && (
          <button
            onClick={onGenerateTestData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Test Data
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "jobs", label: "Jobs & Pipeline", icon: "💼" },
          { id: "applications", label: "Applications", icon: "📝" },
          { id: "candidates", label: "Candidates", icon: "👥" },
          { id: "funnel", label: "Funnel", icon: "📈" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              selectedTab === tab.id
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-600 hover:text-green-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Jobs"
              value={metrics.totalJobs}
              icon="💼"
              bgColor="bg-blue-50"
              textColor="text-blue-700"
            />
            <MetricCard
              label="Total Applications"
              value={metrics.totalApplications}
              icon="📝"
              bgColor="bg-purple-50"
              textColor="text-purple-700"
            />
            <MetricCard
              label="Unique Candidates"
              value={metrics.totalCandidates}
              icon="👥"
              bgColor="bg-green-50"
              textColor="text-green-700"
            />
            <MetricCard
              label="Offers Sent"
              value={metrics.applicationsByStatus.offer || 0}
              icon="🎉"
              bgColor="bg-yellow-50"
              textColor="text-yellow-700"
            />
          </div>

          {/* Application Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Application Status Distribution</h3>
              <div className="space-y-3">
                {[
                  { status: "submitted", label: "Submitted" },
                  { status: "screening", label: "Screening" },
                  { status: "interviewed", label: "Interviewed" },
                  { status: "offer", label: "Offer" },
                  { status: "hired", label: "Hired" },
                  { status: "rejected", label: "Rejected" },
                ].map((item) => {
                  const count = metrics.applicationsByStatus[item.status] || 0;
                  const percentage =
                    metrics.totalApplications > 0
                      ? Math.round((count / metrics.totalApplications) * 100)
                      : 0;
                  const colors = getStatusColor(item.status);
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bg} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Jobs by Applications */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Jobs by Applications</h3>
              <div className="space-y-3">
                {metrics.jobMetrics
                  .sort((a, b) => b.applicationsCount - a.applicationsCount)
                  .slice(0, 5)
                  .map((job) => (
                    <div
                      key={job.id}
                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">{job.title}</div>
                          <div className="text-xs text-gray-500">{job.department}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-green-700">{job.applicationsCount}</div>
                          <div className="text-xs text-gray-500">/ {job.openings} opening{job.openings !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {Object.entries(job.byStatus).map(
                          ([status, count]) =>
                            count > 0 && (
                              <span
                                key={status}
                                className={`px-2 py-1 rounded ${getStatusColor(status).bg} ${
                                  getStatusColor(status).text
                                }`}
                              >
                                {status}: {count}
                              </span>
                            )
                        )}
                      </div>
                    </div>
                  ))}
                {metrics.jobMetrics.length === 0 && (
                  <div className="text-center text-gray-500 py-6">No jobs created yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox
                label="Avg Applications per Job"
                value={
                  metrics.totalJobs > 0
                    ? (metrics.totalApplications / metrics.totalJobs).toFixed(1)
                    : "0"
                }
              />
              <StatBox
                label="Hire Rate"
                value={
                  metrics.totalApplications > 0
                    ? `${Math.round(
                        ((metrics.applicationsByStatus.hired || 0) / metrics.totalApplications) * 100
                      )}%`
                    : "0%"
                }
              />
              <StatBox
                label="Rejection Rate"
                value={
                  metrics.totalApplications > 0
                    ? `${Math.round(
                        ((metrics.applicationsByStatus.rejected || 0) / metrics.totalApplications) * 100
                      )}%`
                    : "0%"
                }
              />
              <StatBox
                label="Pending Offers"
                value={metrics.applicationsByStatus.offer || 0}
              />
            </div>
          </div>
        </div>
      )}

      {/* Jobs & Pipeline Tab */}
      {selectedTab === "jobs" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Jobs & Their Pipeline</h3>
          {metrics.jobMetrics.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-gray-500 text-lg">No jobs created yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.jobMetrics.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div
                    className="p-5 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-700 cursor-pointer hover:shadow-md transition"
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800 mb-1">{job.title}</h4>
                        <p className="text-sm text-gray-600">
                          {job.department} • {job.openings} opening{job.openings !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">{job.applicationsCount}</div>
                        <div className="text-xs text-gray-500">Total Applications</div>
                      </div>
                      <div className="ml-4 text-xl">{expandedJob === job.id ? "▼" : "▶"}</div>
                    </div>
                  </div>

                  {/* Pipeline breakdown */}
                  {expandedJob === job.id && (
                    <div className="p-5 border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        {[
                          { key: "submitted", label: "Submitted", color: "blue" },
                          { key: "screening", label: "Screening", color: "purple" },
                          { key: "interviewed", label: "Interviewed", color: "orange" },
                          { key: "offer", label: "Offers", color: "yellow" },
                          { key: "hired", label: "Hired", color: "green" },
                          { key: "rejected", label: "Rejected", color: "red" },
                        ].map((stage) => (
                          <div
                            key={stage.key}
                            className={`p-3 rounded text-center border-2 border-${stage.color}-200 bg-${stage.color}-50`}
                          >
                            <div className={`text-2xl font-bold text-${stage.color}-700`}>
                              {job.byStatus[stage.key] || 0}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{stage.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Conversion rates */}
                      <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                        <h5 className="font-semibold text-sm mb-3 text-gray-800">Conversion Rates</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Submitted → Screening</span>
                            <span className="font-semibold">
                              {job.byStatus.submitted > 0
                                ? Math.round(
                                    (job.byStatus.screening / job.byStatus.submitted) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Screening → Interview</span>
                            <span className="font-semibold">
                              {job.byStatus.screening > 0
                                ? Math.round(
                                    (job.byStatus.interviewed / job.byStatus.screening) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interview → Offer</span>
                            <span className="font-semibold">
                              {job.byStatus.interviewed > 0
                                ? Math.round((job.byStatus.offer / job.byStatus.interviewed) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {selectedTab === "applications" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">All Applications</h3>
          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-gray-500 text-lg">No applications yet</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {applications.slice(0, 20).map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);
                const statusColors = getStatusColor(app.status);
                return (
                  <div
                    key={app.id}
                    className={`p-4 rounded-lg border-l-4 ${statusColors.border} ${statusColors.bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{app.applicant?.name}</div>
                        <div className="text-sm text-gray-600">{app.applicant?.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Position: {job?.title || "Unknown"} • Applied:{" "}
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                        {app.applicant?.degree && (
                          <div className="text-xs text-gray-600 mt-1">
                            📚 {app.applicant.degree} • 💼{" "}
                            {app.applicant.experienceYears || "N/A"} yrs
                          </div>
                        )}
                      </div>
                      <div className={`text-right ${statusColors.text}`}>
                        <div className="text-sm font-bold">{app.status.replace(/-/g, " ").toUpperCase()}</div>
                        {app.aiScore && (
                          <div className="text-xs mt-1">
                            AI Score: <span className="font-semibold">{app.aiScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {applications.length > 20 && (
                <div className="text-center text-gray-500 text-sm p-4">
                  Showing 20 of {applications.length} applications
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Candidates Tab */}
      {selectedTab === "candidates" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Candidate Profiles</h3>
          {candidates.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="text-gray-500 text-lg">No candidates have applied yet</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {candidates.slice(0, 20).map((candidate) => {
                const candidateApps = applications.filter((app) =>
                  candidate.applications?.includes(app.id)
                );
                const statuses = candidateApps.map((a) => a.status);
                const uniqueStatuses = [...new Set(statuses)];

                return (
                  <div key={candidate.cnic} className="p-4 bg-white rounded-lg shadow border-l-4 border-blue-500 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-800">{candidate.name}</div>
                        <div className="text-sm text-gray-600">{candidate.primaryEmail}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          CNIC: {candidate.cnic} • Phone: {candidate.phone}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{candidateApps.length}</div>
                        <div className="text-xs text-gray-500">Applications</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {uniqueStatuses.map((status) => {
                        const colors = getStatusColor(status);
                        return (
                          <span
                            key={status}
                            className={`px-2 py-1 text-xs rounded font-medium ${colors.bg} ${colors.text}`}
                          >
                            {status.replace(/-/g, " ")}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {candidates.length > 20 && (
                <div className="text-center text-gray-500 text-sm p-4">
                  Showing 20 of {candidates.length} candidates
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Funnel Tab */}
      {selectedTab === "funnel" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Recruitment Funnel</h3>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="space-y-6">
              {funnelData.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-800">{stage.stage}</span>
                    <span className="font-bold text-lg text-gray-900">{stage.count}</span>
                  </div>
                  <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full flex items-center justify-center font-semibold text-white transition-all ${
                        index === 0
                          ? "bg-blue-500"
                          : index === 1
                          ? "bg-purple-500"
                          : index === 2
                          ? "bg-orange-500"
                          : index === 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                    >
                      {stage.percentage > 10 && `${stage.percentage}%`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stage.percentage}% of submitted applications
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel Insights */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-4">Funnel Insights</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  • <strong>Screening Conversion:</strong>{" "}
                  {funnelData[0].count > 0
                    ? Math.round((funnelData[1].count / funnelData[0].count) * 100)
                    : 0}
                  % of applications advance to screening
                </div>
                <div>
                  • <strong>Interview Conversion:</strong>{" "}
                  {funnelData[1].count > 0
                    ? Math.round((funnelData[2].count / funnelData[1].count) * 100)
                    : 0}
                  % of screened candidates are interviewed
                </div>
                <div>
                  • <strong>Offer Rate:</strong>{" "}
                  {funnelData[2].count > 0
                    ? Math.round((funnelData[3].count / funnelData[2].count) * 100)
                    : 0}
                  % of interviewed candidates receive offers
                </div>
                <div>
                  • <strong>Hire Rate:</strong>{" "}
                  {funnelData[3].count > 0
                    ? Math.round((funnelData[4].count / funnelData[3].count) * 100)
                    : 0}
                  % of offers are accepted
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({ label, value, icon, bgColor = "bg-gray-50", textColor = "text-gray-700" }) {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow border-l-4 border-green-700`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
          <div className={`text-4xl font-bold ${textColor} mt-2`}>{value}</div>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
      <div className="text-xs text-gray-600 font-medium mb-2">{label}</div>
      <div className="text-2xl font-bold text-green-700">{value}</div>
    </div>
  );
}

export default ComprehensiveDashboard;
