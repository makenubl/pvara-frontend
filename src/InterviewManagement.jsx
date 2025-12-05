import React from 'react';

const InterviewManagement = ({ 
  candidates, 
  jobs,
  onInterviewFeedback,
  onAddToShortlist,
  onReject,
  shortlists = []
}) => {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showInterviewModal, setShowInterviewModal] = React.useState(null);
  const [showAddToShortlistModal, setShowAddToShortlistModal] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState('all'); // all, pending, completed
  const [selectedJobId, setSelectedJobId] = React.useState('all');
  const [expandedJobs, setExpandedJobs] = React.useState(new Set());
  const [interviewFeedback, setInterviewFeedback] = React.useState({
    technicalRating: 3,
    communicationRating: 3,
    cultureFitRating: 3,
    comments: '',
    recommendation: 'maybe',
    strengths: '',
    weaknesses: '',
    detailedNotes: ''
  });

  // Filter candidates by interview status - only active interview pipeline
  const filteredCandidates = React.useMemo(() => {
    let filtered = candidates.filter(c => c.status === 'interview' || c.status === 'phone-interview');

    if (statusFilter === 'pending') {
      // No feedback yet
      filtered = filtered.filter(c => !c.interviewFeedback);
    } else if (statusFilter === 'completed') {
      // Has feedback
      filtered = filtered.filter(c => c.interviewFeedback);
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
    let allInterviewCandidates = candidates.filter(c => 
      c.status === 'interview' || c.status === 'phone-interview'
    );
    
    // Apply job filter to stats as well
    if (selectedJobId !== 'all') {
      allInterviewCandidates = allInterviewCandidates.filter(c => c.jobId === selectedJobId);
    }
    
    return {
      pending: allInterviewCandidates.filter(c => !c.interviewFeedback).length,
      completed: allInterviewCandidates.filter(c => c.interviewFeedback).length,
      total: allInterviewCandidates.length
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

  const handleOpenInterviewModal = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.interviewFeedback) {
      setInterviewFeedback(candidate.interviewFeedback);
    } else {
      setInterviewFeedback({
        technicalRating: 3,
        communicationRating: 3,
        cultureFitRating: 3,
        comments: '',
        recommendation: 'maybe',
        strengths: '',
        weaknesses: '',
        detailedNotes: ''
      });
    }
    setShowInterviewModal(candidateId);
  };

  const handleSubmitInterview = () => {
    if (!interviewFeedback.comments.trim()) {
      alert('Please provide comments about the interview');
      return;
    }
    onInterviewFeedback?.(showInterviewModal, interviewFeedback);
    setShowInterviewModal(null);
    setInterviewFeedback({
      technicalRating: 3,
      communicationRating: 3,
      cultureFitRating: 3,
      comments: '',
      recommendation: 'maybe',
      strengths: '',
      weaknesses: '',
      detailedNotes: ''
    });
  };

  const handleAddToShortlist = () => {
    const shortlistName = prompt('Enter shortlist name:');
    if (shortlistName) {
      selectedIds.forEach(id => {
        onAddToShortlist?.(id, shortlistName);
      });
      setSelectedIds([]);
      setShowAddToShortlistModal(false);
    }
  };

  const overallScore = ((interviewFeedback.technicalRating + interviewFeedback.communicationRating + interviewFeedback.cultureFitRating) / 3).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Interview Management
            </h1>
            <p className="text-gray-600 mt-2">
              Schedule interviews, collect feedback, and make hiring decisions
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-600">Total in Pipeline</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</div>
            <div className="text-xs text-blue-600 mt-1">Active interview candidates</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-600">Pending Feedback</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
            <div className="text-xs text-yellow-600 mt-1">Awaiting interview evaluation</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm font-medium text-green-600">Feedback Completed</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.completed}</div>
            <div className="text-xs text-green-600 mt-1">Ready for decision</div>
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
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pending Feedback ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed ({stats.completed})
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
                    💼 {job.title} ({count} candidate{count !== 1 ? 's' : ''})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
          <strong>⚠️ Sequential Workflow:</strong> After interview feedback, move candidates to shortlist or reject them.
          <div className="mt-1 ml-4">
            • <strong>Add to Shortlist</strong> → Final candidates for hiring decision
            <br/>
            • <strong>Reject</strong> → Candidate doesn't meet requirements (can be reconsidered from HR Review)
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
            {(() => {
              const selectedCandidates = filteredCandidates.filter(c => selectedIds.includes(c.id));
              const withFeedback = selectedCandidates.filter(c => c.interviewFeedback);
              const withoutFeedback = selectedCandidates.filter(c => !c.interviewFeedback);
              
              return (
                <>
                  {withFeedback.length > 0 && (
                    <button
                      onClick={() => setShowAddToShortlistModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Add {withFeedback.length} to Shortlist
                    </button>
                  )}
                  {withoutFeedback.length > 0 && withFeedback.length === 0 && (
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Complete interview feedback first before shortlisting
                    </div>
                  )}
                  <button
                    onClick={() => {
                      selectedIds.forEach(id => onReject?.(id));
                      setSelectedIds([]);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Reject Selected
                  </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">No candidates in interview stage</p>
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
                      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-5 h-5 text-blue-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-900 text-lg">
                            💼 {job?.title || 'Unknown Position'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {jobCandidates.length} candidate{jobCandidates.length !== 1 ? 's' : ''} in interview stage
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
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
                            <span>📧 {candidate.applicant?.email || candidate.email || 'N/A'}</span>
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
                            {candidate.testResults?.score && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                📝 Test: {candidate.testResults.score}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {!candidate.interviewFeedback && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                              📋 Pending Feedback
                            </span>
                          )}
                          {candidate.interviewFeedback && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              ✅ Feedback Complete
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interview Feedback Display */}
                      {candidate.interviewFeedback && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Technical:</span>
                              <div className="font-bold text-blue-900">
                                {candidate.interviewFeedback.technicalRating}/5
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Communication:</span>
                              <div className="font-bold text-blue-900">
                                {candidate.interviewFeedback.communicationRating}/5
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Culture Fit:</span>
                              <div className="font-bold text-blue-900">
                                {candidate.interviewFeedback.cultureFitRating}/5
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Overall:</span>
                              <div className="font-bold text-xl text-blue-900">
                                {candidate.interviewFeedback.overallScore}/5
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                              candidate.interviewFeedback.recommendation === 'hire' ? 'bg-green-100 text-green-700' :
                              candidate.interviewFeedback.recommendation === 'no-hire' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {candidate.interviewFeedback.recommendation === 'hire' ? '✅ Hire' :
                               candidate.interviewFeedback.recommendation === 'no-hire' ? '❌ No Hire' :
                               '🤔 Maybe'}
                            </div>
                            <div className="text-xs text-gray-500">
                              By {candidate.interviewFeedback.interviewer} • {new Date(candidate.interviewFeedback.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          {candidate.interviewFeedback.comments && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium">Comments:</span> {candidate.interviewFeedback.comments}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleOpenInterviewModal(candidate.id)}
                          className={`px-3 py-1.5 rounded text-sm font-medium ${
                            candidate.interviewFeedback
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {candidate.interviewFeedback ? '✏️ Edit Feedback' : '📋 Add Feedback'}
                        </button>
                        
                        {candidate.interviewFeedback && (
                          <button
                            onClick={() => {
                              const shortlistName = prompt('Enter shortlist name:');
                              if (shortlistName) {
                                onAddToShortlist?.(candidate.id, shortlistName);
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 font-medium"
                          >
                            ⭐ Add to Shortlist
                          </button>
                        )}

                        <button
                          onClick={() => onReject?.(candidate.id)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                        >
                          Reject
                        </button>
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

      {/* Interview Feedback Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-4 my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Interview Feedback</h3>
              <button
                onClick={() => setShowInterviewModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Technical Skills Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Technical Skills
                  <span className="ml-2 text-base font-bold text-blue-600">{interviewFeedback.technicalRating}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interviewFeedback.technicalRating}
                  onChange={(e) => setInterviewFeedback({...interviewFeedback, technicalRating: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Communication Skills Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Communication Skills
                  <span className="ml-2 text-base font-bold text-blue-600">{interviewFeedback.communicationRating}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interviewFeedback.communicationRating}
                  onChange={(e) => setInterviewFeedback({...interviewFeedback, communicationRating: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Culture Fit Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Culture Fit
                  <span className="ml-2 text-base font-bold text-blue-600">{interviewFeedback.cultureFitRating}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interviewFeedback.cultureFitRating}
                  onChange={(e) => setInterviewFeedback({...interviewFeedback, cultureFitRating: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Overall Score Display */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Overall Score:</span>
                  <span className="text-2xl font-bold text-blue-900">{overallScore}/5</span>
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hiring Recommendation *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInterviewFeedback({...interviewFeedback, recommendation: 'hire'})}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      interviewFeedback.recommendation === 'hire'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✅ Hire
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewFeedback({...interviewFeedback, recommendation: 'maybe'})}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      interviewFeedback.recommendation === 'maybe'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🤔 Maybe
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewFeedback({...interviewFeedback, recommendation: 'no-hire'})}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      interviewFeedback.recommendation === 'no-hire'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ❌ No Hire
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Interview Comments *
                </label>
                <textarea
                  value={interviewFeedback.comments}
                  onChange={(e) => setInterviewFeedback({...interviewFeedback, comments: e.target.value})}
                  placeholder="Provide detailed feedback about the interview..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Strengths (optional)
                  </label>
                  <textarea
                    value={interviewFeedback.strengths}
                    onChange={(e) => setInterviewFeedback({...interviewFeedback, strengths: e.target.value})}
                    placeholder="Key strengths..."
                    className="w-full border border-gray-300 rounded-lg p-2 h-20 resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Weaknesses (optional)
                  </label>
                  <textarea
                    value={interviewFeedback.weaknesses}
                    onChange={(e) => setInterviewFeedback({...interviewFeedback, weaknesses: e.target.value})}
                    placeholder="Areas for improvement..."
                    className="w-full border border-gray-300 rounded-lg p-2 h-20 resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={handleSubmitInterview}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
                >
                  Save Feedback
                </button>
                <button
                  onClick={() => setShowInterviewModal(null)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Shortlist Modal */}
      {showAddToShortlistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Add to Shortlist</h3>
            <p className="text-gray-600 mb-4">
              Add {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} to a shortlist
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAddToShortlist}
                className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowAddToShortlistModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
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

export default InterviewManagement;
