import React, { useState, useMemo } from 'react';

/**
 * TestManagement Component
 * Manages the testing phase of the recruitment pipeline (Stage 3 of 5)
 * - Send tests to screened candidates
 * - Track test status (invited, in-progress, completed)
 * - Record test results and move candidates forward/reject
 */
function TestManagement({ 
  applications = [], 
  jobs = [],
  onSendTest, 
  onRecordTestResult 
}) {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, ready, invited, completed
  const [selectedJob, setSelectedJob] = useState('all');
  const [recordResultsFor, setRecordResultsFor] = useState(null);
  const [testResultForm, setTestResultForm] = useState({
    score: '',
    passed: false,
    notes: ''
  });

  // Filter candidates based on test status and job
  const filteredCandidates = useMemo(() => {
    let filtered = applications.filter(app => {
      // Show candidates who are either:
      // 1. In screening (ready to send test)
      // 2. Test invited (awaiting completion)
      // 3. Test completed (need result recording)
      const isRelevant = 
        app.status === 'screening' || 
        app.status === 'test-invited' ||
        (app.testResults && app.testResults.status === 'completed' && !app.testResults.recorded);
      
      if (!isRelevant) return false;

      // Filter by job
      if (selectedJob !== 'all' && app.jobId !== selectedJob) return false;

      // Filter by status
      if (filterStatus === 'ready') return app.status === 'screening';
      if (filterStatus === 'invited') return app.status === 'test-invited';
      if (filterStatus === 'completed') return app.testResults?.status === 'completed';

      return true;
    });

    return filtered;
  }, [applications, selectedJob, filterStatus]);

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id));
    }
  };

  const handleSendTests = () => {
    if (selectedCandidates.length === 0) return;
    onSendTest(selectedCandidates);
    setSelectedCandidates([]);
  };

  const handleOpenRecordResults = (candidate) => {
    setRecordResultsFor(candidate);
    setTestResultForm({
      score: '',
      passed: false,
      notes: ''
    });
  };

  const handleRecordResults = () => {
    if (!recordResultsFor || !testResultForm.score) return;
    
    onRecordTestResult(recordResultsFor.id, {
      score: parseFloat(testResultForm.score),
      passed: testResultForm.passed,
      notes: testResultForm.notes
    });
    
    setRecordResultsFor(null);
  };

  const statusCounts = {
    ready: applications.filter(a => a.status === 'screening' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length,
    invited: applications.filter(a => a.status === 'test-invited' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length,
    completed: applications.filter(a => a.testResults?.status === 'completed' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : 'Unknown Position';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Management</h1>
        <p className="text-gray-600">Send tests and record results for screened candidates</p>
        
        {/* Pipeline Position Indicator */}
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-purple-900">Pipeline Stage 3 of 5</div>
              <div className="text-purple-700 text-xs">
                <span className="opacity-50">AI Screening →</span> 
                <span className="font-bold"> Testing (Current) </span>
                <span className="opacity-50">→ Interview → Offer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Position Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Position</label>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Positions</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.title} ({job.department})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{statusCounts.ready}</div>
              <div className="text-sm text-blue-600">Ready to Send</div>
            </div>
            <svg className="w-10 h-10 text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{statusCounts.invited}</div>
              <div className="text-sm text-yellow-600">Tests Sent</div>
            </div>
            <svg className="w-10 h-10 text-yellow-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">{statusCounts.completed}</div>
              <div className="text-sm text-purple-600">Need Recording</div>
            </div>
            <svg className="w-10 h-10 text-purple-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Status Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.ready + statusCounts.invited + statusCounts.completed})
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'ready'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ready to Send ({statusCounts.ready})
            </button>
            <button
              onClick={() => setFilterStatus('invited')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'invited'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tests Sent ({statusCounts.invited})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'completed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Completed ({statusCounts.completed})
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedCandidates.length > 0 && filterStatus === 'ready' && (
            <button
              onClick={handleSendTests}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Tests to {selectedCandidates.length} Selected
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Info Banners */}
      {filterStatus === 'ready' && statusCounts.ready > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-blue-900">Ready to Send Tests</div>
              <div className="text-sm text-blue-700 mt-1">
                These candidates have completed AI screening. Select candidates and click "Send Tests" to invite them.
              </div>
              <div className="text-xs text-blue-600 mt-2">
                💡 <strong>Workflow tip:</strong> Tests are automatically sent via email. Candidates will complete them online and results will appear in the "Completed" tab.
              </div>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'invited' && statusCounts.invited > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-yellow-900">Tests Sent - Awaiting Completion</div>
              <div className="text-sm text-yellow-700 mt-1">
                Tests have been sent to these candidates. They will appear in "Completed" once they finish.
              </div>
              <div className="text-xs text-yellow-600 mt-2">
                💡 <strong>Workflow tip:</strong> Average completion time is 45-60 minutes. Send reminder emails if tests aren't completed within 48 hours.
              </div>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'completed' && statusCounts.completed > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-purple-900">Tests Completed - Record Results</div>
              <div className="text-sm text-purple-700 mt-1">
                These candidates have completed their tests. Record scores to automatically move them to Interview Management or reject.
              </div>
              <div className="text-xs text-purple-600 mt-2">
                💡 <strong>Workflow tip:</strong> Passing candidates (score ≥ 70%) automatically move to interview stage. Failed candidates can be rejected.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {filterStatus === 'ready' && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">AI Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No candidates found for this filter
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    {filterStatus === 'ready' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => handleSelectCandidate(candidate.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{candidate.applicant?.name || candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.applicant?.email || candidate.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getJobTitle(candidate.jobId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {candidate.aiScore?.toFixed(1) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.status === 'screening' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Ready to Send
                        </span>
                      )}
                      {candidate.status === 'test-invited' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Test Sent
                        </span>
                      )}
                      {candidate.testResults?.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {candidate.status === 'screening' && (
                        <button
                          onClick={() => onSendTest([candidate.id])}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          Send Test
                        </button>
                      )}
                      {candidate.testResults?.status === 'completed' && (
                        <button
                          onClick={() => handleOpenRecordResults(candidate)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Record Results
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Results Modal */}
      {recordResultsFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Record Test Results</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate
                </label>
                <div className="text-sm text-gray-600">{recordResultsFor.applicant?.name || recordResultsFor.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={testResultForm.score}
                  onChange={(e) => {
                    const score = e.target.value;
                    setTestResultForm(prev => ({
                      ...prev,
                      score,
                      passed: parseFloat(score) >= 70
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter score (0-100)"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testResultForm.passed}
                    onChange={(e) => setTestResultForm(prev => ({ ...prev, passed: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Passed (≥70%)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={testResultForm.notes}
                  onChange={(e) => setTestResultForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Add any notes about the test performance..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setRecordResultsFor(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordResults}
                disabled={!testResultForm.score}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestManagement;
