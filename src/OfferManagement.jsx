import React from 'react';

const OfferManagement = ({ 
  candidates, 
  jobs,
  shortlists = [],
  onExtendOffer,
  onWithdrawOffer,
  onReject
}) => {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showOfferModal, setShowOfferModal] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all'); // all, pending, accepted, declined
  const [selectedJobId, setSelectedJobId] = React.useState('all');
  const [expandedJobs, setExpandedJobs] = React.useState(new Set());
  const [offerDetails, setOfferDetails] = React.useState({
    salary: '',
    startDate: '',
    benefits: '',
    notes: ''
  });

  // Filter candidates with interview feedback and in shortlists
  const filteredCandidates = React.useMemo(() => {
    // Get candidates who are shortlisted or have offers
    let filtered = candidates.filter(c => {
      const isShortlisted = c.status === 'shortlisted' || shortlists.some(sl => (sl.items || sl.candidates)?.includes(c.id));
      const hasOffer = c.offer !== undefined;
      return c.interviewFeedback && (isShortlisted || hasOffer);
    });

    if (statusFilter === 'pending') {
      filtered = filtered.filter(c => c.offer && c.offer.status === 'pending');
    } else if (statusFilter === 'accepted') {
      filtered = filtered.filter(c => c.offer && c.offer.status === 'accepted');
    } else if (statusFilter === 'declined') {
      filtered = filtered.filter(c => c.offer && c.offer.status === 'declined');
    } else if (statusFilter === 'shortlisted') {
      filtered = filtered.filter(c => !c.offer);
    }

    // Filter by selected job
    if (selectedJobId !== 'all') {
      filtered = filtered.filter(c => c.jobId === selectedJobId);
    }

    return filtered;
  }, [candidates, shortlists, statusFilter, selectedJobId]);

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
    const allOfferCandidates = candidates.filter(c => {
      const isShortlisted = c.status === 'shortlisted' || shortlists.some(sl => (sl.items || sl.candidates)?.includes(c.id));
      const hasOffer = c.offer !== undefined;
      return c.interviewFeedback && (isShortlisted || hasOffer);
    });

    // Apply job filter to stats
    const jobFiltered = selectedJobId !== 'all' 
      ? allOfferCandidates.filter(c => c.jobId === selectedJobId)
      : allOfferCandidates;
    
    return {
      shortlisted: jobFiltered.filter(c => !c.offer).length,
      pending: jobFiltered.filter(c => c.offer && c.offer.status === 'pending').length,
      accepted: jobFiltered.filter(c => c.offer && c.offer.status === 'accepted').length,
      declined: jobFiltered.filter(c => c.offer && c.offer.status === 'declined').length,
      total: jobFiltered.length
    };
  }, [candidates, shortlists, selectedJobId]);

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

  const handleOpenOfferModal = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate?.offer) {
      setOfferDetails({
        salary: candidate.offer.salary || '',
        startDate: candidate.offer.startDate || '',
        benefits: candidate.offer.benefits || '',
        notes: candidate.offer.notes || ''
      });
    } else {
      setOfferDetails({
        salary: '',
        startDate: '',
        benefits: '',
        notes: ''
      });
    }
    setShowOfferModal(candidateId);
  };

  const handleExtendOffer = () => {
    if (!offerDetails.salary || !offerDetails.startDate) {
      alert('Please provide salary and start date');
      return;
    }
    onExtendOffer?.(showOfferModal, offerDetails);
    setShowOfferModal(null);
    setOfferDetails({
      salary: '',
      startDate: '',
      benefits: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Offer Management
            </h1>
            <p className="text-gray-600 mt-2">
              Extend offers to finalists and track acceptance status
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-sm font-medium text-purple-600">Shortlisted</div>
            <div className="text-3xl font-bold text-purple-900 mt-2">{stats.shortlisted}</div>
            <div className="text-xs text-purple-600 mt-1">Ready for offer</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
            <div className="text-xs text-yellow-600 mt-1">Awaiting response</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm font-medium text-green-600">Accepted</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.accepted}</div>
            <div className="text-xs text-green-600 mt-1">Ready to onboard</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="text-sm font-medium text-red-600">Declined</div>
            <div className="text-3xl font-bold text-red-900 mt-2">{stats.declined}</div>
            <div className="text-xs text-red-600 mt-1">Offer rejected</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-600">Total</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</div>
            <div className="text-xs text-blue-600 mt-1">All candidates</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Status Filters */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Status:</label>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('shortlisted')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'shortlisted'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⭐ Shortlisted ({stats.shortlisted})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⏳ Pending ({stats.pending})
              </button>
              <button
                onClick={() => setStatusFilter('accepted')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'accepted'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ Accepted ({stats.accepted})
              </button>
              <button
                onClick={() => setStatusFilter('declined')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  statusFilter === 'declined'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❌ Declined ({stats.declined})
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
        <div className="mt-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
          <strong>✅ Final Stage:</strong> Extend offers to shortlisted candidates.
          <div className="mt-1 ml-4">
            • <strong>Extend Offer</strong> → Send offer with salary, start date, and benefits
            <br/>
            • <strong>Track Status</strong> → Monitor acceptance, declination, or pending responses
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">No candidates ready for offers</p>
            <p className="text-sm mt-1">Candidates need to be shortlisted first</p>
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
                      className="w-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <svg 
                          className={`w-5 h-5 text-green-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
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
                            {jobCandidates.length} candidate{jobCandidates.length !== 1 ? 's' : ''} in offer stage
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
                          {jobCandidates.length}
                        </span>
                      </div>
                    </button>

                    {/* Candidates List */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        {jobCandidates.map(candidate => {
                          const hasOffer = !!candidate.offer;
                          const offerStatus = candidate.offer?.status;
                          
                          return (
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
                            {candidate.interviewFeedback?.overallScore && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                🎤 Interview: {candidate.interviewFeedback.overallScore}/5
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
                          {!hasOffer && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              ⭐ Shortlisted
                            </span>
                          )}
                          {hasOffer && offerStatus === 'pending' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                              ⏳ Offer Pending
                            </span>
                          )}
                          {hasOffer && offerStatus === 'accepted' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              ✅ Offer Accepted
                            </span>
                          )}
                          {hasOffer && offerStatus === 'declined' && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              ❌ Offer Declined
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Offer Details Display */}
                      {hasOffer && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Salary:</span>
                              <div className="font-bold text-green-900">
                                {candidate.offer.salary}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Start Date:</span>
                              <div className="font-bold text-green-900">
                                {new Date(candidate.offer.startDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {candidate.offer.benefits && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600 font-medium">Benefits:</span>
                              <div className="text-gray-700 mt-1">{candidate.offer.benefits}</div>
                            </div>
                          )}
                          {candidate.offer.extendedAt && (
                            <div className="mt-2 text-xs text-gray-500">
                              Offered on {new Date(candidate.offer.extendedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        {!hasOffer && (
                          <button
                            onClick={() => handleOpenOfferModal(candidate.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
                          >
                            💰 Extend Offer
                          </button>
                        )}
                        
                        {hasOffer && offerStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenOfferModal(candidate.id)}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 font-medium"
                            >
                              ✏️ Edit Offer
                            </button>
                            <button
                              onClick={() => onWithdrawOffer?.(candidate.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                            >
                              Withdraw Offer
                            </button>
                          </>
                        )}

                        {hasOffer && offerStatus === 'declined' && (
                          <button
                            onClick={() => handleOpenOfferModal(candidate.id)}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 font-medium"
                          >
                            🔄 Revise Offer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Extend Job Offer</h3>
              <button
                onClick={() => setShowOfferModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Salary */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Salary Package *
                </label>
                <input
                  type="text"
                  value={offerDetails.salary}
                  onChange={(e) => setOfferDetails({...offerDetails, salary: e.target.value})}
                  placeholder="e.g., PKR 150,000/month or PKR 1.8M/year"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={offerDetails.startDate}
                  onChange={(e) => setOfferDetails({...offerDetails, startDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Benefits & Perks (optional)
                </label>
                <textarea
                  value={offerDetails.benefits}
                  onChange={(e) => setOfferDetails({...offerDetails, benefits: e.target.value})}
                  placeholder="e.g., Health insurance, annual bonus, remote work options..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={offerDetails.notes}
                  onChange={(e) => setOfferDetails({...offerDetails, notes: e.target.value})}
                  placeholder="Internal notes about the offer..."
                  className="w-full border border-gray-300 rounded-lg p-3 h-20 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={handleExtendOffer}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  💰 Extend Offer
                </button>
                <button
                  onClick={() => setShowOfferModal(null)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferManagement;
