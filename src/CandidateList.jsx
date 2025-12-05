import React from "react";

const CandidateList = ({ candidates, onStatusChange, onAIEvaluate, onBulkAction, onAddNote, onExport, onInterviewFeedback, shortlists = [], onAddToShortlist, onSendTest, onRecordTestResult }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [showCompareModal, setShowCompareModal] = React.useState(false);
  const [showNotesModal, setShowNotesModal] = React.useState(null);
  const [noteText, setNoteText] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showRejected, setShowRejected] = React.useState(false);
  const [isAIScreening, setIsAIScreening] = React.useState(false);
  const [showAllCandidates, setShowAllCandidates] = React.useState(false);
  const [showInterviewModal, setShowInterviewModal] = React.useState(null);
  const [showApplicationModal, setShowApplicationModal] = React.useState(null);
  const [showAddToShortlistModal, setShowAddToShortlistModal] = React.useState(false);
  const [showTestResultsModal, setShowTestResultsModal] = React.useState(null);
  const [testResultsForm, setTestResultsForm] = React.useState({ score: '', passed: false, notes: '' });
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
  const itemsPerPage = 10;
  
  // Filter and search logic
  const filteredCandidates = React.useMemo(() => {
    let filtered = candidates || [];
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        const status = c.status || 'submitted';
        if (statusFilter === 'new') return status === 'submitted';
        if (statusFilter === 'screening') return status === 'screening';
        if (statusFilter === 'test-invited') return status === 'test-invited';
        if (statusFilter === 'interview') return status === 'interview' || status === 'phone-interview';
        if (statusFilter === 'rejected') return status === 'rejected';
        if (statusFilter === 'offer') return status === 'offer';
        return true;
      });
    }
    
    // Hide rejected unless explicitly shown
    if (!showRejected && statusFilter !== 'rejected') {
      filtered = filtered.filter(c => (c.status || 'submitted') !== 'rejected');
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const name = (c.applicant?.name || c.name || '').toLowerCase();
        const email = (c.applicant?.email || c.email || '').toLowerCase();
        const cnic = (c.applicant?.cnic || '').toLowerCase();
        const degree = (c.applicant?.degree || c.degree || '').toLowerCase();
        const phone = (c.applicant?.phone || '').toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               cnic.includes(query) || 
               degree.includes(query) ||
               phone.includes(query);
      });
    }
    
    return filtered;
  }, [candidates, statusFilter, searchQuery, showRejected]);
  
  // Sort by AI score (descending) and filter top 10%
  const sortedAndFilteredCandidates = React.useMemo(() => {
    // Sort by AI score descending
    const sorted = [...filteredCandidates].sort((a, b) => {
      const scoreA = a.aiScore || 0;
      const scoreB = b.aiScore || 0;
      return scoreB - scoreA;
    });
    
    // Calculate top 10% threshold
    const topTenPercentCount = Math.max(1, Math.ceil(sorted.length * 0.1));
    
    // Show only top 10% unless "Show All" is enabled
    if (!showAllCandidates && sorted.length > 0) {
      return {
        topCandidates: sorted.slice(0, topTenPercentCount),
        remainingCandidates: sorted.slice(topTenPercentCount),
        topCount: topTenPercentCount,
        totalCount: sorted.length
      };
    }
    
    return {
      topCandidates: sorted,
      remainingCandidates: [],
      topCount: sorted.length,
      totalCount: sorted.length
    };
  }, [filteredCandidates, showAllCandidates]);
  
  const unevaluatedCount = (candidates || []).filter(
    c => (c.status === 'submitted' || !c.aiScore) && c.status !== 'rejected'
  ).length;
  
  // Status counts
  const statusCounts = React.useMemo(() => {
    const all = candidates || [];
    return {
      all: all.filter(c => c.status !== 'rejected').length,
      new: all.filter(c => (c.status || 'submitted') === 'submitted').length,
      screening: all.filter(c => c.status === 'screening').length,
      testInvited: all.filter(c => c.status === 'test-invited').length,
      interview: all.filter(c => c.status === 'interview' || c.status === 'phone-interview').length,
      rejected: all.filter(c => c.status === 'rejected').length,
      offer: all.filter(c => c.status === 'offer').length,
    };
  }, [candidates]);
  
  const displayCandidates = showAllCandidates 
    ? sortedAndFilteredCandidates.topCandidates 
    : sortedAndFilteredCandidates.topCandidates;
  
  const totalPages = Math.ceil(displayCandidates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCandidates = displayCandidates.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, showRejected, showAllCandidates]);

  // Selection handlers
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedCandidates.map(c => c.id));
    }
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) return;
    onBulkAction?.(selectedIds, action);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const toExport = selectedIds.length > 0 
      ? candidates.filter(c => selectedIds.includes(c.id))
      : candidates;
    onExport?.(toExport);
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 candidates to compare');
      return;
    }
    if (selectedIds.length > 4) {
      alert('You can compare up to 4 candidates at a time');
      return;
    }
    setShowCompareModal(true);
  };

  const handleAddNote = (candidateId) => {
    if (!noteText.trim()) return;
    onAddNote?.(candidateId, noteText);
    setNoteText("");
    setShowNotesModal(null);
  };
  
  const handleAIScreenAll = async () => {
    if (unevaluatedCount === 0) return;
    setIsAIScreening(true);
    await onAIEvaluate?.();
    setIsAIScreening(false);
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
        recommendation: 'maybe'
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

  const handleOpenApplication = (candidateId) => {
    setShowApplicationModal(candidateId);
  };
  
  return (
    <div>
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, CNIC, degree, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            {onAIEvaluate && unevaluatedCount > 0 && (
              <button
                onClick={handleAIScreenAll}
                disabled={isAIScreening}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAIScreening ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Screening...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Screen All ({unevaluatedCount})
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
        
        {/* Sequential Workflow Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <div className="font-semibold">Sequential Workflow</div>
              <div className="mt-1">Follow the sequence: <strong>Screening → Send Test → Test Management → Interview → Shortlist</strong>. Candidates must complete each stage before progressing.</div>
            </div>
          </div>
        </div>
        
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === 'all'
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'new'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            1️⃣ New ({statusCounts.new})
          </button>
          <button
            onClick={() => setStatusFilter('screening')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'screening'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            2️⃣ AI Screened ({statusCounts.screening})
          </button>
          <button
            onClick={() => setStatusFilter('test-invited')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'test-invited'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 3️⃣ Test Stage ({statusCounts.testInvited})
          </button>
          <button
            onClick={() => setStatusFilter('interview')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'interview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            4️⃣ Interview ({statusCounts.interview})
          </button>
          <button
            onClick={() => setStatusFilter('offer')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'offer'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            5️⃣ Offer ({statusCounts.offer})
          </button>
          <button
            onClick={() => {
              if (statusFilter === 'rejected') {
                setStatusFilter('all');
                setShowRejected(false);
              } else {
                setStatusFilter('rejected');
                setShowRejected(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Rejected ({statusCounts.rejected})
          </button>
        </div>
        
        {/* Results Summary */}
        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Showing {displayCandidates.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, displayCandidates.length)} of {displayCandidates.length} applications
              {!showAllCandidates && sortedAndFilteredCandidates.remainingCandidates.length > 0 && (
                <span className="ml-2 text-purple-600 font-medium">
                  (Top {sortedAndFilteredCandidates.topCount} of {sortedAndFilteredCandidates.totalCount} - sorted by AI score)
                </span>
              )}
              {searchQuery && <span className="ml-2 text-green-600 font-medium">(filtered by search)</span>}
              {selectedIds.length > 0 && <span className="ml-2 text-green-600 font-medium">• {selectedIds.length} selected</span>}
            </div>
            {sortedAndFilteredCandidates.remainingCandidates.length > 0 && (
              <button
                onClick={() => setShowAllCandidates(!showAllCandidates)}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center gap-2"
              >
                {showAllCandidates ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Show Top 10% Only
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Show All {sortedAndFilteredCandidates.totalCount}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar - Contextual based on status */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="font-semibold text-green-900">
            {selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            {/* Screening: Send Test to move forward in sequence */}
            {statusFilter === 'screening' && (
              <>
                <button
                  onClick={() => {
                    onSendTest?.(selectedIds);
                    setSelectedIds([]);
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  📝 Send Test to Selected
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
            
            {/* New: Only Reject (not screened yet) */}
            {(statusFilter === 'all' || statusFilter === 'new') && (
              <button
                onClick={() => handleBulkAction('rejected')}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            )}
            
            {/* Test stages handled in Test Management page */}
            {statusFilter === 'test-invited' && (
              <div className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded text-sm border border-orange-200">
                ℹ️ Use "Test Management" page to manage tests
              </div>
            )}
            
            {/* Interview: Add to Shortlist */}
            {statusFilter === 'interview' && (
              <>
                <button
                  onClick={() => setShowAddToShortlistModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                >
                  Add to Shortlist
                </button>
                <button
                  onClick={() => handleBulkAction('rejected')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
            
            {/* Rejected: Reconsider option */}
            {statusFilter === 'rejected' && (
              <button
                onClick={() => {
                  handleBulkAction('screening');
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                ↩️ Reconsider Selected
              </button>
            )}
            
            {/* Always show Compare and Clear */}
            <button
              onClick={handleCompare}
              className="px-3 py-1.5 bg-gray-700 text-white rounded text-sm hover:bg-gray-800"
            >
              Compare
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      
      {/* Stage-specific helper text */}
      {statusFilter === 'test-invited' && displayCandidates.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm text-orange-800">
              <div className="font-semibold">Test Stage - Action Required</div>
              <div className="mt-1">These candidates have been sent tests. Click "⏱️ Record Result" on each candidate to enter their test scores. Passed candidates will automatically move to the Interview tab.</div>
            </div>
          </div>
        </div>
      )}
      
      {statusFilter === 'rejected' && displayCandidates.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-red-800">
              <div className="font-semibold">Rejected Candidates</div>
              <div className="mt-1">These candidates were rejected. You can "↩️ Reconsider" them to move back to screening stage for another review. Their previous test scores (if any) are preserved.</div>
            </div>
          </div>
        </div>
      )}
      
      {displayCandidates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-medium">No applications found</p>
          {statusFilter === 'test-invited' && (
            <p className="text-sm mt-2">No candidates have been sent tests yet. Go to the New or AI Screened tab to send tests.</p>
          )}
          {(searchQuery || (statusFilter !== 'all' && statusFilter !== 'test-invited')) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-3 text-green-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
        {/* Select All */}
        <div className="bg-gray-50 border rounded-lg p-3 mb-3 flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.length === paginatedCandidates.length && paginatedCandidates.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedIds.length === paginatedCandidates.length && paginatedCandidates.length > 0
              ? 'Deselect all on this page'
              : 'Select all on this page'}
          </span>
        </div>

        <ul className="space-y-3">
          {paginatedCandidates.map((c) => (
            <li key={c.id} className={`bg-white p-4 rounded shadow flex gap-3 ${
              selectedIds.includes(c.id) ? 'ring-2 ring-green-500' : ''
            }`}>
              {/* Checkbox */}
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="w-5 h-5 rounded border-gray-300 mt-1"
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold">{c.applicant?.name || c.name}</div>
                    <div className="text-xs text-gray-500">
                      {c.applicant?.email || c.email} • {c.applicant?.degree || c.degree} • {c.applicant?.experienceYears || c.experienceYears} yrs
                    </div>
                    {c.applicant?.cnic && (
                      <div className="text-xs text-gray-400 mt-0.5">CNIC: {c.applicant.cnic}</div>
                    )}
                  </div>
                  {c.aiScore && (
                    <div className="text-center ml-4">
                      <div className={`text-2xl font-bold ${
                        c.aiScore >= 75 ? 'text-green-600' : c.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {c.aiScore}
                      </div>
                      <div className="text-xs text-gray-500">AI Score</div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    c.status === 'offer' ? 'bg-green-100 text-green-700' :
                    c.status === 'interview' || c.status === 'phone-interview' ? 'bg-blue-100 text-blue-700' :
                    c.status === 'screening' ? 'bg-yellow-100 text-yellow-700' :
                    c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {c.status || "submitted"}
                  </span>
                  
                  {/* Notes Badge */}
                  {c.notes && c.notes.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {c.notes.length} note{c.notes.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {c.aiRecommendation && (
                  <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                    💡 {c.aiRecommendation}
                  </div>
                )}
                
                {/* Latest Note */}
                {c.notes && c.notes.length > 0 && (
                  <div className="text-xs bg-purple-50 p-2 rounded border border-purple-100">
                    <div className="font-medium text-purple-900">Latest Note:</div>
                    <div className="text-purple-700 mt-1">{c.notes[c.notes.length - 1].text}</div>
                    <div className="text-purple-500 text-xs mt-1">
                      by {c.notes[c.notes.length - 1].author} • {new Date(c.notes[c.notes.length - 1].timestamp).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {/* Always show View Application */}
                  <button 
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    onClick={() => handleOpenApplication(c.id)}
                    title="View Full Application"
                  >
                    📄 View App
                  </button>
                  
                  {/* Sequential Actions based on Status */}
                  {c.status === 'submitted' && (
                    <button 
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" 
                      onClick={() => onStatusChange(c.id, "rejected")}
                    >
                      Reject
                    </button>
                  )}
                  
                  {c.status === 'screening' && (
                    <>
                      <button 
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700" 
                        onClick={() => onSendTest?.([c.id])}
                      >
                        📝 Send Test
                      </button>
                      <button 
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" 
                        onClick={() => onStatusChange(c.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {c.status === 'test-invited' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                      📝 In Test Management
                    </span>
                  )}
                  
                  {c.testResults && c.testResults.status === 'completed' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ✓ Test: {c.testResults.score}%
                    </span>
                  )}
                  
                  {c.status === 'interview' && (
                    <>
                      <button 
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        onClick={() => handleOpenInterviewModal(c.id)}
                        title={c.interviewFeedback ? "View/Edit Feedback" : "Add Interview Feedback"}
                      >
                        {c.interviewFeedback ? '✓ Feedback' : '📅 Interview'}
                      </button>
                      <button 
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700" 
                        onClick={() => onStatusChange(c.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {/* Rejected candidates can be reconsidered */}
                  {c.status === 'rejected' && (
                    <>
                      <button 
                        className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                        onClick={() => onStatusChange(c.id, "screening")}
                        title="Move back to screening"
                      >
                        ↩️ Reconsider
                      </button>
                      {c.testResults && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Previous Test: {c.testResults.score}% ({c.testResults.passed ? 'Passed' : 'Failed'})
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Offer status */}
                  {c.status === 'offer' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      🎉 Offer Extended
                    </span>
                  )}
                  
                  {/* Always show Add Note */}
                  <button 
                    className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                    onClick={() => setShowNotesModal(c.id)}
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded ${
                    currentPage === page
                      ? 'bg-green-700 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
        </>
      )}

      {/* Add Note Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Add Internal Note</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your note here..."
              className="w-full border rounded p-3 h-32 resize-none"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleAddNote(showNotesModal)}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Save Note
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(null);
                  setNoteText("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, technicalRating: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Communication Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Communication Skills
                  <span className="ml-2 text-base font-bold text-green-600">{interviewFeedback.communicationRating}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interviewFeedback.communicationRating}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, communicationRating: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
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
                  <span className="ml-2 text-base font-bold text-purple-600">{interviewFeedback.cultureFitRating}/5</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={interviewFeedback.cultureFitRating}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, cultureFitRating: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Very Good</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Overall Average */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Overall Average</div>
                <div className="text-2xl font-bold text-gray-800">
                  {((interviewFeedback.technicalRating + interviewFeedback.communicationRating + interviewFeedback.cultureFitRating) / 3).toFixed(1)}/5
                </div>
              </div>

              {/* Strengths */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Key Strengths
                </label>
                <textarea
                  value={interviewFeedback.strengths}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                  placeholder="What did the candidate excel at?"
                  className="w-full border rounded-lg p-2 h-20 resize-none text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Weaknesses/Concerns */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Areas of Concern
                </label>
                <textarea
                  value={interviewFeedback.weaknesses}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, weaknesses: e.target.value }))}
                  placeholder="Any concerns or areas needing improvement?"
                  className="w-full border rounded-lg p-2 h-20 resize-none text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Overall Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Overall Comments <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={interviewFeedback.comments}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Summary of interview, fit for role, next steps..."
                  className="w-full border rounded-lg p-2 h-24 resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Detailed Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Detailed Interview Notes
                </label>
                <textarea
                  value={interviewFeedback.detailedNotes}
                  onChange={(e) => setInterviewFeedback(prev => ({ ...prev, detailedNotes: e.target.value }))}
                  placeholder="Technical discussion, problem-solving approach, behavioral responses..."
                  className="w-full border rounded-lg p-2 h-32 resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Hiring Recommendation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setInterviewFeedback(prev => ({ ...prev, recommendation: 'hire' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      interviewFeedback.recommendation === 'hire'
                        ? 'bg-green-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✓ Hire
                  </button>
                  <button
                    onClick={() => setInterviewFeedback(prev => ({ ...prev, recommendation: 'maybe' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      interviewFeedback.recommendation === 'maybe'
                        ? 'bg-yellow-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ? Maybe
                  </button>
                  <button
                    onClick={() => setInterviewFeedback(prev => ({ ...prev, recommendation: 'no-hire' }))}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                      interviewFeedback.recommendation === 'no-hire'
                        ? 'bg-red-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✗ No Hire
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmitInterview}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Save Feedback
              </button>
              <button
                onClick={() => setShowInterviewModal(null)}
                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Candidate Comparison</h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedIds.map(id => {
                const candidate = (candidates || []).find(c => c.id === id);
                if (!candidate) return null;
                
                return (
                  <div key={id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="font-bold text-lg mb-2">{candidate.applicant?.name || candidate.name}</div>
                    
                    {candidate.aiScore && (
                      <div className={`text-4xl font-bold mb-4 ${
                        candidate.aiScore >= 75 ? 'text-green-600' : 
                        candidate.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {candidate.aiScore}
                        <span className="text-sm text-gray-500 ml-1">/ 100</span>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs">Email</div>
                        <div className="font-medium">{candidate.applicant?.email || candidate.email}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Education</div>
                        <div className="font-medium">{candidate.applicant?.degree || candidate.degree}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Experience</div>
                        <div className="font-medium">{candidate.applicant?.experienceYears || candidate.experienceYears} years</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Status</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          candidate.status === 'offer' ? 'bg-green-100 text-green-700' :
                          candidate.status === 'interview' ? 'bg-blue-100 text-blue-700' :
                          candidate.status === 'screening' ? 'bg-yellow-100 text-yellow-700' :
                          candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {candidate.status || 'submitted'}
                        </span>
                      </div>
                      {candidate.notes && candidate.notes.length > 0 && (
                        <div>
                          <div className="text-gray-500 text-xs">Notes</div>
                          <div className="font-medium">{candidate.notes.length} note{candidate.notes.length > 1 ? 's' : ''}</div>
                        </div>
                      )}
                      {candidate.aiRecommendation && (
                        <div>
                          <div className="text-gray-500 text-xs">AI Recommendation</div>
                          <div className="text-xs italic">{candidate.aiRecommendation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showApplicationModal && (() => {
        const candidate = (candidates || []).find(c => c.id === showApplicationModal);
        if (!candidate) return null;
        
        const applicant = candidate.applicant || {};
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
                <h3 className="text-2xl font-bold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowApplicationModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {applicant.firstName} {applicant.lastName}
                    </h2>
                    {applicant.preferredName && (
                      <p className="text-gray-600 italic">Preferred: {applicant.preferredName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                      candidate.status === 'offer' ? 'bg-green-100 text-green-700' :
                      candidate.status === 'interview' ? 'bg-blue-100 text-blue-700' :
                      candidate.status === 'screening' ? 'bg-yellow-100 text-yellow-700' :
                      candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {candidate.status || 'submitted'}
                    </span>
                    {candidate.aiScore && (
                      <div className="mt-2">
                        <div className={`text-3xl font-bold ${
                          candidate.aiScore >= 75 ? 'text-green-600' : 
                          candidate.aiScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {candidate.aiScore}/100
                        </div>
                        <div className="text-xs text-gray-500">AI Score</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Recommendation */}
                {candidate.aiRecommendation && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-semibold text-blue-900">AI Recommendation</div>
                        <div className="text-blue-800">{candidate.aiRecommendation}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Email</div>
                      <div className="font-medium text-gray-900">{applicant.email || candidate.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Phone</div>
                      <div className="font-medium text-gray-900">{applicant.phone || candidate.phone || 'N/A'}</div>
                    </div>
                    {applicant.alternatePhone && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase">Alternate Phone</div>
                        <div className="font-medium text-gray-900">{applicant.alternatePhone}</div>
                      </div>
                    )}
                    {applicant.cnic && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase">CNIC</div>
                        <div className="font-medium text-gray-900">{applicant.cnic}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Address */}
                  {(applicant.streetAddress1 || applicant.city) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500 uppercase mb-1">Address</div>
                      <div className="text-gray-900">
                        {applicant.streetAddress1 && <div>{applicant.streetAddress1}</div>}
                        {applicant.streetAddress2 && <div>{applicant.streetAddress2}</div>}
                        <div>
                          {[applicant.city, applicant.state, applicant.postalCode].filter(Boolean).join(', ')}
                          {applicant.country && ` - ${applicant.country}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Education */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Education
                  </h3>
                  {applicant.education && applicant.education.length > 0 ? (
                    <div className="space-y-3">
                      {applicant.education.map((edu, idx) => (
                        <div key={idx} className="border-l-2 border-blue-500 pl-4">
                          <div className="font-semibold text-gray-900">{edu.degree || candidate.degree}</div>
                          <div className="text-gray-700">{edu.fieldOfStudy}</div>
                          <div className="text-sm text-gray-600">{edu.school}</div>
                          <div className="text-xs text-gray-500">
                            {edu.graduated === 'yes' ? 'Graduated' : edu.stillAttending ? 'Currently Attending' : 'Did Not Graduate'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">{candidate.degree || 'No education information provided'}</div>
                  )}
                </div>

                {/* Employment History */}
                {applicant.employment && applicant.employment.length > 0 && applicant.employment[0].employer && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Employment History
                    </h3>
                    <div className="space-y-4">
                      {applicant.employment.map((job, idx) => (
                        <div key={idx} className="border-l-2 border-green-500 pl-4">
                          <div className="font-semibold text-gray-900">{job.jobTitle}</div>
                          <div className="text-gray-700">{job.employer}</div>
                          <div className="text-sm text-gray-600">
                            {job.startMonth} {job.startYear} - {job.currentEmployer ? 'Present' : `${job.endMonth} ${job.endYear}`}
                          </div>
                          {job.description && (
                            <div className="text-sm text-gray-600 mt-2">{job.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>Total Experience:</strong> {candidate.experienceYears || applicant.experienceYears || 'N/A'} years
                    </div>
                  </div>
                )}

                {/* Skills */}
                {applicant.skills && applicant.skills.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {applicant.languages && applicant.languages.length > 0 && applicant.languages[0].language && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Languages
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {applicant.languages.map((lang, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2">
                          <div className="font-medium text-gray-900">{lang.language}</div>
                          <div className="text-sm text-gray-600">{lang.proficiency}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Letter */}
                {applicant.coverLetter && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Cover Letter
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded p-3">
                      {applicant.coverLetter}
                    </div>
                  </div>
                )}

                {/* Portfolio Link */}
                {applicant.portfolioLink && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Portfolio / Website
                    </h3>
                    <a 
                      href={applicant.portfolioLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {applicant.portfolioLink}
                    </a>
                  </div>
                )}

                {/* Interview Feedback */}
                {candidate.interviewFeedback && (
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Interview Feedback
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-600">Technical</div>
                          <div className="text-lg font-bold text-blue-600">{candidate.interviewFeedback.technicalRating}/5</div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-600">Communication</div>
                          <div className="text-lg font-bold text-green-600">{candidate.interviewFeedback.communicationRating}/5</div>
                        </div>
                        <div className="bg-white rounded p-2">
                          <div className="text-xs text-gray-600">Culture Fit</div>
                          <div className="text-lg font-bold text-purple-600">{candidate.interviewFeedback.cultureFitRating}/5</div>
                        </div>
                      </div>
                      <div className="bg-white rounded p-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Overall Score</div>
                        <div className="text-2xl font-bold text-gray-900">{candidate.interviewFeedback.overallScore}/5</div>
                      </div>
                      {candidate.interviewFeedback.strengths && (
                        <div className="bg-white rounded p-3">
                          <div className="text-sm font-semibold text-green-700 mb-1">Strengths</div>
                          <div className="text-gray-700">{candidate.interviewFeedback.strengths}</div>
                        </div>
                      )}
                      {candidate.interviewFeedback.weaknesses && (
                        <div className="bg-white rounded p-3">
                          <div className="text-sm font-semibold text-red-700 mb-1">Concerns</div>
                          <div className="text-gray-700">{candidate.interviewFeedback.weaknesses}</div>
                        </div>
                      )}
                      <div className="bg-white rounded p-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Comments</div>
                        <div className="text-gray-700">{candidate.interviewFeedback.comments}</div>
                      </div>
                      {candidate.interviewFeedback.detailedNotes && (
                        <div className="bg-white rounded p-3">
                          <div className="text-sm font-semibold text-gray-700 mb-1">Detailed Notes</div>
                          <div className="text-gray-700 whitespace-pre-wrap">{candidate.interviewFeedback.detailedNotes}</div>
                        </div>
                      )}
                      <div className="bg-white rounded p-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Recommendation</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          candidate.interviewFeedback.recommendation === 'hire' ? 'bg-green-100 text-green-800' :
                          candidate.interviewFeedback.recommendation === 'no-hire' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {candidate.interviewFeedback.recommendation === 'hire' ? '✓ Hire' :
                           candidate.interviewFeedback.recommendation === 'no-hire' ? '✗ No Hire' :
                           '? Maybe'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 bg-white rounded p-2">
                        Interviewed by {candidate.interviewFeedback.interviewer} on {new Date(candidate.interviewFeedback.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {candidate.notes && candidate.notes.length > 0 && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Internal Notes ({candidate.notes.length})
                    </h3>
                    <div className="space-y-2">
                      {candidate.notes.map((note, idx) => (
                        <div key={idx} className="bg-white rounded p-3">
                          <div className="text-gray-700">{note.text}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            by {note.author} • {new Date(note.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowApplicationModal(null);
                      handleOpenInterviewModal(candidate.id);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {candidate.interviewFeedback ? 'Edit Interview Feedback' : 'Add Interview Feedback'}
                  </button>
                  <button
                    onClick={() => {
                      setShowApplicationModal(null);
                      setShowNotesModal(candidate.id);
                    }}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Add Note
                  </button>
                  <button
                    onClick={() => setShowApplicationModal(null)}
                    className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add to Shortlist Modal */}
      {showAddToShortlistModal && (() => {
        // Filter to only show interviewed candidates
        const interviewedIds = selectedIds.filter(id => {
          const candidate = candidates.find(c => c.id === id);
          return candidate && (candidate.status === 'interview' || candidate.status === 'phone-interview' || candidate.interviewFeedback);
        });
        const notInterviewedIds = selectedIds.filter(id => !interviewedIds.includes(id));
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add to Shortlist</h3>
              <button
                onClick={() => setShowAddToShortlistModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {notInterviewedIds.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">
                    <div className="font-semibold text-yellow-900">Interview Required</div>
                    <div className="text-yellow-800 mt-1">
                      {notInterviewedIds.length} candidate{notInterviewedIds.length > 1 ? 's haven\'t' : ' hasn\'t'} been interviewed yet. 
                      Shortlist is for candidates ready for final offer decision.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {interviewedIds.length > 0 ? (
              <p className="text-gray-600 mb-4">
                Add {interviewedIds.length} interviewed candidate{interviewedIds.length > 1 ? 's' : ''} to shortlist:
              </p>
            ) : (
              <p className="text-gray-600 mb-4">
                No interviewed candidates selected. Please interview candidates before adding to shortlist.
              </p>
            )}

            {interviewedIds.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-gray-500 mb-2">Cannot add to shortlist</p>
                <p className="text-sm text-gray-400">Candidates must be interviewed first</p>
              </div>
            ) : shortlists.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 mb-2">No shortlists yet</p>
                <p className="text-sm text-gray-400">Go to Shortlists tab to create one</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {shortlists.map((sl) => (
                  <button
                    key={sl.id}
                    onClick={() => {
                      onAddToShortlist?.(sl.id, interviewedIds);
                      setShowAddToShortlistModal(false);
                      setSelectedIds([]);
                    }}
                    className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="font-semibold text-gray-900">{sl.name || `Shortlist ${sl.id}`}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {sl.items?.length || 0} candidate{sl.items?.length !== 1 ? 's' : ''} • Created {new Date(sl.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowAddToShortlistModal(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        );
      })()}

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
                  placeholder="Any additional observations about the test..."
                  className="w-full border rounded-lg p-2 h-24 resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold">Future Integration Ready</div>
                    <div className="mt-1">This system is designed to integrate with external test providers like HackerRank, Codility, or custom testing platforms.</div>
                  </div>
                </div>
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

export default CandidateList;
