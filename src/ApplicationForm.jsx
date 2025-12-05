import React from "react";

const ApplicationForm = ({ onSubmit, jobs = [] }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [form, setForm] = React.useState({
    jobId: jobs[0]?.id || "",
    // Contact Information
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    country: "Pakistan",
    streetAddress1: "",
    streetAddress2: "",
    city: "",
    state: "",
    postalCode: "",
    // Education
    education: [{ school: "", fieldOfStudy: "", degree: "", graduated: "no", stillAttending: false }],
    // Employment
    employment: [{ employer: "", jobTitle: "", currentEmployer: false, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "" }],
    // Skills
    skills: [],
    skillInput: "",
    // Languages
    languages: [{ language: "", proficiency: "Fluent" }],
    // Additional
    coverLetter: "",
    portfolioLink: "",
  });

  const steps = [
    { name: "Resume", icon: "📄" },
    { name: "Profile Information", icon: "👤" },
    { name: "Self-Disclosure", icon: "🔐" },
    { name: "Review & Submit", icon: "✓" },
  ];

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleArrayChange(arrayName, index, field, value) {
    setForm((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addArrayItem(arrayName, template) {
    setForm((prev) => ({ ...prev, [arrayName]: [...prev[arrayName], template] }));
  }

  function removeArrayItem(arrayName, index) {
    setForm((prev) => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  }

  function addSkill() {
    if (form.skillInput.trim()) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, prev.skillInput.trim()], skillInput: "" }));
    }
  }

  function removeSkill(index) {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  function nextStep() {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-xl mb-2 ${
                  index <= currentStep ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {index < currentStep ? "✓" : step.icon}
                </div>
                <div className={`text-xs font-medium text-center ${index <= currentStep ? "text-green-700" : "text-gray-500"}`}>
                  {step.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {index === currentStep ? "In Progress" : index < currentStep ? "Completed" : "Not Started"}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-2 ${index < currentStep ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 0: Resume/Job Selection */}
        {currentStep === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              📄 Select Position
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Position Applied For *</label>
                <select 
                  value={form.jobId} 
                  onChange={e => handleChange('jobId', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                  required
                >
                  {jobs.length === 0 ? (
                    <option value="">No jobs available</option>
                  ) : (
                    jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} — {j.department}</option>
                    ))
                  )}
                </select>
                {jobs.find(j => j.id === form.jobId) && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">{jobs.find(j => j.id === form.jobId).title}</h3>
                    <p className="text-sm text-blue-700">{jobs.find(j => j.id === form.jobId).description}</p>
                    <div className="mt-3 flex gap-4 text-xs text-blue-600">
                      <span>📍 {jobs.find(j => j.id === form.jobId).department}</span>
                      <span>💼 {jobs.find(j => j.id === form.jobId).employmentType}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Profile Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                👤 Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Name</label>
                  <input value={form.preferredName} onChange={e => handleChange('preferredName', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Phone</label>
                  <input value={form.alternatePhone} onChange={e => handleChange('alternatePhone', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Address</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country/Region *</label>
                    <input value={form.country} onChange={e => handleChange('country', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address 1</label>
                    <input value={form.streetAddress1} onChange={e => handleChange('streetAddress1', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address 2</label>
                    <input value={form.streetAddress2} onChange={e => handleChange('streetAddress2', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City/Town *</label>
                      <input value={form.city} onChange={e => handleChange('city', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State/Province *</label>
                      <input value={form.state} onChange={e => handleChange('state', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zip/Postal Code *</label>
                      <input value={form.postalCode} onChange={e => handleChange('postalCode', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Education Summary */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🎓 Education Summary
              </h2>
              {form.education.map((edu, index) => (
                <div key={index} className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Education {index + 1}</h3>
                    {form.education.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('education', index)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">School/Institution *</label>
                      <input value={edu.school} onChange={e => handleArrayChange('education', index, 'school', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Field of Study *</label>
                      <input value={edu.fieldOfStudy} onChange={e => handleArrayChange('education', index, 'fieldOfStudy', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Degree *</label>
                      <select value={edu.degree} onChange={e => handleArrayChange('education', index, 'degree', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required>
                        <option value="">Select Degree</option>
                        <option value="High School">High School</option>
                        <option value="Associate's">Associate's Degree</option>
                        <option value="Bachelor's">Bachelor's Degree</option>
                        <option value="Master's">Master's Degree</option>
                        <option value="Doctorate">Doctorate</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 mt-8">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={edu.stillAttending} onChange={e => handleArrayChange('education', index, 'stillAttending', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                        <span className="text-sm font-medium text-gray-700">Still Attending</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('education', { school: "", fieldOfStudy: "", degree: "", graduated: "no", stillAttending: false })} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition">
                + Add Education
              </button>
            </div>

            {/* Employment Summary */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                💼 Employment Summary
              </h2>
              {form.employment.map((emp, index) => (
                <div key={index} className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Employment {index + 1}</h3>
                    {form.employment.length > 1 && (
                      <button type="button" onClick={() => removeArrayItem('employment', index)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Employer *</label>
                        <input value={emp.employer} onChange={e => handleArrayChange('employment', index, 'employer', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                        <input value={emp.jobTitle} onChange={e => handleArrayChange('employment', index, 'jobTitle', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" required />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={emp.currentEmployer} onChange={e => handleArrayChange('employment', index, 'currentEmployer', e.target.checked)} className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                      <span className="text-sm font-medium text-gray-700">Current Employer</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Month</label>
                        <select value={emp.startMonth} onChange={e => handleArrayChange('employment', index, 'startMonth', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition">
                          <option value="">Month</option>
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Start Year</label>
                        <input type="number" value={emp.startYear} onChange={e => handleArrayChange('employment', index, 'startYear', e.target.value)} placeholder="YYYY" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                      </div>
                      {!emp.currentEmployer && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Month</label>
                            <select value={emp.endMonth} onChange={e => handleArrayChange('employment', index, 'endMonth', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition">
                              <option value="">Month</option>
                              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Year</label>
                            <input type="number" value={emp.endYear} onChange={e => handleArrayChange('employment', index, 'endYear', e.target.value)} placeholder="YYYY" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
                      <textarea value={emp.description} onChange={e => handleArrayChange('employment', index, 'description', e.target.value)} rows="3" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('employment', { employer: "", jobTitle: "", currentEmployer: false, startMonth: "", startYear: "", endMonth: "", endYear: "", description: "" })} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition">
                + Add Employment
              </button>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ⚡ Skills
              </h2>
              <div className="flex gap-2 mb-4">
                <input value={form.skillInput} onChange={e => handleChange('skillInput', e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill..." className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                <button type="button" onClick={addSkill} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {skill}
                    <button type="button" onClick={() => removeSkill(index)} className="text-green-600 hover:text-green-800 font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                🌐 Languages Spoken
              </h2>
              {form.languages.map((lang, index) => (
                <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                      <input value={lang.language} onChange={e => handleArrayChange('languages', index, 'language', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Proficiency</label>
                      <select value={lang.proficiency} onChange={e => handleArrayChange('languages', index, 'proficiency', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition">
                        <option value="Basic">Basic</option>
                        <option value="Conversational">Conversational</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Native">Native</option>
                      </select>
                    </div>
                  </div>
                  {form.languages.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem('languages', index)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem('languages', { language: "", proficiency: "Fluent" })} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition">
                + Add Language
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Self-Disclosure */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              🔐 Self-Disclosure (Optional)
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Letter</label>
                <textarea value={form.coverLetter} onChange={e => handleChange('coverLetter', e.target.value)} rows="6" placeholder="Why are you interested in this position?" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio Link</label>
                <input type="url" value={form.portfolioLink} onChange={e => handleChange('portfolioLink', e.target.value)} placeholder="https://..." className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 transition" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              ✓ Review Your Application
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="font-bold text-lg text-green-900 mb-4">Position</h3>
                <p className="text-green-700">{jobs.find(j => j.id === form.jobId)?.title}</p>
              </div>
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <h3 className="font-bold text-lg text-blue-900 mb-4">Contact</h3>
                <p className="text-blue-700">{form.firstName} {form.lastName}</p>
                <p className="text-blue-600 text-sm">{form.email} • {form.phone}</p>
              </div>
              <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <h3 className="font-bold text-lg text-purple-900 mb-4">Education</h3>
                {form.education.map((edu, i) => (
                  <p key={i} className="text-purple-700 text-sm mb-1">• {edu.degree} in {edu.fieldOfStudy} from {edu.school}</p>
                ))}
              </div>
              <div className="p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <h3 className="font-bold text-lg text-orange-900 mb-4">Experience</h3>
                {form.employment.map((emp, i) => (
                  <p key={i} className="text-orange-700 text-sm mb-1">• {emp.jobTitle} at {emp.employer}</p>
                ))}
              </div>
              {form.skills.length > 0 && (
                <div className="p-6 bg-pink-50 border-2 border-pink-200 rounded-lg">
                  <h3 className="font-bold text-lg text-pink-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {form.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
            >
              Next →
            </button>
          ) : (
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg transition shadow-lg hover:shadow-xl"
            >
              Submit Application ✓
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
