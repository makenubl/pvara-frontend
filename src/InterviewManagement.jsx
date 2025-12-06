import React, { useState, useMemo } from 'react';

/**
 * InterviewManagement Component
 * Manages the interview phase of the recruitment pipeline (Stage 4 of 5)
 * - Schedule interviews with candidates
 * - Collect interviewer feedback (4 rating categories: technical, communication, culture fit, problem solving)
 * - Track interview completion and ratings
 * - Move candidates forward or reject based on feedback
 */
function InterviewManagement({ 
  applications = [], 
  jobs = [],
  onInterviewFeedback,
  onAddToShortlist 
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [selectedJob, setSelectedJob] = useState('all');
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    technicalRating: 5,
    communicationRating: 5,
    cultureFitRating: 5,
    problemSolvingRating: 5,
    recommendation: 'hire',
    notes: ''
  });

  // Filter candidates in interview stage
  const filteredCandidates = useMemo(() => {
    let filtered = applications.filter(app => {
      // Show candidates who are in interview stages
      const isInterview = app.status === 'interview' || app.status === 'phone-interview';
      
      if (!isInterview) return false;

      // Filter by job (handle populated jobId)
      const appJobId = typeof app.jobId === 'object' ? app.jobId._id : app.jobId;
      if (selectedJob !== 'all' && appJobId !== selectedJob) return false;

      // Filter by feedback status
      if (filterStatus === 'pending') return !app.interviewFeedback;
      if (filterStatus === 'completed') return !!app.interviewFeedback;

      return true;
    });

    return filtered;
  }, [applications, selectedJob, filterStatus]);

  const handleOpenFeedback = (candidate) => {
    setFeedbackFor(candidate);
    setFeedbackForm({
      technicalRating: 5,
      communicationRating: 5,
      cultureFitRating: 5,
      problemSolvingRating: 5,
      recommendation: 'hire',
      notes: ''
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackFor) return;
    
    onInterviewFeedback(feedbackFor._id || feedbackFor.id, feedbackForm);
    setFeedbackFor(null);
  };

  // Helper to extract jobId from populated object
  const getJobId = (jobId) => {
    if (!jobId) return null;
    return typeof jobId === 'object' ? jobId._id : jobId;
  };

  const statusCounts = {
    pending: applications.filter(a => (a.status === 'interview' || a.status === 'phone-interview') && !a.interviewFeedback && (!selectedJob || selectedJob === 'all' || getJobId(a.jobId) === selectedJob)).length,
    completed: applications.filter(a => (a.status === 'interview' || a.status === 'phone-interview') && a.interviewFeedback && (!selectedJob || selectedJob === 'all' || getJobId(a.jobId) === selectedJob)).length
  };

  const getJobTitle = (jobId) => {
    // Handle populated jobId object
    if (typeof jobId === 'object' && jobId.title) {
      return jobId.title;
    }
    const actualJobId = getJobId(jobId);
    const job = jobs.find(j => (j._id || j.id) === actualJobId);
    return job ? job.title : 'Unknown Position';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Management</h1>
        <p className="text-gray-600">Conduct interviews and provide feedback on candidates</p>
        
        {/* Sequential Workflow Indicator */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 flex-shrink-0 opacity-50">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-xs">1</div>
                <div className="text-xs font-medium text-gray-600 mt-1">HR Review</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 opacity-50">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-xs">2</div>
                <div className="text-xs font-medium text-gray-600 mt-1">AI Screening</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 opacity-50">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-400 text-white flex items-center justify-center font-bold text-xs">3</div>
                <div className="text-xs font-medium text-gray-600 mt-1">Test</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg ring-4 ring-blue-200">4</div>
                <div className="text-xs font-bold text-blue-900 mt-1">Interview</div>
                <div className="text-xs text-blue-600 font-medium">Current</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            
            <div className="flex flex-col items-center flex-shrink-0 opacity-30">
              <div className="w-8 h-8 rounded-full bg-green-400 text-white flex items-center justify-center font-bold text-xs">5</div>
              <div className="text-xs font-medium text-gray-600 mt-1">Offer</div>
            </div>
          </div>
          <p className="text-xs text-gray-700 mt-3 italic">
            <svg className="w-4 h-4 inline-block text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong> Stage 4 of 5:</strong> Conduct interviews and provide feedback. Candidates with hire recommendation or score ≥7.0 become eligible for Offer Management.
          </p>
        </div>
      </div>

      {/* Job Position Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Position</label>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Positions</option>
          {jobs.map(job => (
            <option key={job._id || job.id} value={job._id || job.id}>
              {job.title} ({job.department})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</div>
              <div className="text-sm text-yellow-600">Pending Feedback</div>
              <div className="text-xs text-yellow-500 mt-1">Awaiting evaluation</div>
            </div>
            <svg className="w-10 h-10 text-yellow-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{statusCounts.completed}</div>
              <div className="text-sm text-blue-600">Completed</div>
              <div className="text-xs text-blue-500 mt-1">Ready for next stage</div>
            </div>
            <svg className="w-10 h-10 text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
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
              All ({statusCounts.pending + statusCounts.completed})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Feedback ({statusCounts.pending})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed ({statusCounts.completed})
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Info Banners */}
      {filterStatus === 'pending' && statusCounts.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-yellow-900">Pending Feedback</div>
              <div className="text-sm text-yellow-700 mt-1">
                These candidates are awaiting interview feedback. Provide ratings across 4 categories to complete evaluation.
              </div>
              <div className="text-xs text-yellow-600 mt-2">
                💡 <strong>Rating System:</strong> Technical Skills, Communication, Culture Fit, Problem Solving (1-10 each). Overall score is the average of all 4 ratings.
              </div>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'completed' && statusCounts.completed > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-blue-900">Interviews Completed</div>
              <div className="text-sm text-blue-700 mt-1">
                Feedback has been recorded. Strong candidates (score ≥7.0 or "Hire" recommendation) are eligible for offers.
              </div>
              <div className="text-xs text-blue-600 mt-2">
                💡 <strong>Next step:</strong> Navigate to Offer Management to extend offers to qualified candidates. Rejected candidates remain in interview status until formally rejected.
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Test Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Interview Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recommendation</th>
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
                  <tr key={candidate._id || candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{candidate.applicant?.name || candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.applicant?.email || candidate.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getJobTitle(candidate.jobId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {candidate.testResults?.score ? `${candidate.testResults.score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.interviewFeedback ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(candidate.interviewFeedback.overallScore) >= 7.0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.interviewFeedback.overallScore}/10
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {candidate.interviewFeedback?.recommendation === 'hire' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Hire
                        </span>
                      )}
                      {candidate.interviewFeedback?.recommendation === 'reject' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Reject
                        </span>
                      )}
                      {candidate.interviewFeedback?.recommendation === 'maybe' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Maybe
                        </span>
                      )}
                      {!candidate.interviewFeedback && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!candidate.interviewFeedback ? (
                        <button
                          onClick={() => handleOpenFeedback(candidate)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Add Feedback
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenFeedback(candidate)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                        >
                          Edit Feedback
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

      {/* Interview Feedback Modal */}
      {feedbackFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-lg font-bold mb-4">Interview Feedback</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate
                </label>
                <div className="text-sm text-gray-600">{feedbackFor.applicant?.name || feedbackFor.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technical Skills (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={feedbackForm.technicalRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, technicalRating: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Communication (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={feedbackForm.communicationRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, communicationRating: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Culture Fit (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={feedbackForm.cultureFitRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, cultureFitRating: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Solving (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={feedbackForm.problemSolvingRating}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, problemSolvingRating: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Score (Calculated)
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {((feedbackForm.technicalRating + feedbackForm.communicationRating + feedbackForm.cultureFitRating + feedbackForm.problemSolvingRating) / 4).toFixed(1)} / 10
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendation
                </label>
                <select
                  value={feedbackForm.recommendation}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hire">Hire</option>
                  <option value="maybe">Maybe</option>
                  <option value="reject">Reject</option>
                </select>
              </div>

              {/* Next Stage Indicator */}
              {(() => {
                const overallScore = ((feedbackForm.technicalRating + feedbackForm.communicationRating + feedbackForm.cultureFitRating + feedbackForm.problemSolvingRating) / 4).toFixed(1);
                const isEligibleForOffer = feedbackForm.recommendation === 'hire' || parseFloat(overallScore) >= 7.0;
                
                return (
                  <div className={`p-3 rounded-lg border-2 ${
                    isEligibleForOffer
                      ? 'bg-green-50 border-green-200' 
                      : feedbackForm.recommendation === 'maybe'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={
                        isEligibleForOffer ? 'text-green-800' :
                        feedbackForm.recommendation === 'maybe' ? 'text-yellow-800' :
                        'text-gray-800'
                      }>
                        Next Action
                      </span>
                    </div>
                    <p className={`text-xs ${
                      isEligibleForOffer ? 'text-green-700' :
                      feedbackForm.recommendation === 'maybe' ? 'text-yellow-700' :
                      'text-gray-700'
                    }`}>
                      {isEligibleForOffer 
                        ? '✅ Candidate is eligible for Offer Management (score ≥7.0 or "Hire" recommendation)'
                        : feedbackForm.recommendation === 'maybe'
                        ? '⚠️ Candidate marked as "Maybe" - will remain in interview stage for further review'
                        : '📋 Candidate will remain in system for potential future consideration'}
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Notes
                </label>
                <textarea
                  value={feedbackForm.notes}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Add notes about the interview, candidate performance, concerns, or recommendations..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setFeedbackFor(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 font-medium"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewManagement;
