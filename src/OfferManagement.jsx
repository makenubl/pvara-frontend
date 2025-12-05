import React, { useState, useMemo } from 'react';

/**
 * OfferManagement Component
 * Manages the job offer phase of the recruitment pipeline (Stage 5 of 5 - Final)
 * - Extend job offers to successful candidates
 * - Track offer status (pending, accepted, rejected, withdrawn)
 * - Manage salary negotiations and offer details
 * - View offer history and analytics
 */
function OfferManagement({ 
  applications = [], 
  jobs = [],
  onExtendOffer,
  onAcceptOffer,
  onRejectOffer,
  onWithdrawOffer
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // all, eligible, pending, accepted, rejected
  const [selectedJob, setSelectedJob] = useState('all');
  const [offerFor, setOfferFor] = useState(null);
  const [offerForm, setOfferForm] = useState({
    salary: '',
    startDate: '',
    benefits: '',
    notes: ''
  });

  // Filter candidates eligible for offers or already have offers
  const filteredCandidates = useMemo(() => {
    let filtered = applications.filter(app => {
      // Show candidates who:
      // 1. Have completed interviews with good feedback (eligible for offer)
      // 2. Already have an offer (any status)
      const hasGoodFeedback = app.interviewFeedback && 
                              (app.interviewFeedback.recommendation === 'hire' || 
                               parseFloat(app.interviewFeedback.overallScore || 0) >= 7.0);
      const hasOffer = app.status === 'offer' || app.offer;
      
      const isRelevant = hasGoodFeedback || hasOffer;
      
      if (!isRelevant) return false;

      // Filter by job
      if (selectedJob !== 'all' && app.jobId !== selectedJob) return false;

      // Filter by offer status
      if (filterStatus === 'eligible') return hasGoodFeedback && !hasOffer;
      if (filterStatus === 'pending') return app.offer?.status === 'pending';
      if (filterStatus === 'accepted') return app.offer?.status === 'accepted';
      if (filterStatus === 'rejected') return app.offer?.status === 'rejected';

      return true;
    });

    return filtered;
  }, [applications, selectedJob, filterStatus]);

  const handleOpenOfferForm = (candidate) => {
    const job = jobs.find(j => j.id === candidate.jobId);
    setOfferFor(candidate);
    setOfferForm({
      salary: job?.salary ? `PKR ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}` : '',
      startDate: '',
      benefits: 'Health insurance, provident fund, annual leaves as per company policy',
      notes: ''
    });
  };

  const handleSubmitOffer = () => {
    if (!offerFor || !offerForm.salary) return;
    
    onExtendOffer(offerFor.id, {
      salary: offerForm.salary,
      startDate: offerForm.startDate,
      benefits: offerForm.benefits,
      notes: offerForm.notes
    });

    setOfferFor(null);
  };

  const statusCounts = {
    eligible: applications.filter(a => {
      const hasGoodFeedback = a.interviewFeedback && 
                              (a.interviewFeedback.recommendation === 'hire' || 
                               parseFloat(a.interviewFeedback.overallScore || 0) >= 7.0);
      const hasOffer = a.status === 'offer' || a.offer;
      return hasGoodFeedback && !hasOffer && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob);
    }).length,
    pending: applications.filter(a => a.offer?.status === 'pending' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length,
    accepted: applications.filter(a => a.offer?.status === 'accepted' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length,
    rejected: applications.filter(a => a.offer?.status === 'rejected' && (!selectedJob || selectedJob === 'all' || a.jobId === selectedJob)).length
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : 'Unknown Position';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Offer Management</h1>
        <p className="text-gray-600">Extend and manage job offers for successful candidates</p>
        
        {/* Pipeline Position Indicator */}
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-green-900">Pipeline Stage 5 of 5 - Final Stage</div>
              <div className="text-green-700 text-xs">
                <span className="opacity-50">AI Screening → Testing → Interview →</span> 
                <span className="font-bold"> Offer (Current)</span>
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
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">{statusCounts.eligible}</div>
              <div className="text-sm text-blue-600">Eligible</div>
            </div>
            <svg className="w-8 h-8 text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <svg className="w-8 h-8 text-yellow-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">{statusCounts.accepted}</div>
              <div className="text-sm text-green-600">Accepted</div>
            </div>
            <svg className="w-8 h-8 text-green-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-700">{statusCounts.rejected}</div>
              <div className="text-sm text-red-600">Rejected</div>
            </div>
            <svg className="w-8 h-8 text-red-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({statusCounts.eligible + statusCounts.pending + statusCounts.accepted + statusCounts.rejected})
          </button>
          <button
            onClick={() => setFilterStatus('eligible')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'eligible'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Eligible ({statusCounts.eligible})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'accepted'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Accepted ({statusCounts.accepted})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>
      </div>

      {/* Enhanced Info Banners */}
      {filterStatus === 'eligible' && statusCounts.eligible > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-blue-900">Eligible for Offers</div>
              <div className="text-sm text-blue-700 mt-1">
                These candidates have completed interviews with strong ratings (score ≥7.0 or "Hire" recommendation). Click "Extend Offer" to send job offers.
              </div>
              <div className="text-xs text-blue-600 mt-2">
                💡 <strong>Workflow tip:</strong> Include salary, start date, and benefits in the offer. Candidates can accept or reject offers directly.
              </div>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'pending' && statusCounts.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-yellow-900">Pending Offers</div>
              <div className="text-sm text-yellow-700 mt-1">
                Offers have been extended. Awaiting candidate decision. You can withdraw offers if needed.
              </div>
              <div className="text-xs text-yellow-600 mt-2">
                💡 <strong>Workflow tip:</strong> Follow up within 3-5 business days if no response. Typical decision time is 7-14 days.
              </div>
            </div>
          </div>
        </div>
      )}

      {filterStatus === 'accepted' && statusCounts.accepted > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-green-900">🎉 Offers Accepted - Congratulations!</div>
              <div className="text-sm text-green-700 mt-1">
                These candidates have accepted offers. Begin onboarding process and update HRIS system.
              </div>
              <div className="text-xs text-green-600 mt-2">
                💡 <strong>Next steps:</strong> Send welcome packet, schedule orientation, set up equipment, and coordinate with IT/HR for account setup.
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Interview Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recommendation</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Offer Status</th>
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{candidate.applicant?.name || candidate.name}</div>
                      <div className="text-sm text-gray-500">{candidate.applicant?.email || candidate.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getJobTitle(candidate.jobId)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {candidate.interviewFeedback?.overallScore || 'N/A'}/10
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {candidate.interviewFeedback?.recommendation === 'hire' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Hire
                        </span>
                      )}
                      {candidate.interviewFeedback?.recommendation === 'maybe' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Maybe
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!candidate.offer && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          No Offer
                        </span>
                      )}
                      {candidate.offer?.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {candidate.offer?.status === 'accepted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Accepted
                        </span>
                      )}
                      {candidate.offer?.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {!candidate.offer && (
                          <button
                            onClick={() => handleOpenOfferForm(candidate)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Extend Offer
                          </button>
                        )}
                        {candidate.offer?.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onAcceptOffer(candidate.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => onWithdrawOffer(candidate.id)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                              Withdraw
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Offer Modal */}
      {offerFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-lg font-bold mb-4">Extend Job Offer</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate
                </label>
                <div className="text-sm text-gray-600">{offerFor.applicant?.name || offerFor.name}</div>
                <div className="text-xs text-gray-500">{getJobTitle(offerFor.jobId)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Offer
                </label>
                <input
                  type="text"
                  value={offerForm.salary}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., PKR 150,000 - 180,000 per month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={offerForm.startDate}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits Package
                </label>
                <textarea
                  value={offerForm.benefits}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, benefits: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Health insurance, provident fund, annual leaves, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={offerForm.notes}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Any additional details or conditions..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOfferFor(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={!offerForm.salary}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfferManagement;
