import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import logo from "./logo.png";
import "./index.css";
import { ToastProvider, useToast } from "./ToastContext";
import { AnalyticsDashboard, AIScreeningPanel, InterviewEvaluationForm } from "./AnalyticsDashboard";
import {
  EmailNotificationsPanel,
  InterviewSchedulingPanel,
  KanbanPipelineView,
  OfferManagementPanel,
  AnalyticsReportsPanel,
  SettingsPanel,
} from "./AdvancedFeaturesUI";

// ---------- Simple Auth (demo RBAC) ----------
const AuthCtx = createContext();
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pvara_user")) || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem("pvara_user", JSON.stringify(user));
      else localStorage.removeItem("pvara_user");
    } catch (e) {}
  }, [user]);

  function login({ username, password }) {
    if (!username || !password) return { ok: false, message: "invalid" };
    const role =
      username === "admin" ? "admin" : username === "hr" ? "hr" : username === "recruit" ? "recruiter" : "viewer";
    const payload = { username, role, name: username };
    setUser(payload);
    return { ok: true, user: payload };
  }

  function logout() {
    setUser(null);
    try {
      localStorage.removeItem("pvara_user");
    } catch (e) {}
  }

  function hasRole(roles) {
    if (!user) return false;
    if (typeof roles === "string") roles = [roles];
    return roles.includes(user.role);
  }

  return <AuthCtx.Provider value={{ user, login, logout, hasRole }}>{children}</AuthCtx.Provider>;
}
function useAuth() {
  return useContext(AuthCtx);
}

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
function PvaraPhase2() {
  const persisted = loadState();
  const [state, setState] = useState(persisted || defaultState());
  useEffect(() => saveState(state), [state]);

  const auth = useAuth();
  const user = auth?.user ?? null;
  const { addToast } = useToast();

  const [view, setView] = useState("dashboard");
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    grade: "",
    description: "",
    locations: [],
    openings: 1,
    employmentType: "Full-time",
    salary: { min: 0, max: 0 },
    fields: {},
  });
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


  function audit(action, details) {
    // CORRECTED: use a template literal so JS parses it
    const rec = { id: `au-${Date.now()}`, action, details, ts: new Date().toISOString(), user: user?.username || "anon" };
    setState((s) => ({ ...s, audit: [rec, ...(s.audit || [])] }));
  }

  function createJob(e) {
    e?.preventDefault();
    if (editingJobId) {
      const updated = { ...jobForm, id: editingJobId };
      setState((s) => ({ ...s, jobs: s.jobs.map((j) => (j.id === editingJobId ? updated : j)) }));
      audit("update-job", { jobId: editingJobId, title: updated.title });
      addToast("Job updated", { type: "success" });
      setEditingJobId(null);
      setJobForm({ title: "", department: "", grade: "", description: "", locations: [], openings: 1, employmentType: "Full-time", salary: { min: 0, max: 0 }, fields: {} });
      return;
    }

    const j = { ...jobForm, id: `job-${Date.now()}`, createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, jobs: [j, ...(s.jobs || [])] }));
    audit("create-job", { jobId: j.id, title: j.title });
    setJobForm({ title: "", department: "", grade: "", description: "", locations: [], openings: 1, employmentType: "Full-time", salary: { min: 0, max: 0 }, fields: {} });
    addToast("Job created (local)", { type: "success" });
  }

  function deleteJob(jobId) {
    setState((s) => ({ ...s, jobs: (s.jobs || []).filter((j) => j.id !== jobId) }));
    audit("delete-job", { jobId });
    addToast("Job deleted", { type: "info" });
  }

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
  }

  // Simple job form validator (inline validations)
  function validateJobForm(form) {
    const errs = [];
    if (!form.title || !form.title.trim()) errs.push("Title required");
    if (!form.department || !form.department.trim()) errs.push("Department required");
    if (form.openings && Number(form.openings) <= 0) errs.push("Openings must be > 0");
    if (form.salary && Number(form.salary.min) > Number(form.salary.max)) errs.push("Salary min must be <= max");
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
            <form onSubmit={submitApplication} className="space-y-3">
              <select value={appForm.jobId} onChange={(e) => handleAppFormChange('jobId', e.target.value)} className="border p-2 rounded w-full text-sm md:text-base">
                {(state.jobs || []).map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.department}
                  </option>
                ))}
              </select>

              <input className="border p-2 rounded w-full text-sm md:text-base" placeholder="Full name" value={appForm.name} onChange={(e) => handleAppFormChange('name', e.target.value)} required />
              <input className="border p-2 rounded w-full text-sm md:text-base" placeholder="Email" type="email" value={appForm.email} onChange={(e) => handleAppFormChange('email', e.target.value)} required />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={appForm.cnic} onChange={(e) => handleAppFormChange('cnic', e.target.value)} placeholder="CNIC" className="border p-2 rounded w-full" />
                <input value={appForm.phone} onChange={(e) => handleAppFormChange('phone', e.target.value)} placeholder="Phone" className="border p-2 rounded w-full" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input value={appForm.degree} onChange={(e) => handleAppFormChange('degree', e.target.value)} placeholder="Degree" className="border p-2 rounded w-full" />
                <input value={appForm.experienceYears} onChange={(e) => handleAppFormChange('experienceYears', e.target.value)} placeholder="Years" type="number" className="border p-2 rounded w-full" />
              </div>

              <input value={appForm.linkedin} onChange={(e) => handleAppFormChange('linkedin', e.target.value)} placeholder="LinkedIn profile (optional)" className="border p-2 rounded w-full" />
              <textarea value={appForm.address} onChange={(e) => handleAppFormChange('address', e.target.value)} placeholder="Address" className="border p-2 rounded w-full" />

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
                    setAppForm({ jobId: state.jobs[0]?.id || "", name: "", email: "", cnic: "", phone: "", degree: "", experienceYears: "", address: "", linkedin: "" });
                    if (fileRef.current) fileRef.current.value = null;
                  }}
                  className="px-3 py-2 border rounded"
                >
                  Reset
                </button>
              </div>
            </form>
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

  function AdminView() {
    if (!user || user.role !== "admin") return <div>Access denied</div>;
    const jobErrs = validateJobForm(jobForm);
    return (
      <div>
        <Header title="Admin - Create Job" />
        <div className="bg-white p-4 rounded shadow">
          <form onSubmit={createJob} className="space-y-2">
            {jobErrs.length > 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {jobErrs.map((e, i) => <div key={i}>• {e}</div>)}
              </div>
            )}
            <input value={jobForm.title} onChange={(e) => handleJobFormChange('title', e.target.value)} placeholder="Title" className="border p-2 rounded w-full" />
            <input value={jobForm.department} onChange={(e) => handleJobFormChange('department', e.target.value)} placeholder="Department" className="border p-2 rounded w-full" />
            <textarea value={jobForm.description} onChange={(e) => handleJobFormChange('description', e.target.value)} placeholder="Description" className="border p-2 rounded w-full" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={jobForm.openings} onChange={(e) => handleJobFormChange('openings', parseInt(e.target.value) || 1)} placeholder="Openings" className="border p-2 rounded w-full" />
              <input value={jobForm.employmentType} onChange={(e) => handleJobFormChange('employmentType', e.target.value)} placeholder="Employment Type" className="border p-2 rounded w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={jobForm.salary.min} onChange={(e) => handleSalaryChange('min', parseInt(e.target.value) || 0)} placeholder="Salary Min" className="border p-2 rounded w-full" />
              <input type="number" value={jobForm.salary.max} onChange={(e) => handleSalaryChange('max', parseInt(e.target.value) || 0)} placeholder="Salary Max" className="border p-2 rounded w-full" />
            </div>
            <div className="flex gap-2">
                <button className="px-3 py-2 bg-green-700 text-white rounded disabled:opacity-50" disabled={jobErrs.length > 0}>{editingJobId ? 'Update Job' : 'Create Job'}</button>
                <button
                  type="button"
                  onClick={() =>
                    setJobForm({
                      title: "",
                      department: "",
                      grade: "",
                      description: "",
                      locations: [],
                      openings: 1,
                      employmentType: "Full-time",
                      salary: { min: 0, max: 0 },
                      fields: {},
                    })
                  }
                  className="px-3 py-2 border rounded"
                >
                  Reset
                </button>
                {editingJobId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJobId(null);
                      setJobForm({ title: "", department: "", grade: "", description: "", locations: [], openings: 1, employmentType: "Full-time", salary: { min: 0, max: 0 }, fields: {} });
                    }}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    Cancel Edit
                  </button>
                )}
            </div>
          </form>

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
                        setJobForm({ ...j });
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
    const apps = (state.applications || []).filter((a) => (a.applicant.name || "").toLowerCase().includes(hrSearch.toLowerCase()) || (a.applicant.email || "").toLowerCase().includes(hrSearch.toLowerCase()));
    return (
      <div>
        <Header title="HR Review" />
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="p-3 border rounded bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{a.applicant.name}</div>
                  <div className="text-xs text-gray-500">{a.applicant.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openDrawer(a)} className="px-2 py-1 border rounded">
                    View
                  </button>
                  <button
                    onClick={() => {
                      toggleSelectApp(a.id);
                    }}
                    className="px-2 py-1 border rounded"
                  >
                    {selectedApps.includes(a.id) ? "Unselect" : "Select"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                if (!selectedApps.length) return addToast("Select applicants first", { type: 'error' });
                const jobId = state.applications.find((x) => x.id === selectedApps[0])?.jobId;
                createShortlist(jobId, selectedApps);
                setSelectedApps([]);
                addToast("Shortlist created", { type: 'success' });
              }}
              className="px-3 py-2 bg-green-700 text-white rounded"
            >
              Create Shortlist from Selected
            </button>
            <button
              onClick={() => {
                setSelectedApps([]);
              }}
              className="px-3 py-2 border rounded"
            >
              Clear Selection
            </button>
          </div>
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

// Wrap with AuthProvider for standalone mounting
export default function PvaraPhase2Wrapper() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PvaraPhase2 />
      </AuthProvider>
    </ToastProvider>
  );
}