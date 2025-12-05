import React from "react";

// TODO: Connect to /api/jobs for job CRUD operations
// Example: fetch('/api/jobs')

const JobList = ({ jobs, onCreate, onEdit, onDelete }) => {
  // Job form state for creating/editing jobs
  const [localForm, setLocalForm] = React.useState({
    title: "",
    department: "",
    grade: "",
    description: "",
    locations: [],
    openings: "1",
    employmentType: "Full-time",
    salary: { min: "", max: "" },
    deadline: "",
    fields: {},
  });
  const [editingJobId, setEditingJobId] = React.useState(null);

  function handleLocalChange(field, value) {
    setLocalForm((prev) => ({ ...prev, [field]: value }));
  }
  function handleLocalSalaryChange(field, value) {
    setLocalForm((prev) => ({ ...prev, salary: { ...prev.salary, [field]: value } }));
  }
  function resetForm() {
    setLocalForm({
      title: "",
      department: "",
      grade: "",
      description: "",
      locations: [],
      openings: "1",
      employmentType: "Full-time",
      salary: { min: "", max: "" },
      deadline: "",
      fields: {},
    });
    setEditingJobId(null);
  }

  function validateJobForm(form) {
    const errs = [];
    if (!form.title || !form.title.trim()) errs.push("Title required");
    if (!form.department || !form.department.trim()) errs.push("Department required");
    const openingsNum = form.openings === "" ? null : Number(form.openings);
    if (openingsNum !== null && openingsNum <= 0) errs.push("Openings must be > 0");
    const salaryMinNum = form.salary?.min === "" ? null : Number(form.salary?.min);
    const salaryMaxNum = form.salary?.max === "" ? null : Number(form.salary?.max);
    if (salaryMinNum !== null && salaryMaxNum !== null && salaryMinNum > salaryMaxNum) errs.push("Salary min must be <= max");
    return errs;
  }
  const jobErrs = validateJobForm(localForm);

  function handleSubmit(e) {
    e.preventDefault();
    if (editingJobId) {
      onEdit({ ...localForm, id: editingJobId });
      resetForm();
      return;
    }
    onCreate({ ...localForm, id: `job-${Date.now()}` });
    resetForm();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input 
          value={localForm.title} 
          onChange={(e) => handleLocalChange('title', e.target.value)} 
          placeholder="Title" 
          className="border p-2 rounded w-full" 
          autoComplete="off"
        />
        <input 
          value={localForm.department} 
          onChange={(e) => handleLocalChange('department', e.target.value)} 
          placeholder="Department" 
          className="border p-2 rounded w-full" 
          autoComplete="off"
        />
        <textarea 
          value={localForm.description} 
          onChange={(e) => handleLocalChange('description', e.target.value)} 
          placeholder="Description" 
          className="border p-2 rounded w-full" 
          autoComplete="off"
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={localForm.openings ?? ""} onChange={(e) => handleLocalChange('openings', e.target.value)} placeholder="Openings" className="border p-2 rounded w-full" />
          <input value={localForm.employmentType} onChange={(e) => handleLocalChange('employmentType', e.target.value)} placeholder="Employment Type" className="border p-2 rounded w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" value={localForm.salary?.min ?? ""} onChange={(e) => handleLocalSalaryChange('min', e.target.value)} placeholder="Salary Min" className="border p-2 rounded w-full" />
          <input type="number" value={localForm.salary?.max ?? ""} onChange={(e) => handleLocalSalaryChange('max', e.target.value)} placeholder="Salary Max" className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
          <input 
            type="date" 
            value={localForm.deadline ?? ""} 
            onChange={(e) => handleLocalChange('deadline', e.target.value)} 
            className="border p-2 rounded w-full" 
          />
          <p className="text-xs text-gray-500 mt-1">Job posting will automatically close after this date</p>
        </div>
        {jobErrs.length > 0 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {jobErrs.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}
        <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-700 text-white rounded disabled:opacity-50" disabled={jobErrs.length > 0}>{editingJobId ? 'Update Job' : 'Create Job'}</button>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-2 border rounded"
            >
              Reset
            </button>
            {editingJobId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 border rounded text-sm"
              >
                Cancel Edit
              </button>
            )}
        </div>
      </form>
      <div className="mt-4">
        <h4 className="font-semibold">Existing Jobs</h4>
        {(jobs || []).map((j) => (
          <div key={j.id} className="border p-2 rounded mt-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-xs text-gray-500">{j.department}</div>
                {j.deadline && (
                  <div className={`text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                    new Date(j.deadline) < new Date() 
                      ? 'bg-red-100 text-red-700 font-medium' 
                      : new Date(j.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(j.deadline) < new Date() ? 'Closed' : `Closes ${new Date(j.deadline).toLocaleDateString()}`}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLocalForm({
                      ...j,
                      openings: j.openings !== undefined && j.openings !== null ? String(j.openings) : "",
                      deadline: j.deadline || "",
                      salary: {
                        min: j.salary?.min !== undefined && j.salary?.min !== null ? String(j.salary.min) : "",
                        max: j.salary?.max !== undefined && j.salary?.max !== null ? String(j.salary.max) : "",
                      },
                    });
                    setEditingJobId(j.id);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  Edit
                </button>
                <button onClick={() => onDelete(j.id)} className="px-2 py-1 border rounded text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobList;
