import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import logo from "./logo.png";
import "./index.css";
import { ToastProvider, useToast } from "./ToastContext";
import { AuthProvider, useAuth } from "./AuthContext";
import JobList from "./JobList";
import CandidateList from "./CandidateList";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import InterviewRubric from "./InterviewRubric";
import AuditLog from "./AuditLog";
import ApplicationForm from "./ApplicationForm";
import ShortlistPanel from "./ShortlistPanel";
import Toasts from "./Toasts";

// ---------- Storage utilities ----------
const STORAGE_KEY = "pvara_v3";
function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {}
}
function loadState() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch (e) {
    return null;
  }
}
function arrayToCSV(rows) {
  return rows.map((r) => r.map((c) => '"' + ("" + c).replace(/"/g, '""') + '"').join(",")).join("\n");
}

// ---------- Small UI primitives ----------
function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded w-96 p-4">
        <div className="font-semibold">{title}</div>
        <div className="mt-2 text-sm whitespace-pre-wrap">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1 bg-green-700 text-white rounded">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginInline({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const handleUsernameChange = useCallback((value) => setU(value), []);
  const handlePasswordChange = useCallback((value) => setP(value), []);
  return (
    <div className="space-y-2">
      <input value={u} onChange={(e) => handleUsernameChange(e.target.value)} placeholder="username" className="border p-1 rounded w-full text-xs" />
      <input value={p} onChange={(e) => handlePasswordChange(e.target.value)} placeholder="password" type="password" className="border p-1 rounded w-full text-xs" />
      <div className="flex gap-2">
        <button onClick={() => onLogin({ username: u.trim(), password: p })} className="px-2 py-1 bg-white border rounded text-green-700 text-xs">
          Login
        </button>
      </div>
      <div className="text-xs text-gray-400">demo: admin/hr/recruit/viewer (password = anything)</div>
    </div>
  );
}

// ---------- Default state ----------
function defaultState() {
  const jobs = [
    {
      id: "job-1733420800001",
      title: "Senior Software Engineer",
      department: "Engineering",
      grade: "Scale-9",
      createdAt: "2025-12-05T10:00:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 3, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "We are looking for a skilled Senior Software Engineer to design, develop, and maintain scalable web applications. You'll work with modern technologies including React, Node.js, and cloud platforms to build innovative solutions.",
      locations: ["Karachi", "Lahore"],
      openings: 2,
      employmentType: "Full-time",
      salary: { min: 150000, max: 250000 },
      status: "open",
    },
    {
      id: "job-1733420800002",
      title: "Product Manager - Digital Products",
      department: "Product",
      grade: "Scale-8",
      createdAt: "2025-12-04T14:30:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 5, mandatory: true },
        uploads: { value: { cv: true, coverLetter: true }, mandatory: true },
      },
      description: "Lead product strategy and execution for our digital financial services. Partner with engineering, design, and business teams to deliver world-class customer experiences. Strong background in fintech or digital payments required.",
      locations: ["Islamabad"],
      openings: 1,
      employmentType: "Full-time",
      salary: { min: 200000, max: 350000 },
      status: "open",
    },
    {
      id: "job-1733420800003",
      title: "UI/UX Designer",
      department: "Design",
      grade: "Scale-7",
      createdAt: "2025-12-03T09:15:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: false },
        minExperience: { value: 2, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "Create beautiful, intuitive user interfaces and exceptional user experiences. Work closely with product and engineering teams to bring designs to life. Portfolio showcasing mobile and web design required.",
      locations: ["Karachi", "Remote"],
      openings: 3,
      employmentType: "Full-time",
      salary: { min: 80000, max: 150000 },
      status: "open",
    },
    {
      id: "job-1733420800004",
      title: "Data Scientist",
      department: "Analytics",
      grade: "Scale-8",
      createdAt: "2025-12-02T11:45:00.000Z",
      fields: {
        degreeRequired: { value: "Master", mandatory: true },
        minExperience: { value: 3, mandatory: true },
        uploads: { value: { cv: true, coverLetter: true }, mandatory: true },
      },
      description: "Apply machine learning and statistical analysis to solve complex business problems. Build predictive models, conduct A/B testing, and drive data-informed decision making. Experience with Python, SQL, and ML frameworks essential.",
      locations: ["Lahore"],
      openings: 1,
      employmentType: "Full-time",
      salary: { min: 180000, max: 280000 },
      status: "open",
    },
    {
      id: "job-1733420800005",
      title: "DevOps Engineer",
      department: "Engineering",
      grade: "Scale-8",
      createdAt: "2025-12-01T16:20:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 4, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "Build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure system reliability. Expertise in AWS/Azure, Docker, Kubernetes, and infrastructure as code required. On-call rotation expected.",
      locations: ["Karachi", "Islamabad"],
      openings: 2,
      employmentType: "Full-time",
      salary: { min: 160000, max: 240000 },
      status: "open",
    },
    {
      id: "job-1733420800006",
      title: "Business Development Manager",
      department: "Sales",
      grade: "Scale-7",
      createdAt: "2025-11-30T13:00:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 5, mandatory: true },
        uploads: { value: { cv: true, coverLetter: true }, mandatory: true },
      },
      description: "Drive strategic partnerships and revenue growth. Identify new business opportunities, negotiate contracts, and build long-term relationships with key clients. Experience in B2B sales and fintech preferred.",
      locations: ["Lahore", "Karachi"],
      openings: 2,
      employmentType: "Full-time",
      salary: { min: 120000, max: 200000 },
      status: "open",
    },
    {
      id: "job-1733420800007",
      title: "Quality Assurance Engineer",
      department: "Engineering",
      grade: "Scale-6",
      createdAt: "2025-11-29T10:30:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 2, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "Ensure software quality through comprehensive testing strategies. Create automated test suites, perform manual testing, and work with developers to resolve issues. Experience with Selenium, Playwright, or Cypress preferred.",
      locations: ["Remote"],
      openings: 4,
      employmentType: "Full-time",
      salary: { min: 70000, max: 120000 },
      status: "open",
    },
    {
      id: "job-1733420800008",
      title: "Marketing Manager",
      department: "Marketing",
      grade: "Scale-7",
      createdAt: "2025-11-28T15:45:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 4, mandatory: true },
        uploads: { value: { cv: true, coverLetter: true }, mandatory: true },
      },
      description: "Lead integrated marketing campaigns across digital and traditional channels. Develop brand strategy, manage marketing budget, and drive customer acquisition. Experience in growth marketing and analytics essential.",
      locations: ["Islamabad"],
      openings: 1,
      employmentType: "Full-time",
      salary: { min: 140000, max: 220000 },
      status: "open",
    },
    {
      id: "job-1733420800009",
      title: "Customer Success Specialist",
      department: "Customer Success",
      grade: "Scale-5",
      createdAt: "2025-11-27T12:00:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: false },
        minExperience: { value: 1, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "Be the voice of our customers. Handle inquiries, resolve issues, and ensure customer satisfaction. Build strong relationships and identify opportunities for upselling. Excellent communication skills required.",
      locations: ["Karachi", "Lahore", "Islamabad"],
      openings: 5,
      employmentType: "Full-time",
      salary: { min: 50000, max: 80000 },
      status: "open",
    },
    {
      id: "job-1733420800010",
      title: "HR Business Partner",
      department: "Human Resources",
      grade: "Scale-7",
      createdAt: "2025-11-26T09:30:00.000Z",
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 5, mandatory: true },
        uploads: { value: { cv: true, coverLetter: true }, mandatory: true },
      },
      description: "Partner with business leaders on talent strategy, organizational development, and culture initiatives. Drive recruitment, performance management, and employee engagement programs. SHRM certification preferred.",
      locations: ["Islamabad"],
      openings: 1,
      employmentType: "Full-time",
      salary: { min: 130000, max: 200000 },
      status: "open",
    },
  ];
  return { jobs, applications: [], shortlists: [], audit: [], settings: { scoring: { education: 40, experience: 40, interview: 20 } } };
}

