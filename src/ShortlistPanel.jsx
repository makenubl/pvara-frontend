import React from "react";

const ShortlistPanel = ({ 
  shortlists = [], 
  applications = [],
  onCreateShortlist,
  onAddToShortlist,
  onRemoveFromShortlist,
  onDeleteShortlist,
  onRenameShortlist,
  onExportShortlist,
  onBulkStatusChange
}) => {
  const [selectedShortlist, setSelectedShortlist] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newShortlistName, setNewShortlistName] = React.useState('');
  const [showRenameModal, setShowRenameModal] = React.useState(null);
  const [renameText, setRenameText] = React.useState('');
  const [selectedCandidates, setSelectedCandidates] = React.useState([]);

  // Keep selectedShortlist in sync when shortlists update
  React.useEffect(() => {
    if (selectedShortlist) {
      const updated = shortlists.find(s => s.id === selectedShortlist.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedShortlist)) {
        setSelectedShortlist(updated);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlists]);

  const handleCreateShortlist = () => {
    if (!newShortlistName.trim()) {
      alert('Please enter a shortlist name');
      return;
    }
    onCreateShortlist?.(newShortlistName, []);
    setNewShortlistName('');
    setShowCreateModal(false);
  };

  const handleRenameShortlist = (shortlistId) => {
    if (!renameText.trim()) {
      alert('Please enter a name');
      return;
    }
    onRenameShortlist?.(shortlistId, renameText);
    setShowRenameModal(null);
    setRenameText('');
  };

  const handleRemoveCandidate = (shortlistId, candidateId) => {
    if (window.confirm('Remove this candidate from the shortlist?')) {
      onRemoveFromShortlist?.(shortlistId, candidateId);
    }
  };

  const handleDeleteShortlist = (shortlistId) => {
    if (window.confirm('Delete this entire shortlist?')) {
      onDeleteShortlist?.(shortlistId);
      if (selectedShortlist?.id === shortlistId) {
        setSelectedShortlist(null);
      }
    }
  };

  const handleBulkAction = (shortlistId, action) => {
    if (selectedCandidates.length === 0) return;
    const shortlist = shortlists.find(s => s.id === shortlistId);
    if (!shortlist) return;
    
    const count = selectedCandidates.length;
    const actionText = action === 'offer' ? 'Offer' : action === 'interview' ? 'Interview' : 'Rejected';
    
    onBulkStatusChange?.(selectedCandidates, action);
    setSelectedCandidates([]);
    
    // Status will update automatically as applications array updates
    console.log(`Updated ${count} candidate(s) to ${actionText} status`);
  };

  const toggleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const currentShortlist = selectedShortlist || (shortlists.length > 0 ? shortlists[0] : null);
  
  // Use useMemo to ensure candidates update when applications or shortlist changes
  const candidates = React.useMemo(() => {
    if (!currentShortlist) return [];
    return currentShortlist.items
      .map(candidateId => applications.find(app => app.id === candidateId))
      .filter(Boolean)
      .filter(candidate => candidate.status !== 'offer'); // Hide candidates who already have offers
  }, [currentShortlist, applications]);

  return (
    <div className="flex h-full">
      {/* Left Panel - Shortlist List */}
      <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-xl text-gray-900">Shortlists</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            title="Create New Shortlist"
          >
            + New
          </button>
        </div>

        {shortlists.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-sm mb-3">No shortlists yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-green-600 hover:underline text-sm font-medium"
            >
              Create your first shortlist
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {shortlists.map((sl) => {
              const isActive = currentShortlist?.id === sl.id;
              return (
                <div
                  key={sl.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-green-600 text-white shadow-lg' 
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedShortlist(sl);
                    setSelectedCandidates([]);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{sl.name || `Shortlist ${sl.id}`}</div>
                      <div className={`text-xs mt-1 ${isActive ? 'text-green-100' : 'text-gray-500'}`}>
                        {sl.items?.length || 0} candidate{sl.items?.length !== 1 ? 's' : ''}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-green-100' : 'text-gray-400'}`}>
                        Created {new Date(sl.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {!isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShortlist(sl.id);
                        }}
                        className="text-gray-400 hover:text-red-600 ml-2"
                        title="Delete Shortlist"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel - Shortlist Details */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!currentShortlist ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">Select a shortlist to view candidates</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 pb-4 border-b">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{currentShortlist.name || `Shortlist ${currentShortlist.id}`}</h3>
                  <p className="text-gray-600 mt-1">
                    {candidates.length} finalist{candidates.length !== 1 ? 's' : ''}
                    {currentShortlist.items?.length !== candidates.length && (
                      <span className="text-red-600 ml-2">
                        ({currentShortlist.items?.length - candidates.length} removed or deleted)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Shortlisted candidates are ready for final decision. Send offer or reject.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRenameModal(currentShortlist.id);
                      setRenameText(currentShortlist.name || '');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => onExportShortlist?.(currentShortlist.id)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleDeleteShortlist(currentShortlist.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedCandidates.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="font-semibold text-green-900">
                    {selectedCandidates.length} candidate{selectedCandidates.length > 1 ? 's' : ''} selected
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction(currentShortlist.id, 'offer')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium"
                    >
                      ✓ Send Offer
                    </button>
                    <button
                      onClick={() => handleBulkAction(currentShortlist.id, 'rejected')}
                      className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => setSelectedCandidates([])}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Candidates List */}
            {candidates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">This shortlist is empty</p>
                <p className="text-sm text-gray-400 mt-2">
                  {currentShortlist.items?.length > 0 
                    ? `${currentShortlist.items.length} candidate ID(s) in shortlist but not found in applications (may have been deleted)` 
                    : 'Go to HR View, interview candidates, then add them to this shortlist'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`bg-white rounded-lg shadow p-4 border-2 transition-all ${
                      selectedCandidates.includes(candidate.id) 
                        ? 'border-green-500 ring-2 ring-green-200' 
                        : 'border-transparent hover:shadow-md'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => toggleSelectCandidate(candidate.id)}
                          className="w-5 h-5 rounded border-gray-300 mt-1"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">
                              {candidate.applicant?.name || candidate.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {candidate.applicant?.email || candidate.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {candidate.applicant?.degree || candidate.degree} • {candidate.applicant?.experienceYears || candidate.experienceYears} yrs experience
                            </p>
                          </div>
                          {candidate.aiScore && (
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                candidate.aiScore >= 75 ? 'text-green-600' : 
                                candidate.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {candidate.aiScore}
                              </div>
                              <div className="text-xs text-gray-500">AI Score</div>
                            </div>
                          )}
                        </div>

                        {/* Status & Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            candidate.status === 'offer' ? 'bg-green-100 text-green-700' :
                            candidate.status === 'interview' ? 'bg-blue-100 text-blue-700' :
                            candidate.status === 'screening' ? 'bg-yellow-100 text-yellow-700' :
                            candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {candidate.status === 'offer' && '✓ '}
                            {candidate.status === 'rejected' && '✗ '}
                            {candidate.status || 'submitted'}
                          </span>
                          {candidate.interviewFeedback && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Interviewed ({candidate.interviewFeedback.overallScore}/5)
                            </span>
                          )}
                          {candidate.notes && candidate.notes.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {candidate.notes.length} note{candidate.notes.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* AI Recommendation */}
                        {candidate.aiRecommendation && (
                          <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded mb-3">
                            💡 {candidate.aiRecommendation}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveCandidate(currentShortlist.id, candidate.id)}
                            className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100 font-medium"
                          >
                            Remove from Shortlist
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Shortlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create New Shortlist</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shortlist Name
              </label>
              <input
                type="text"
                value={newShortlistName}
                onChange={(e) => setNewShortlistName(e.target.value)}
                placeholder="e.g., Top 10 Software Engineers"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateShortlist()}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateShortlist}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewShortlistName('');
                }}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Shortlist Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Rename Shortlist</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Name
              </label>
              <input
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleRenameShortlist(showRenameModal)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRenameShortlist(showRenameModal)}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(null);
                  setRenameText('');
                }}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
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

export default ShortlistPanel;
