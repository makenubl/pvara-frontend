import React from 'react';

const TestManagement = ({ 
  candidates, 
  jobs,
  onSendTest, 
  onRecordTestResult,
  onMoveToInterview,
  onReject 
}) => {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showTestResultsModal, setShowTestResultsModal] = React.useState(null);
  const [testResultsForm, setTestResultsForm] = React.useState({ 
    score: '', 
    passed: false, 
    notes: '' 
  });
  const [statusFilter, setStatusFilter] = React.useState('all'); // all, pending, invited, completed
  const [selectedJobId, setSelectedJobId] = React.useState('all');
  const [expandedJobs, setExpandedJobs] = React.useState(new Set());

  // Filter candidates by test status - only active test pipeline
  const filteredCandidates = React.useMemo(() => {
    let filtered = candidates.filter(c => 
      c.status === 'screening' || 
      c.status === 'test-invited'
    );

    if (statusFilter === 'pending') {
      // Ready to send test (screening, no test sent yet)
      filtered = filtered.filter(c => c.status === 'screening' && !c.testResults);
    } else if (statusFilter === 'invited') {
      // Test sent, waiting for results
      filtered = filtered.filter(c => c.status === 'test-invited');
    }

    // Filter by selected job
    if (selectedJobId !== 'all') {
      filtered = filtered.filter(c => c.jobId === selectedJobId);
    }

    return filtered;
  }, [candidates, statusFilter, selectedJobId]);

  // Group candidates by job position
  const candidatesByJob = React.useMemo(() => {
    const grouped = {};
    filteredCandidates.forEach(candidate => {
      const jobId = candidate.jobId || 'unknown';
      if (!grouped[jobId]) {
        grouped[jobId] = [];
      }
      grouped[jobId].push(candidate);
    });
    return grouped;
  }, [filteredCandidates]);

  // Toggle job expansion
  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Expand all jobs initially
  React.useEffect(() => {
    setExpandedJobs(new Set(Object.keys(candidatesByJob)));
  }, [candidatesByJob]);

  // Stats - filtered by selected job
  const stats = React.useMemo(() => {
    let allTestCandidates = candidates.filter(c => 
      c.status === 'screening' || 
      c.status === 'test-invited'
    );
    
    // Apply job filter to stats as well
    if (selectedJobId !== 'all') {
      allTestCandidates = allTestCandidates.filter(c => c.jobId === selectedJobId);
    }
    
    return {
      pending: allTestCandidates.filter(c => c.status === 'screening' && !c.testResults).length,
      invited: allTestCandidates.filter(c => c.status === 'test-invited').length,
      total: allTestCandidates.length
    };
  }, [candidates, selectedJobId]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map(c => c.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Test Management
            </h1>
            <p className="text-gray-600 mt-2">
              Send tests to candidates, track completion, and review scores
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-600">Total in Pipeline</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</div>
            <div className="text-xs text-blue-600 mt-1">Active test candidates</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-600">Ready to Send</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
            <div className="text-xs text-yellow-600 mt-1">Awaiting test invitation</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-sm font-medium text-orange-600">Test Invited</div>
            <div className="text-3xl font-bold text-orange-900 mt-2">{stats.invited}</div>
            <div className="text-xs text-orange-600 mt-1">Waiting for results</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Status Filters */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Stage:</label>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Pipeline ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📤 Ready to Send ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('invited')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
                  statusFilter === 'invited'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Awaiting Results ({stats.invited})
              </button>
            </div>
          </div>

          {/* Job Position Filter */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Position:</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full md:w-96 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-medium text-gray-700"
            >
              <option value="all">
                All Positions ({filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''})
              </option>
              {jobs.map(job => {
                const count = filteredCandidates.filter(c => c.jobId === job.id).length;
                if (count === 0) return null;
                return (
                  <option key={job.id} value={job.id}>
                    {job.title} ({count} candidate{count !== 1 ? 's' : ''})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
          <strong className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Sequential Workflow:
          </strong> Recording test results automatically progresses candidates:
          <div className="mt-1 ml-4">
            • <strong>Pass</strong> → Auto-moved to Interview stage (visible in HR Review → Interview tab)
            <br/>
            • <strong>Fail</strong> → Auto-rejected (visible in HR Review → Rejected tab, can be reconsidered)
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="font-semibold text-green-900">
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            {/* Show Send Test only for candidates in "Ready to Send" status */}
            {(() => {
              const selectedCandidates = filteredCandidates.filter(c => selectedIds.includes(c.id));
              const readyToSend = selectedCandidates.filter(c => !c.testResults);
              const awaitingResults = selectedCandidates.filter(c => c.testResults?.status === 'invited');
              
              return (
                <>
                  {readyToSend.length > 0 && (
                    <button
                      onClick={() => {
                        onSendTest?.(readyToSend.map(c => c.id));
                        setSelectedIds([]);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Send Test to {readyToSend.length} Candidate{readyToSend.length !== 1 ? 's' : ''}
                    </button>
                  )}
                  {awaitingResults.length > 0 && readyToSend.length === 0 && (
                    <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Selected candidates already have tests sent. Use "Record Results" button on each card.
                    </div>
                  )}
                </>
              );
            })()}
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">No candidates in this stage</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedIds.length === filteredCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="text-sm text-gray-600">
                {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Candidates Grouped by Job */}
            <div className="space-y-6">
              {Object.entries(candidatesByJob).map(([jobId, jobCandidates]) => {
                const job = jobs.find(j => j.id === jobId);
                const isExpanded = expandedJobs.has(jobId);
                
                return (
                  <div key={jobId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Job Header */}
                    <button
                      onClick={() => toggleJobExpansion(jobId)}
                      className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-5 h-5 text-indigo-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {job?.title || 'Unknown Position'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {jobCandidates.length} candidate{jobCandidates.length !== 1 ? 's' : ''} in test pipeline
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
                          {jobCandidates.length}
                        </span>
                      </div>
                    </button>

                    {/* Candidates List */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        {jobCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition ${
                    selectedIds.includes(candidate.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(candidate.id)}
                      onChange={() => handleSelect(candidate.id)}
                      className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />

                    {/* Candidate Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{candidate.applicant?.name || candidate.name || 'Unknown'}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {candidate.applicant?.email || candidate.email || 'N/A'}
                            </span>
                            <span>📱 {candidate.applicant?.phone || candidate.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              🎓 {candidate.applicant?.degree || candidate.degree || 'N/A'}
                            </span>
                            {candidate.applicant?.cnic && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                🆔 {candidate.applicant.cnic}
                              </span>
                            )}
                            {candidate.aiScore !== undefined && candidate.aiScore !== null && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                🤖 AI: {candidate.aiScore}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {!candidate.testResults && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Ready to Send
                            </span>
                          )}
                          {candidate.testResults?.status === 'invited' && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Test Sent
                            </span>
                          )}
                          {candidate.testResults?.status === 'completed' && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              candidate.testResults.passed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {candidate.testResults.passed ? '✓' : '✗'} Score: {candidate.testResults.score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Test Results Display */}
                      {candidate.testResults && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Invited:</span>
                              <div className="font-medium text-gray-900">
                                {new Date(candidate.testResults.invitedAt).toLocaleDateString()}
                              </div>
                            </div>
                            {candidate.testResults.completedAt && (
                              <div>
                                <span className="text-gray-600">Completed:</span>
                                <div className="font-medium text-gray-900">
                                  {new Date(candidate.testResults.completedAt).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                            {candidate.testResults.score !== null && (
                              <div>
                                <span className="text-gray-600">Score:</span>
                                <div className="font-bold text-xl">
                                  {candidate.testResults.score}%
                                </div>
                              </div>
                            )}
                          </div>
                          {candidate.testResults.notes && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {candidate.testResults.notes}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {!candidate.testResults && (
                          <button
                            onClick={() => onSendTest?.([candidate.id])}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Send Test
                          </button>
                        )}
                        
                        {candidate.testResults?.status === 'invited' && (
                          <>
                            <button
                              onClick={() => {
                                setShowTestResultsModal(candidate.id);
                                setTestResultsForm({ score: '', passed: false, notes: '' });
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              Record Results
                            </button>
                            <button
                              onClick={() => onReject?.(candidate.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {candidate.testResults?.status === 'completed' && (
                          <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm font-medium italic">
                            {candidate.testResults.passed 
                              ? '✓ Auto-moved to Interview' 
                              : '✗ Auto-rejected'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Test Results Modal */}
      {showTestResultsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Record Test Results</h3>
              <button
                onClick={() => setShowTestResultsModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Test Score (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={testResultsForm.score}
                  onChange={(e) => setTestResultsForm(prev => ({ ...prev, score: e.target.value }))}
                  placeholder="Enter score (0-100)"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Pass/Fail */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Result
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTestResultsForm(prev => ({ ...prev, passed: true }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      testResultsForm.passed
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Passed
                  </button>
                  <button
                    onClick={() => setTestResultsForm(prev => ({ ...prev, passed: false }))}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      !testResultsForm.passed
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ Failed
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={testResultsForm.notes}
                  onChange={(e) => setTestResultsForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional observations..."
                  className="w-full border rounded-lg p-2 h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  if (!testResultsForm.score) {
                    alert('Please enter a test score');
                    return;
                  }
                  onRecordTestResult?.(showTestResultsModal, {
                    score: parseInt(testResultsForm.score),
                    passed: testResultsForm.passed,
                    notes: testResultsForm.notes
                  });
                  setShowTestResultsModal(null);
                  setTestResultsForm({ score: '', passed: false, notes: '' });
                }}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-semibold"
              >
                Save Results
              </button>
              <button
                onClick={() => setShowTestResultsModal(null)}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
