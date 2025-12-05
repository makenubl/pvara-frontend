import React from "react";

// TODO: Connect to /api/interviews for interview rubric data
// Example: fetch('/api/interviews')

const InterviewRubric = ({ rubric, onEvaluate, jobs = [], applications = [], selectedJobForAI, handleSelectJobForAI }) => {
  // AI Screening logic migrated from PvaraPhase2.jsx
  const jobList = jobs.filter(j => j.status === 'open');
  const selectedJob = selectedJobForAI ? jobs.find(j => j.id === selectedJobForAI) : jobList[0];
  const jobApps = selectedJob
    ? applications.filter(a => a.jobId === selectedJob.id)
    : [];

  return (
    <div>
      <div className="bg-white p-4 rounded shadow">
        <label className="block font-semibold mb-2">Select Job Position</label>
        <select
          value={selectedJobForAI || ''}
          onChange={(e) => handleSelectJobForAI(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Choose a job --</option>
          {jobList.map(j => (
            <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
          ))}
        </select>
      </div>
      {/* AI Screening Panel: Add rubric and evaluation logic here as needed */}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Applications for Selected Job</h3>
        {jobApps.length === 0 ? (
          <div className="text-gray-500">No applications for this job.</div>
        ) : (
          <ul className="space-y-2">
            {jobApps.map(app => (
              <li key={app.id} className="p-2 border rounded bg-gray-50">
                <div className="font-semibold">{app.applicant.name}</div>
                <div className="text-xs text-gray-500">{app.applicant.email}</div>
                {/* Add rubric evaluation UI here if needed */}
                <button onClick={() => onEvaluate(app)} className="mt-2 px-2 py-1 border rounded text-sm bg-green-700 text-white">Evaluate</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default InterviewRubric;