// ---------- App ----------
const emptyJobForm = {
  title: "",
  department: "",
  grade: "",
  description: "",
  locations: [],
  openings: "1",
  employmentType: "Full-time",
  salary: { min: "", max: "" },
  fields: {},
};

function PvaraPhase2() {
  const [state, setState] = useState(() => loadState() || defaultState());
  useEffect(() => saveState(state), [state]);

  const auth = useAuth();
  const user = auth?.user ?? null;
  const { addToast } = useToast();

  const [view, setView] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [appForm, setAppForm] = useState({
    jobId: (state.jobs && state.jobs[0]) ? state.jobs[0].id : "",
    name: "",
    email: "",
    cnic: "",
    phone: "",
    degree: "",
    experienceYears: "",
    address: "",
    linkedin: "",
  });
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });
  const [drawer, setDrawer] = useState({ open: false, app: null });
  const [hrSearch, setHrSearch] = useState("");
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedJobForAI, setSelectedJobForAI] = useState(null);
  const handleSelectJobForAI = useCallback((value) => setSelectedJobForAI(value), []);

  // Memoized handlers to prevent input focus loss
  const handleAppFormChange = useCallback((field, value) => {
    setAppForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleJobFormChange = useCallback((field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSalaryChange = useCallback((field, value) => {
    setJobForm((prev) => ({ ...prev, salary: { ...prev.salary, [field]: value } }));
  }, []);

  const handleHrSearchChange = useCallback((value) => {
    setHrSearch(value);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const createJob = useCallback((jobData) => {
    // Handle both event (from form) and job object (from JobList component)
    if (jobData && typeof jobData.preventDefault === 'function') {
      jobData.preventDefault();
    }
    
    // If jobData is a job object (from JobList), use it directly
    if (jobData && jobData.title && !jobData.preventDefault) {
      const j = { ...jobData, createdAt: jobData.createdAt || new Date().toISOString() };
      setState((s) => ({ ...s, jobs: [j, ...(s.jobs || [])] }));
      audit("create-job", { jobId: j.id, title: j.title });
      addToast("Job created (local)", { type: "success" });
      return;
    }
    
    // Original form-based logic
    if (editingJobId) {
      const updated = { ...normalizeJobFormForSave(jobForm), id: editingJobId };
      setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === editingJobId ? updated : j)) }));
      audit("update-job", { jobId: editingJobId, title: updated.title });
      addToast("Job updated", { type: "success" });
      setEditingJobId(null);
      setJobForm(emptyJobForm);
      return;
    }

    const j = { ...normalizeJobFormForSave(jobForm), id: `job-${Date.now()}`, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, jobs: [j, ...(s.jobs || [])] }));
    audit("create-job", { jobId: j.id, title: j.title });
    setJobForm(emptyJobForm);
    addToast("Job created (local)", { type: "success" });
  }, [editingJobId, jobForm, addToast, state]); // eslint-disable-line react-hooks/exhaustive-deps

  function audit(action, details) {
    // CORRECTED: use a template literal so JS parses it
    const rec = { id: `au-${Date.now()}`, action, details, ts: new Date().toISOString(), user: user?.username || "anon" };
    setState((s) => ({ ...s, audit: [rec, ...(s.audit || [])] }));
  }

  function normalizeJobFormForSave(form) {
    const openingsNum = form.openings === "" ? null : Number(form.openings);
    const salaryMinNum = form.salary?.min === "" ? null : Number(form.salary?.min);
    const salaryMaxNum = form.salary?.max === "" ? null : Number(form.salary?.max);
    return {
      ...form,
      openings: openingsNum ?? 1,
      salary: {
        min: salaryMinNum ?? 0,
        max: salaryMaxNum ?? 0,
      },
    };
  }

  const updateJob = useCallback((jobData) => {
    if (jobData && jobData.id) {
      setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === jobData.id ? jobData : j)) }));
      audit("update-job", { jobId: jobData.id, title: jobData.title });
      addToast("Job updated", { type: "success" });
      setEditingJobId(null);
      setJobForm(emptyJobForm);
    }
  }, [addToast, state]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteJob = useCallback((jobId) => {
    setState((s) => ({ ...s, jobs: (s.jobs || []).filter((j) => j.id !== jobId) }));
    audit("delete-job", { jobId });
    addToast("Job deleted", { type: "info" });
  }, [addToast, state]); // eslint-disable-line react-hooks/exhaustive-deps

  function submitApplication(formData) {
    // Handle both event (from internal form) and form data (from ApplicationForm component)
    if (formData && typeof formData.preventDefault === 'function') {
      formData.preventDefault();
      formData = null; // Use appForm state instead
    }
    
    const applicantData = formData || appForm;
    const job = (state.jobs || []).find((j) => j.id === applicantData.jobId);
    if (!job) {
      addToast("Select job", { type: "error" });
      return;
    }

    const errs = [];
    const jf = job.fields || {};
    if (jf.degreeRequired?.mandatory && !applicantData.degree) errs.push("Degree required");
    if (jf.minExperience?.mandatory && !(Number(applicantData.experienceYears) >= Number(jf.minExperience.value))) errs.push("Min experience not met");
    const files = fileRef.current?.files ? Array.from(fileRef.current.files) : [];
    if (jf.uploads?.value?.cv && !files.some((f) => /\.pdf$|\.docx?$|\.doc$/i.test(f.name))) errs.push("CV required");

    if (errs.length) {
      setConfirm({
        open: true,
        title: "Validation",
        message: errs.join("\n") + "\nSubmit anyway?",
        onConfirm: () => {
          finalizeApplication(job, files, true, applicantData);
          setConfirm({ open: false, title: "", message: "", onConfirm: null });
        },
      });
      return;
    }

    finalizeApplication(job, files, false, applicantData);
  }

  function finalizeApplication(job, files, manual, applicantData) {
    const data = applicantData || appForm;
    const filesNames = (files || []).map((f) => f.name);
    const app = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      applicant: { ...data },
      files: filesNames,
      status: manual ? "manual-review" : "submitted",
      createdAt: new Date().toISOString(),
      screeningErrors: manual ? ["failed mandatory checks"] : [],
    };
    setState((s) => ({ ...s, applications: [app, ...(s.applications || [])] }));
    audit("submit-app", { appId: app.id, jobId: job.id, status: app.status });
    setAppForm({ jobId: state.jobs[0]?.id || "", name: "", email: "", cnic: "", phone: "", degree: "", experienceYears: "", address: "", linkedin: "" });
    if (fileRef.current) fileRef.current.value = null;
    addToast("Application submitted: " + app.status, { type: "success" });
    
    // Send confirmation email
    const emailData = {
      to: data.email,
      templateType: "APPLICATION_RECEIVED",
      data: {
        candidateName: data.name,
        jobTitle: job.title,
      },
    };
    
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    fetch(`${apiUrl}/api/send-email-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          console.log(`📧 Confirmation email sent to ${data.email}`);
        } else {
          console.log("📧 Email service unavailable (backend not running)");
        }
      })
      .catch((err) => {
        console.log("📧 Email service unavailable:", err.message);
      });
  }

  // Simple job form validator (inline validations)
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

  // Change application status (shortlist, interview, reject, hired, etc.)
  function changeApplicationStatus(appId, status, note) {
    setState((s) => {
      const apps = (s.applications || []).map((a) => (a.id === appId ? { ...a, status, screeningErrors: status === 'rejected' ? [note || 'Rejected by reviewer'] : (a.screeningErrors || []) } : a));
      return { ...s, applications: apps };
    });
    audit("change-app-status", { appId, status, note });
    addToast("Application status updated: " + status, { type: status === 'rejected' ? 'error' : 'success' });
    setDrawer((d) => (d.open && d.app && d.app.id === appId ? { ...d, app: { ...d.app, status } } : d));
    
    // Send status update email
    const app = (state.applications || []).find((a) => a.id === appId);
    if (app && app.applicant && app.applicant.email) {
      const emailTemplates = {
        shortlisted: "APPLICATION_SHORTLISTED",
        interviewed: "INTERVIEW_SCHEDULED",
        rejected: "REJECTION",
      };
      
      const templateType = emailTemplates[status];
      if (templateType) {
        const job = (state.jobs || []).find((j) => j.id === app.jobId);
        const emailData = {
          to: app.applicant.email,
          templateType,
          data: {
            candidateName: app.applicant.name,
            jobTitle: job?.title || "Position",
          },
        };
        
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        fetch(`${apiUrl}/api/send-email-template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              console.log(`📧 Status email sent to ${app.applicant.email}`);
            }
          })
          .catch((err) => console.log("📧 Email unavailable:", err.message));
      }
    }
  }

  // openDrawer accepts either an application object or an id and always resolves latest state
  function openDrawer(appOrId) {
    const app = typeof appOrId === 'string' ? (state.applications || []).find((x) => x.id === appOrId) : appOrId;
    setDrawer({ open: true, app });
  }
  function closeDrawer() {
    setDrawer({ open: false, app: null });
  }

  // Handle interview evaluation submission with AI score calculation
  function submitInterviewEvaluation(evaluation) {
    const candidate = state.applications.find(a => a.id === evaluation.candidateId);
    if (!candidate) return;

    // Calculate interview score (1-10 weighted average)
    const interviewScore = Object.values(evaluation.scores).reduce((a, b) => a + b) / Object.keys(evaluation.scores).length;

    setState((s) => {
      const apps = (s.applications || []).map((a) =>
        a.id === evaluation.candidateId
          ? {
            ...a,
            interviewScore: Math.round(interviewScore * 10),
            interviewNotes: evaluation.notes,
            interviewedAt: evaluation.timestamp,
            evaluationScores: evaluation.scores,
          }
          : a
      );
      return { ...s, applications: apps };
    });

    audit("submit-evaluation", { appId: evaluation.candidateId, score: Math.round(interviewScore * 10) });
    addToast("Interview evaluation saved", { type: "success" });
    closeDrawer();
  }

  function toggleSelectApp(appId) {
    setSelectedApps((s) => (s.includes(appId) ? s.filter((x) => x !== appId) : [...s, appId]));
  }

  function createShortlist(jobId, applicantIds) {
    const scoring = state.settings.scoring;
    const selected = (state.applications || []).filter((a) => applicantIds.includes(a.id));
    const scored = selected.map((a) => {
      const eduMatch = a.applicant.degree ? 1 : 0;
      const expScore = Math.min((Number(a.applicant.experienceYears) || 0) / 10, 1);
      const interviewScore = (a.interviewScore || 0) / 10;
      const total = eduMatch * scoring.education + expScore * scoring.experience + interviewScore * scoring.interview;
      return { ...a, score: Math.round(total) };
    });
    const sorted = scored.sort((a, b) => b.score - a.score);
    const sl = { id: `sl-${Date.now()}`, jobId, items: sorted.map((s) => ({ applicantId: s.id, score: s.score })), createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, shortlists: [sl, ...(s.shortlists || [])] }));
    audit("create-shortlist", { shortlistId: sl.id, count: sl.items.length });
  }

  function exportShortlistCSV(slId) {
    const sl = state.shortlists.find((s) => s.id === slId);
    if (!sl) return addToast("Shortlist not found", { type: "error" });
    const rows = [["Name", "Email", "Score"]];
    sl.items.forEach((i) => {
      const a = state.applications.find((x) => x.id === i.applicantId);
      rows.push([a.applicant.name, a.applicant.email, i.score]);
    });
    const csv = arrayToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shortlist-${slId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- UI components ----------
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function Sidebar() {
    return (
      <>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 glass-button text-gray-800 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed lg:static w-72 glass-sidebar text-gray-800 min-h-screen p-6 flex flex-col z-40 transition-transform duration-300 shadow-2xl ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="PVARA" className="h-10" />
          <div>
            <div className="font-display font-bold text-2xl text-green-700">PVARA</div>
            <div className="text-xs text-gray-600 font-medium tracking-wide">RECRUITMENT</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => { setView("jobs"); setMobileMenuOpen(false); setSelectedJobId(null); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "jobs" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Browse Jobs
          </button>
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "dashboard" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard
          </button>
          <button onClick={() => { setView("apply"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "apply" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            Apply
          </button>
          <button onClick={() => { setView("my-apps"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "my-apps" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            My Applications
          </button>
          {auth.hasRole('admin') && (
            <button onClick={() => { setView("admin"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "admin" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Admin
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("hr"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "hr" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              HR Review
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("ai-screening"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "ai-screening" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              AI Screening
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("analytics"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "analytics" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Analytics
            </button>
          )}
          <button onClick={() => { setView("shortlists"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-all ${view === "shortlists" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            ⭐ Shortlists
          </button>
          <button onClick={() => { setView("audit"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-all ${view === "audit" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
            📋 Audit Log
          </button>
          {/* Advanced Features Section */}
          <div className="border-t border-gray-300/50 mt-3 pt-3">
            <div className="text-xs uppercase font-semibold text-gray-600 px-3 py-1">Advanced</div>
            {auth.hasRole(['hr','admin','recruiter']) && (
              <>
                <button onClick={() => { setView("emails"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "emails" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  Emails
                </button>
                <button onClick={() => { setView("scheduling"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "scheduling" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Interviews
                </button>
                <button onClick={() => { setView("pipeline"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "pipeline" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Pipeline
                </button>
                <button onClick={() => { setView("offers"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "offers" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Offers
                </button>
                <button onClick={() => { setView("reports"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "reports" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                  Reports
                </button>
              </>
            )}
            {auth.hasRole('admin') && (
              <button onClick={() => { setView("settings"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${view === "settings" ? "glass-button text-green-700 shadow-md" : "hover:glass-button"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                Settings
              </button>
            )}
          </div>
        </nav>

        <div className="mt-4 text-xs text-gray-700">
          {user ? (
            <div className="mt-auto glass-card p-4 rounded-lg">
              <div className="flex items-center gap-2 font-medium mb-2">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <strong>{user.name}</strong>
              </div>
              <div className="text-xs text-gray-600 mb-3">
                Role: <span className="font-semibold text-green-700">{user.role}</span>
              </div>
              <button
                onClick={() => {
                  auth.logout();
                  setView("dashboard");
                }}
                className="text-xs px-3 py-1.5 glass-button rounded-lg hover:shadow-md transition-all font-medium flex items-center gap-2 w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                Logout
              </button>
            </div>
          ) : (
            <div className="mt-auto">
              <LoginInline
                onLogin={(cred) => {
                  const res = auth.login(cred);
                  if (!res.ok) addToast(res.message, { type: 'error' });
                  else setView("dashboard");
                }}
              />
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  function Header({ title }) {
    return (
      <div className="bg-white p-4 rounded shadow-sm mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-green-800">{title}</h2>
            <div className="text-sm text-gray-500">Enterprise Recruitment • PVARA</div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input placeholder="Search applications..." value={hrSearch} onChange={(e) => handleHrSearchChange(e.target.value)} className="border p-2 rounded w-full sm:w-64" />
            <div className="text-sm text-gray-600 whitespace-nowrap">{(state.applications || []).length} applications</div>
          </div>
        </div>
      </div>
    );
  }

  // DashboardView removed - now handled by AnalyticsDashboard component

  // ApplyView removed - now handled by ApplicationForm component

  const JobFormComponent = memo(({ jobForm, editingJobId, validateJobForm, handleJobFormChange, handleSalaryChange, createJob, setJobForm, setEditingJobId }) => {
    // Use local state to track input values independently
    const [localForm, setLocalForm] = useState(jobForm);

    // Sync local state when jobForm prop changes (e.g., when editing)
    useEffect(() => {
      setLocalForm(jobForm);
    }, [editingJobId, jobForm]);

    const handleLocalChange = useCallback((field, value) => {
      setLocalForm(prev => ({ ...prev, [field]: value }));
      // Also update parent state for validation
      handleJobFormChange(field, value);
    }, [handleJobFormChange]);

    const handleLocalSalaryChange = useCallback((field, value) => {
      setLocalForm(prev => ({ ...prev, salary: { ...prev.salary, [field]: value } }));
      handleSalaryChange(field, value);
    }, [handleSalaryChange]);

    const jobErrs = validateJobForm(localForm);
    return (
      <form onSubmit={createJob} className="space-y-2">
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
        {jobErrs.length > 0 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {jobErrs.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}
        <div className="flex gap-2">
            <button className="px-3 py-2 bg-green-700 text-white rounded disabled:opacity-50" disabled={jobErrs.length > 0}>{editingJobId ? 'Update Job' : 'Create Job'}</button>
            <button
              type="button"
              onClick={() => {
                setLocalForm(emptyJobForm);
                setJobForm(emptyJobForm);
              }}
              className="px-3 py-2 border rounded"
            >
              Reset
            </button>
            {editingJobId && (
              <button
                type="button"
                onClick={() => {
                  setEditingJobId(null);
                  setLocalForm(emptyJobForm);
                  setJobForm(emptyJobForm);
                }}
                className="px-3 py-2 border rounded text-sm"
              >
                Cancel Edit
              </button>
            )}
        </div>
      </form>
    );
  });
  JobFormComponent.displayName = 'JobFormComponent';

  const ApplicationFormComponent = memo(({ appForm, setAppForm, submitApplication, fileRef, state, handleAppFormChange }) => {
    // Use local state to track input values independently
    const [localForm, setLocalForm] = useState(appForm);

    useEffect(() => {
      setLocalForm(appForm);
    }, [appForm]);

    const handleLocalChange = useCallback((field, value) => {
      setLocalForm(prev => ({ ...prev, [field]: value }));
      handleAppFormChange(field, value);
    }, [handleAppFormChange]);

    return (
      <form onSubmit={submitApplication} className="space-y-3">
        <select value={localForm.jobId} onChange={(e) => handleLocalChange('jobId', e.target.value)} className="border p-2 rounded w-full text-sm md:text-base">
          {(state.jobs || []).map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} — {j.department}
            </option>
          ))}
        </select>

        <input className="border p-2 rounded w-full text-sm md:text-base" placeholder="Full name" value={localForm.name} onChange={(e) => handleLocalChange('name', e.target.value)} required />
        <input className="border p-2 rounded w-full text-sm md:text-base" placeholder="Email" type="email" value={localForm.email} onChange={(e) => handleLocalChange('email', e.target.value)} required />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={localForm.cnic} onChange={(e) => handleLocalChange('cnic', e.target.value)} placeholder="CNIC" className="border p-2 rounded w-full" />
          <input value={localForm.phone} onChange={(e) => handleLocalChange('phone', e.target.value)} placeholder="Phone" className="border p-2 rounded w-full" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={localForm.degree} onChange={(e) => handleLocalChange('degree', e.target.value)} placeholder="Degree" className="border p-2 rounded w-full" />
          <input value={localForm.experienceYears} onChange={(e) => handleLocalChange('experienceYears', e.target.value)} placeholder="Years" type="number" className="border p-2 rounded w-full" />
        </div>

        <input value={localForm.linkedin} onChange={(e) => handleLocalChange('linkedin', e.target.value)} placeholder="LinkedIn profile (optional)" className="border p-2 rounded w-full" />
        <textarea value={localForm.address} onChange={(e) => handleLocalChange('address', e.target.value)} placeholder="Address" className="border p-2 rounded w-full" />

        <div>
          <label className="block mb-1">Upload (CV / other)</label>
          <input ref={fileRef} type="file" multiple />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded">
            Submit
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalForm({
                jobId: (state.jobs && state.jobs[0]) ? state.jobs[0].id : "",
                name: "",
                email: "",
                cnic: "",
                phone: "",
                degree: "",
                experienceYears: "",
                address: "",
                linkedin: "",
              });
              setAppForm({
                jobId: (state.jobs && state.jobs[0]) ? state.jobs[0].id : "",
                name: "",
                email: "",
                cnic: "",
                phone: "",
                degree: "",
                experienceYears: "",
                address: "",
                linkedin: "",
              });
              if (fileRef.current) fileRef.current.value = null;
            }}
            className="px-3 py-2 border rounded"
          >
            Reset
          </button>
        </div>
      </form>
    );
  });
  ApplicationFormComponent.displayName = 'ApplicationFormComponent';

  function CandidateView() {
    // In a demo without real user accounts, show all applications
    // In production, filter by user.email or user.id
    const myApplications = (state.applications || []);

    const getJobTitle = (jobId) => {
      const job = (state.jobs || []).find((j) => j.id === jobId);
      return job ? job.title : "Unknown Position";
    };

    const getStatusColor = (status) => {
      const colors = {
        "submitted": "bg-blue-50 text-blue-700 border-blue-200",
        "manual-review": "bg-yellow-50 text-yellow-700 border-yellow-200",
        "screening": "bg-purple-50 text-purple-700 border-purple-200",
        "interviewed": "bg-orange-50 text-orange-700 border-orange-200",
        "shortlisted": "bg-green-50 text-green-700 border-green-200",
        "hired": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "rejected": "bg-red-50 text-red-700 border-red-200",
      };
      return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
      <div>
        <Header title="My Applications" />
        <div className="bg-white p-4 rounded shadow">
          {myApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No applications yet</div>
              <button 
                onClick={() => setView("apply")}
                className="px-4 py-2 bg-green-700 text-white rounded"
              >
                Apply Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Total Applications: <strong>{myApplications.length}</strong>
              </div>
              {myApplications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-lg mb-2">
                        {getJobTitle(app.jobId)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div>
                          <strong>Applicant:</strong> {app.applicant.name}
                        </div>
                        <div>
                          <strong>Email:</strong> {app.applicant.email}
                        </div>
                        <div>
                          <strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Application ID:</strong> {app.id}
                        </div>
                        {app.screeningErrors && app.screeningErrors.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-red-600">Issues:</strong>
                            <ul className="list-disc list-inside text-red-600">
                              {app.screeningErrors.map((err, i) => (
                                <li key={i} className="text-xs">{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded border text-sm font-medium whitespace-nowrap ml-4 ${getStatusColor(app.status)}`}>
                      {app.status.replace(/-/g, " ").toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function AdminView() {
    if (!user || user.role !== "admin") return <div>Access denied</div>;
    return (
      <div>
        <Header title="Admin - Create Job" />
        <div className="bg-white p-4 rounded shadow">
          <JobFormComponent 
            jobForm={jobForm}
            editingJobId={editingJobId}
            validateJobForm={validateJobForm}
            handleJobFormChange={handleJobFormChange}
            handleSalaryChange={handleSalaryChange}
            createJob={createJob}
            setJobForm={setJobForm}
            setEditingJobId={setEditingJobId}
          />

          <div className="mt-4">
            <h4 className="font-semibold">Existing Jobs</h4>
            {(state.jobs || []).map((j) => (
              <div key={j.id} className="border p-2 rounded mt-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-xs text-gray-500">{j.department}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs">{new Date(j.createdAt).toLocaleDateString()}</div>
                    <button
                      onClick={() => {
                        setJobForm({
                          ...j,
                          openings: j.openings !== undefined && j.openings !== null ? String(j.openings) : "",
                          salary: {
                            min: j.salary?.min !== undefined && j.salary?.min !== null ? String(j.salary.min) : "",
                            max: j.salary?.max !== undefined && j.salary?.max !== null ? String(j.salary.max) : "",
                          },
                        });
                        setEditingJobId(j.id);
                        window.scrollTo?.(0, 0);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteJob(j.id)} className="px-2 py-1 border rounded text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function HRView() {
    if (!user || (user.role !== "hr" && user.role !== "admin" && user.role !== "recruiter")) return <div>Access denied</div>;
    const apps = (state.applications || []).filter((a) => 
      (a.applicant.name || "").toLowerCase().includes(hrSearch.toLowerCase()) || 
      (a.applicant.email || "").toLowerCase().includes(hrSearch.toLowerCase())
    );

    return (
      <div>
        <Header title="HR Review" />
        <div className="bg-white p-4 rounded shadow">
          {apps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {hrSearch ? `No applications match "${hrSearch}"` : "No applications yet"}
              </div>
              {!hrSearch && (state.applications || []).length > 0 && (
                <div className="text-xs text-gray-400 mt-2">
                  Total in system: {(state.applications || []).length}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <div key={a.id} className="p-3 border rounded bg-gray-50 hover:shadow transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{a.applicant.name}</div>
                      <div className="text-xs text-gray-500">{a.applicant.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Applied: {new Date(a.createdAt).toLocaleDateString()} | Status: <span className="font-medium">{a.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => openDrawer(a)} className="px-2 py-1 border rounded text-sm hover:bg-gray-100">
                        View
                      </button>
                      <button
                        onClick={() => toggleSelectApp(a.id)}
                        className={`px-2 py-1 rounded text-sm ${selectedApps.includes(a.id) ? 'bg-green-700 text-white border-green-700' : 'border'}`}
                      >
                        {selectedApps.includes(a.id) ? "✓ Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 flex gap-2 pt-3 border-t">
                <button
                  onClick={() => {
                    if (!selectedApps.length) {
                      addToast("Select applicants first", { type: 'error' });
                      return;
                    }
                    const jobId = state.applications.find((x) => x.id === selectedApps[0])?.jobId;
                    createShortlist(jobId, selectedApps);
                    setSelectedApps([]);
                    addToast("Shortlist created", { type: 'success' });
                  }}
                  className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50"
                  disabled={selectedApps.length === 0}
                >
                  Create Shortlist ({selectedApps.length} selected)
                </button>
                <button
                  onClick={() => setSelectedApps([])}
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ShortlistsView removed - now handled by ShortlistPanel component

  // AuditView removed - now handled by AuditLog component

  // AIScreeningView removed - now handled by InterviewRubric component

  // AnalyticsView removed - now handled by AnalyticsDashboard component

  // Advanced Features View Functions
  // Advanced Features View Functions removed (undefined components)

  // Public Job Board View
  function JobBoardView() {
    const openJobs = (state.jobs || []).filter(j => j.status === 'open');
    
    if (selectedJobId) {
      const job = openJobs.find(j => j.id === selectedJobId);
      if (!job) {
        setSelectedJobId(null);
        return null;
      }
      
      return (
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => setSelectedJobId(null)} 
            className="mb-6 flex items-center gap-2 glass-button px-4 py-2 rounded-lg text-gray-800 hover:text-green-700 font-medium hover:shadow-md transition-all"
          >
            ← Back to All Jobs
          </button>
          
          <div className="glass-strong rounded-xl shadow-2xl overflow-hidden">
            {/* Job Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-8">
              <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap gap-4 text-green-100">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  {job.department}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  {job.locations.join(', ')}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                  {job.employmentType}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" /></svg>
                  ₨{job.salary.min.toLocaleString()} - ₨{job.salary.max.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Job Details */}
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">About the Role</h2>
                <p className="text-gray-700 leading-relaxed">{job.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 glass-card rounded-lg">
                  <h3 className="font-semibold text-green-700 mb-2">📍 Location</h3>
                  <p className="text-gray-700">{job.locations.join(', ')}</p>
                </div>
                <div className="p-4 glass-card rounded-lg">
                  <h3 className="font-semibold text-blue-700 mb-2">👥 Openings</h3>
                  <p className="text-gray-700">{job.openings} position{job.openings > 1 ? 's' : ''} available</p>
                </div>
                <div className="p-4 glass-card rounded-lg">
                  <h3 className="font-semibold text-purple-700 mb-2">💼 Employment Type</h3>
                  <p className="text-gray-700">{job.employmentType}</p>
                </div>
                <div className="p-4 glass-card rounded-lg">
                  <h3 className="font-semibold text-orange-700 mb-2">🎓 Requirements</h3>
                  <p className="text-gray-700">
                    {job.fields?.degreeRequired?.value && `${job.fields.degreeRequired.value} degree`}
                    {job.fields?.minExperience?.value && `, ${job.fields.minExperience.value}+ years exp`}
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <button
                  onClick={() => {
                    setView('apply');
                    setAppForm(prev => ({ ...prev, jobId: job.id }));
                  }}
                  className="w-full md:w-auto px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Apply for this Position →
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="font-display text-6xl font-bold text-gray-800 mb-3">Join Our Team</h1>
          <p className="text-xl text-gray-700 mb-6">Explore exciting opportunities and grow your career with PVARA</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="glass-card rounded-xl shadow-lg p-1 flex items-center">
              <svg className="w-5 h-5 text-gray-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search jobs by title, department, or location..." 
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
              />
              <button className="glass-button px-6 py-2 rounded-lg font-medium text-gray-800 hover:text-green-700 transition mr-1">
                Search
              </button>
            </div>
          </div>
          
          <div className="glass-button inline-block px-4 py-2 rounded-full text-sm font-medium text-gray-800">
            {openJobs.length} open position{openJobs.length !== 1 ? 's' : ''} available
          </div>
        </div>
        
        {openJobs.length === 0 ? (
          <div className="glass-card rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Open Positions</h3>
            <p className="text-gray-500">Check back soon for new opportunities!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {openJobs.map(job => (
              <div
                key={job.id}
                className="glass-card rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border-2 border-white/30 hover:border-green-400 cursor-pointer"
                onClick={() => setSelectedJobId(job.id)}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 hover:text-green-700 transition">
                        {job.title}
                      </h2>
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                          {job.department}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                          {job.locations.join(', ')}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                          {job.employmentType}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>💰 ₨{job.salary.min.toLocaleString()} - ₨{job.salary.max.toLocaleString()}</span>
                        <span>👥 {job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJobId(job.id);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition whitespace-nowrap"
                      >
                        View Details →
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setView('apply');
                          setAppForm(prev => ({ ...prev, jobId: job.id }));
                        }}
                        className="px-6 py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition whitespace-nowrap"
                      >
                        Quick Apply
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
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-6 lg:ml-0 pt-16 lg:pt-6">
        {/* Modularized views for maintainability */}
        {view === "jobs" && <JobBoardView />}
        {view === "dashboard" && <AnalyticsDashboard state={state} />}
        {view === "apply" && <ApplicationForm onSubmit={submitApplication} jobs={state.jobs} />}
        {view === "my-apps" && <CandidateList candidates={state.applications} onStatusChange={changeApplicationStatus} />}
        {view === "admin" && <JobList jobs={state.jobs} onCreate={createJob} onEdit={updateJob} onDelete={deleteJob} />}
        {view === "hr" && <CandidateList candidates={state.applications} onStatusChange={changeApplicationStatus} />}
        {view === "ai-screening" && <InterviewRubric rubric={state.rubric} onEvaluate={submitInterviewEvaluation} jobs={state.jobs} applications={state.applications} selectedJobForAI={selectedJobForAI} handleSelectJobForAI={handleSelectJobForAI} />}
        {view === "analytics" && <AnalyticsDashboard state={state} />}
        {view === "shortlists" && <ShortlistPanel shortlist={state.shortlists} onUpdate={createShortlist} />}
        {view === "audit" && <AuditLog auditRecords={state.audit} />}
        {/* Toast notifications */}
        <Toasts toasts={state.toasts} />
        
        {/* Footer */}
        <footer className="mt-16 glass-card rounded-xl p-8 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <img src={logo} alt="PVARA" className="h-8" />
                  <span className="font-display text-2xl font-bold text-green-700">PVARA</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Enterprise Recruitment Portal powered by AI. Streamline your hiring process with intelligent candidate screening and analytics.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-600 hover:text-green-700 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-green-700 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  <a href="#" className="text-gray-600 hover:text-green-700 transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Browse Jobs</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">About Us</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Careers</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Contact</a></li>
                </ul>
              </div>
              
              {/* Support */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Help Center</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-green-700 transition">FAQ</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-300/50 mt-8 pt-6 text-center">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} PVARA. All rights reserved. | Powered by AI Technology
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 glass-strong shadow-2xl transform transition-transform ${drawer.open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 glass-card flex justify-between items-center">
          <div className="font-semibold">Application Details</div>
          <button onClick={closeDrawer} className="px-2 py-1 border rounded">
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto h-full flex flex-col">
          {drawer.app ? (
            <div className="flex-1">
              <div className="font-semibold text-lg">{drawer.app.applicant.name}</div>
              <div className="text-sm text-gray-500">Applied: {new Date(drawer.app.createdAt).toLocaleString()}</div>
              <div className="mt-2 text-sm"><span className="font-semibold">Status:</span> <span className="text-blue-600">{drawer.app.status || "submitted"}</span></div>
              <div className="mt-2">Email: {drawer.app.applicant.email}</div>
              <div>Phone: {drawer.app.applicant.phone}</div>
              <div>Degree: {drawer.app.applicant.degree}</div>
              <div>Experience: {drawer.app.applicant.experienceYears}</div>
              <div className="mt-2 text-xs text-red-600">Screening: {drawer.app.screeningErrors?.length ? drawer.app.screeningErrors.join(", ") : "Passed"}</div>
              <div className="mt-3">
                <div className="font-semibold mb-2">Files</div>
                {drawer.app.files?.length ? drawer.app.files.map((f, i) => <div key={i} className="text-sm text-blue-600">{f}</div>) : <div className="text-sm text-gray-500">No files</div>}
              </div>
              {auth.hasRole(['hr', 'admin', 'recruiter']) && (
                <div className="mt-4 border-t pt-4">
                  <div className="font-semibold mb-2 text-sm">Actions</div>
                  <div className="space-y-2">
                    <button onClick={() => changeApplicationStatus(drawer.app.id, "screening", "")} className="w-full px-2 py-1 border rounded text-sm bg-yellow-50 hover:bg-yellow-100">Screen</button>
                    <button onClick={() => changeApplicationStatus(drawer.app.id, "phone-interview", "")} className="w-full px-2 py-1 border rounded text-sm bg-blue-50 hover:bg-blue-100">Phone Interview</button>
                    <button onClick={() => changeApplicationStatus(drawer.app.id, "interview", "")} className="w-full px-2 py-1 border rounded text-sm bg-blue-50 hover:bg-blue-100">In-Person Interview</button>
                    <button onClick={() => changeApplicationStatus(drawer.app.id, "offer", "")} className="w-full px-2 py-1 border rounded text-sm bg-green-50 hover:bg-green-100">Send Offer</button>
                    <button onClick={() => changeApplicationStatus(drawer.app.id, "rejected", "Does not meet criteria")} className="w-full px-2 py-1 border rounded text-sm bg-red-50 hover:bg-red-100">Reject</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-gray-500">No application selected</div>
          )}
        </div>
      </div>

      {/* Interview Evaluation Modal */}
      {/* TODO: Add InterviewEvaluationForm modal integration here when available */}

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={() => {
          confirm.onConfirm && confirm.onConfirm();
          setConfirm({ open: false, title: "", message: "", onConfirm: null });
        }}
        onCancel={() => setConfirm({ open: false, title: "", message: "", onConfirm: null })}
      />
    </div>
  );
}

// Wrap with AuthProvider and ToastProvider for standalone mounting
export default function PvaraPhase2Wrapper() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PvaraPhase2 />
      </ToastProvider>
    </AuthProvider>
  );
}