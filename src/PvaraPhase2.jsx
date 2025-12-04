import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import logo from "./logo.png";
import "./index.css";
import { ToastProvider, useToast } from "./ToastContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { AnalyticsDashboard, AIScreeningPanel, InterviewEvaluationForm } from "./AnalyticsDashboard";
import {
  EmailNotificationsPanel,
  InterviewSchedulingPanel,
  KanbanPipelineView,
  OfferManagementPanel,
  AnalyticsReportsPanel,
  SettingsPanel,
} from "./AdvancedFeaturesUI";

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
      id: "job-1",
      title: "Senior Software Engineer",
      department: "IT",
      grade: "Scale-9",
      createdAt: new Date().toISOString(),
      fields: {
        degreeRequired: { value: "Bachelor", mandatory: true },
        minExperience: { value: 3, mandatory: true },
        uploads: { value: { cv: true, coverLetter: false }, mandatory: true },
      },
      description: "Build scalable platforms",
      locations: ["Karachi"],
      openings: 2,
      employmentType: "Full-time",
      salary: { min: 80000, max: 200000 },
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

  const [view, setView] = useState("dashboard");
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
  const [evaluationModal, setEvaluationModal] = useState({ open: false, candidate: null });
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
  const createJob = useCallback((e) => {
    e?.preventDefault();
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
      openings: openingsNum ?? 0,
      salary: {
        min: salaryMinNum ?? 0,
        max: salaryMaxNum ?? 0,
      },
    };
  }

  const deleteJob = useCallback((jobId) => {
    setState((s) => ({ ...s, jobs: (s.jobs || []).filter((j) => j.id !== jobId) }));
    audit("delete-job", { jobId });
    addToast("Job deleted", { type: "info" });
  }, [addToast, state]); // eslint-disable-line react-hooks/exhaustive-deps

  function submitApplication(e) {
    e?.preventDefault();
    const job = (state.jobs || []).find((j) => j.id === appForm.jobId);
    if (!job) {
      addToast("Select job", { type: "error" });
      return;
    }

    const errs = [];
    const jf = job.fields || {};
    if (jf.degreeRequired?.mandatory && !appForm.degree) errs.push("Degree required");
    if (jf.minExperience?.mandatory && !(Number(appForm.experienceYears) >= Number(jf.minExperience.value))) errs.push("Min experience not met");
    const files = fileRef.current?.files ? Array.from(fileRef.current.files) : [];
    if (jf.uploads?.value?.cv && !files.some((f) => /\.pdf$|\.docx?$|\.doc$/i.test(f.name))) errs.push("CV required");

    if (errs.length) {
      setConfirm({
        open: true,
        title: "Validation",
        message: errs.join("\n") + "\nSubmit anyway?",
        onConfirm: () => {
          finalizeApplication(job, files, true);
          setConfirm({ open: false, title: "", message: "", onConfirm: null });
        },
      });
      return;
    }

    finalizeApplication(job, files, false);
  }

  function finalizeApplication(job, files, manual) {
    const filesNames = (files || []).map((f) => f.name);
    const app = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      applicant: { ...appForm },
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
      to: appForm.email,
      templateType: "APPLICATION_RECEIVED",
      data: {
        candidateName: appForm.name,
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
      .then((data) => {
        if (data.success) {
          console.log(`📧 Confirmation email sent to ${appForm.email}`);
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
    setEvaluationModal({ open: false, candidate: null });
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
          className="lg:hidden fixed top-4 left-4 z-50 bg-green-800 text-white p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        <div className={`fixed lg:static w-72 bg-gradient-to-b from-green-800 to-green-700 text-white min-h-screen p-6 flex flex-col z-40 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="PVARA" className="h-10" />
          <div>
            <div className="font-semibold text-lg">PVARA</div>
            <div className="text-xs opacity-90">Recruitment</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => { setView("dashboard"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "dashboard" ? "bg-white/10" : ""}`}>
            Dashboard
          </button>
          <button onClick={() => { setView("apply"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "apply" ? "bg-white/10" : ""}`}>
            Apply
          </button>
          <button onClick={() => { setView("my-apps"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "my-apps" ? "bg-white/10" : ""}`}>
            My Applications
          </button>
          {auth.hasRole('admin') && (
            <button onClick={() => { setView("admin"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "admin" ? "bg-white/10" : ""}`}>
              Admin
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("hr"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "hr" ? "bg-white/10" : ""}`}>
              HR Review
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("ai-screening"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "ai-screening" ? "bg-white/10" : ""}`}>
              🤖 AI Screening
            </button>
          )}
          {auth.hasRole(['hr','admin','recruiter']) && (
            <button onClick={() => { setView("analytics"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "analytics" ? "bg-white/10" : ""}`}>
              📊 Analytics
            </button>
          )}
          <button onClick={() => { setView("shortlists"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "shortlists" ? "bg-white/10" : ""}`}>
            Shortlists
          </button>
          <button onClick={() => { setView("audit"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "audit" ? "bg-white/10" : ""}`}>
            Audit Log
          </button>
          {/* Advanced Features Section */}
          <div className="border-t border-white/20 mt-3 pt-3">
            <div className="text-xs uppercase font-semibold opacity-60 px-3 py-1">Advanced</div>
            {auth.hasRole(['hr','admin','recruiter']) && (
              <>
                <button onClick={() => { setView("emails"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "emails" ? "bg-white/10" : ""}`}>
                  📧 Emails
                </button>
                <button onClick={() => { setView("scheduling"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "scheduling" ? "bg-white/10" : ""}`}>
                  📅 Interviews
                </button>
                <button onClick={() => { setView("pipeline"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "pipeline" ? "bg-white/10" : ""}`}>
                  🔄 Pipeline
                </button>
                <button onClick={() => { setView("offers"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "offers" ? "bg-white/10" : ""}`}>
                  💼 Offers
                </button>
                <button onClick={() => { setView("reports"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "reports" ? "bg-white/10" : ""}`}>
                  📈 Reports
                </button>
              </>
            )}
            {auth.hasRole('admin') && (
              <button onClick={() => { setView("settings"); setMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded ${view === "settings" ? "bg-white/10" : ""}`}>
                ⚙️ Settings
              </button>
            )}
          </div>
        </nav>

        <div className="mt-4 text-xs text-gray-200">
          {user ? (
            <div className="mt-auto">
              <div>
                Logged in as <strong>{user.name}</strong>
              </div>
              <div className="mt-1">
                <button
                  onClick={() => {
                    auth.logout();
                    setView("dashboard");
                  }}
                  className="text-xs underline mt-1"
                >
                  Logout
                </button>
              </div>
              <div className="text-xs text-gray-200 mt-2">
                Role: <strong>{user.role}</strong>
              </div>
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

  function DashboardView() {
    const totalApps = (state.applications || []).length;
    const submitted = (state.applications || []).filter((a) => a.status === "submitted").length;
    const manual = (state.applications || []).filter((a) => a.status === "manual-review").length;
    const shortlists = (state.shortlists || []).length;
    return (
      <div className="space-y-4">
        <Header title="Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Total Applications</div>
            <div className="text-2xl font-bold text-green-700">{totalApps}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Submitted</div>
            <div className="text-2xl font-bold text-green-700">{submitted}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Manual Review</div>
            <div className="text-2xl font-bold text-yellow-600">{manual}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Shortlists</div>
            <div className="text-2xl font-bold text-green-700">{shortlists}</div>
          </div>
        </div>
      </div>
    );
  }

  function ApplyView() {
    return (
      <div>
        <Header title="Apply for Job" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded shadow">
            <ApplicationFormComponent 
              appForm={appForm}
              setAppForm={setAppForm}
              submitApplication={submitApplication}
              fileRef={fileRef}
              state={state}
              handleAppFormChange={handleAppFormChange}
            />
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Jobs</h3>
            {(state.jobs || []).map((j) => (
              <div key={j.id} className="border p-2 rounded mt-2">
                <div className="font-semibold">{j.title}</div>
                <div className="text-xs text-gray-500">{j.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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

  function ShortlistsView() {
    return (
      <div>
        <Header title="Shortlists" />
        <div className="space-y-3">
          {(state.shortlists || []).map((s) => (
            <div key={s.id} className="p-3 border rounded bg-white">
              <div className="font-semibold">{s.id}</div>
              <div className="text-xs">Items: {s.items.length}</div>
              <div className="mt-2">
                <button onClick={() => exportShortlistCSV(s.id)} className="px-2 py-1 border rounded">
                  Export CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function AuditView() {
    const rows = (state.audit || []).slice(0, 200);
    function exportAudit() {
      const csvRows = [["id", "action", "details", "ts", "user"]];
      (state.audit || []).forEach((r) => csvRows.push([r.id, r.action, JSON.stringify(r.details || {}), r.ts, r.user]));
      const csv = arrayToCSV(csvRows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Audit exported', { type: 'success' });
    }

    return (
      <div>
        <Header title="Audit Log" />
        <div className="bg-white p-4 rounded shadow space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">Showing {rows.length} recent entries</div>
            <div>
              <button onClick={exportAudit} className="px-3 py-1 border rounded">Export CSV</button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            {rows.map((r) => (
              <div key={r.id} className="border-b py-2">
                <div className="text-sm font-semibold">{r.action}</div>
                <div className="text-xs text-gray-500">{new Date(r.ts).toLocaleString()} — {r.user}</div>
                <div className="text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(r.details)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function AIScreeningView() {
    if (!auth.hasRole(['hr', 'admin', 'recruiter'])) return <div>Access denied</div>;
    const jobList = (state.jobs || []).filter(j => j.status === 'open');
    const selectedJob = selectedJobForAI ? state.jobs.find(j => j.id === selectedJobForAI) : jobList[0];
    const jobApps = selectedJob
      ? (state.applications || []).filter(a => a.jobId === selectedJob.id)
      : [];

    return (
      <div>
        <Header title="🤖 AI Candidate Screening" />
        <div className="space-y-4">
          {/* Job Selector */}
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

          {/* AI Screening Panel */}
          {selectedJob && (
            <AIScreeningPanel
              candidates={jobApps}
              jobRequirements={{
                education: { required: 'Bachelor' },
                experience: { minYears: 2 },
                skills: { required: [] },
              }}
              onSelectCandidates={(candidateIds) => {
                if (!candidateIds.length) {
                  addToast('Select at least one candidate', { type: 'error' });
                  return;
                }
                const jobId = selectedJob.id;
                createShortlist(jobId, candidateIds);
                setSelectedJobForAI(null);
                addToast(`Shortlist created with ${candidateIds.length} candidates`, { type: 'success' });
              }}
            />
          )}
        </div>
      </div>
    );
  }

  function AnalyticsView() {
    if (!auth.hasRole(['hr', 'admin'])) return <div>Access denied</div>;
    return (
      <div>
        <Header title="📊 Analytics & Reports" />
        <AnalyticsDashboard state={state} />
      </div>
    );
  }

  // Advanced Features View Functions
  const EmailNotificationsView = () => (
    <EmailNotificationsPanel
      applications={state.applications || []}
      onSendEmail={(recipient, template) => addToast(`Email sent to ${recipient} with ${template} template`, { type: 'success' })}
    />
  );
  
  const InterviewSchedulingView = () => (
    <InterviewSchedulingPanel
      applications={state.applications || []}
    />
  );
  
  const PipelineView = () => (
    <KanbanPipelineView
      applications={state.applications || []}
    />
  );
  
  const OfferManagementView = () => (
    <OfferManagementPanel
      applications={state.applications || []}
    />
  );
  
  const AnalyticsReportsView = () => (
    <AnalyticsReportsPanel
      applications={state.applications || []}
    />
  );
  
  const SettingsView = () => <SettingsPanel />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 md:p-6 lg:ml-0 pt-16 lg:pt-6">
        {view === "dashboard" && <DashboardView />}
        {view === "apply" && <ApplyView />}
        {view === "my-apps" && <CandidateView />}
        {view === "admin" && <AdminView />}
        {view === "hr" && <HRView />}
        {view === "ai-screening" && <AIScreeningView />}
        {view === "analytics" && <AnalyticsView />}
        {view === "shortlists" && <ShortlistsView />}
        {view === "audit" && <AuditView />}
        {view === "emails" && <EmailNotificationsView />}
        {view === "scheduling" && <InterviewSchedulingView />}
        {view === "pipeline" && <PipelineView />}
        {view === "offers" && <OfferManagementView />}
        {view === "reports" && <AnalyticsReportsView />}
        {view === "settings" && <SettingsView />}
      </div>

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl transform transition-transform ${drawer.open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b flex justify-between items-center">
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
                    <button onClick={() => setEvaluationModal({ open: true, candidate: drawer.app })} className="w-full px-2 py-1 border rounded text-sm bg-purple-50 hover:bg-purple-100">📋 Evaluation Form</button>
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
      {evaluationModal.open && evaluationModal.candidate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-2xl max-h-96 overflow-auto p-4">
            <InterviewEvaluationForm
              candidate={evaluationModal.candidate}
              onSubmit={submitInterviewEvaluation}
              onCancel={() => setEvaluationModal({ open: false, candidate: null })}
            />
          </div>
        </div>
      )}

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