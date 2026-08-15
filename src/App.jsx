import React, { useEffect, useMemo, useState } from "react";
import { auditShifts, getAuditSummary } from "./arbzg";
import { createEmployee } from "./data/models";
import { useI18n } from "./i18n/I18nContext";
import { useAuth } from "./auth/AuthContext";
import AuthScreen from "./auth/AuthScreen";
import TopBar from "./components/layout/TopBar";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import AuditReport from "./components/AuditReport";
import { isSupabaseConfigured } from "./lib/supabase";
import {
  fetchOrganizationData,
  insertEmployee,
  insertShift,
  removeEmployee,
  removeShift,
  updateEmployee,
  updateShift
} from "./lib/dataService";

const DEMO_EMPLOYEES = [
  createEmployee({ id: "emp-anna", employeeId: "EMP-001", fullName: "Anna Müller", profession: "registeredNurse", department: "Emergency", contractedHours: 38.5 }),
  createEmployee({ id: "emp-jonas", employeeId: "EMP-002", fullName: "Jonas Weber", profession: "physician", department: "ICU", contractedHours: 40 }),
  createEmployee({ id: "emp-sofia", employeeId: "EMP-003", fullName: "Sofia Klein", profession: "registeredNurse", department: "Surgery", contractedHours: 38.5 })
];

const DEMO_SHIFTS = [
  { id: "demo-1", employeeId: "emp-anna", employee: "Anna Müller", date: "2026-08-13", start: "07:00", end: "15:30", breakMinutes: 30 },
  { id: "demo-2", employeeId: "emp-anna", employee: "Anna Müller", date: "2026-08-14", start: "01:00", end: "09:00", breakMinutes: 30 },
  { id: "demo-3", employeeId: "emp-jonas", employee: "Jonas Weber", date: "2026-08-13", start: "06:00", end: "16:30", breakMinutes: 45 },
  { id: "demo-4", employeeId: "emp-sofia", employee: "Sofia Klein", date: "2026-08-13", start: "08:00", end: "18:30", breakMinutes: 30 }
];

export default function App() {
  const { t } = useI18n();
  const { user, profile, role, loading: authLoading, signOut } = useAuth();
  const [employees, setEmployees] = useState(isSupabaseConfigured ? [] : DEMO_EMPLOYEES);
  const [rawShifts, setRawShifts] = useState(isSupabaseConfigured ? [] : DEMO_SHIFTS);
  const [editingShift, setEditingShift] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [dataLoading, setDataLoading] = useState(isSupabaseConfigured);
  const [dataError, setDataError] = useState("");

  const canManage = !isSupabaseConfigured || role === "admin" || role === "manager";
  const canManageEmployees = !isSupabaseConfigured || role === "admin" || role === "manager";
  const readOnly = isSupabaseConfigured && !canManage;

  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.organization_id) return undefined;
    let mounted = true;
    setDataLoading(true);
    fetchOrganizationData(profile.organization_id)
      .then(({ employees: nextEmployees, shifts: nextShifts }) => {
        if (!mounted) return;
        setEmployees(nextEmployees);
        setRawShifts(nextShifts);
        setDataError("");
      })
      .catch((error) => mounted && setDataError(error.message || t("data.loadError")))
      .finally(() => mounted && setDataLoading(false));
    return () => { mounted = false; };
  }, [profile?.organization_id, t]);

  const auditedShifts = useMemo(() => auditShifts(rawShifts), [rawShifts]);
  const summary = getAuditSummary(auditedShifts);

  if (isSupabaseConfigured && authLoading) return <main className="auth-shell"><div className="auth-card"><p>{t("auth.working")}</p></div></main>;
  if (isSupabaseConfigured && !user) return <AuthScreen />;
  if (isSupabaseConfigured && dataLoading) return <main className="auth-shell"><div className="auth-card"><p>{t("data.loading")}</p></div></main>;

  function navigate(view) {
    setActiveView(view);
    if (view === "report") setTimeout(() => document.getElementById("audit-report")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  async function saveShift(form) {
    if (!canManage) return;
    try {
      if (isSupabaseConfigured) {
        const saved = editingShift
          ? await updateShift({ ...form, id: editingShift.id }, profile.organization_id)
          : await insertShift(form, profile.organization_id, user.id);
        setRawShifts((current) => editingShift ? current.map((shift) => shift.id === saved.id ? saved : shift) : [...current, saved]);
      } else if (editingShift) {
        setRawShifts((current) => current.map((shift) => shift.id === editingShift.id ? { ...form, id: editingShift.id } : shift));
      } else {
        setRawShifts((current) => [...current, { ...form, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
      }
      setEditingShift(null);
      setDataError("");
    } catch (error) {
      setDataError(error.message || t("data.saveError"));
    }
    setShowForm(true);
  }

  async function deleteShift(id) {
    if (!canManage) return;
    try {
      if (isSupabaseConfigured) await removeShift(id, profile.organization_id);
      setRawShifts((current) => current.filter((shift) => shift.id !== id));
      if (editingShift?.id === id) setEditingShift(null);
    } catch (error) { setDataError(error.message || t("data.deleteError")); }
  }

  function editShift(shift) {
    if (!canManage) return;
    setEditingShift({ id: shift.id, employeeId: shift.employeeId, date: shift.date, start: shift.start, end: shift.end, breakMinutes: shift.breakMinutes });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadDemo() {
    if (isSupabaseConfigured) return;
    setEmployees(DEMO_EMPLOYEES);
    setRawShifts(DEMO_SHIFTS);
    setEditingShift(null);
    setShowForm(true);
  }

  function clearAll() {
    if (isSupabaseConfigured) return;
    setRawShifts([]);
    setEditingShift(null);
  }

  async function saveEmployee(form) {
    if (!canManageEmployees) return;
    try {
      if (isSupabaseConfigured) {
        const saved = form.id ? await updateEmployee(form, profile.organization_id) : await insertEmployee(form, profile.organization_id);
        setEmployees((current) => form.id ? current.map((employee) => employee.id === saved.id ? saved : employee) : [...current, saved]);
      } else if (form.id) {
        setEmployees((current) => current.map((employee) => employee.id === form.id ? { ...employee, ...form } : employee));
      } else {
        setEmployees((current) => [...current, createEmployee(form)]);
      }
      setDataError("");
    } catch (error) { setDataError(error.message || t("data.saveError")); }
  }

  async function deleteEmployee(id) {
    if (!canManageEmployees) return;
    try {
      if (isSupabaseConfigured) await removeEmployee(id, profile.organization_id);
      setEmployees((current) => current.filter((employee) => employee.id !== id));
    } catch (error) { setDataError(error.message || t("data.deleteError")); }
  }

  return (
    <div className="app-shell">
      <TopBar activeView={activeView} onNavigate={navigate} />
      <main>
        {dataError && <div className="global-error" role="alert">{dataError}</div>}
        {activeView === "dashboard" && <DashboardPage employees={employees} auditedShifts={auditedShifts} summary={summary} showForm={showForm && canManage} editingShift={editingShift} onSaveShift={saveShift} onDeleteShift={deleteShift} onEditShift={editShift} onCancelEdit={() => setEditingShift(null)} onOpenAddShift={() => { setEditingShift(null); setShowForm(true); }} onLoadDemo={loadDemo} onClearAll={clearAll} readOnly={readOnly} />}
        {activeView === "employees" && <EmployeesPage employees={employees} auditedShifts={auditedShifts} onSaveEmployee={saveEmployee} onDeleteEmployee={deleteEmployee} readOnly={readOnly} />}
        <AuditReport shifts={auditedShifts} />
      </main>
      <footer className="app-footer no-print">
        <span>{t("app.name")} · {t("hero.badgeSub")}</span>
        <span>{profile?.organizations?.name || t("footer.tagline")}</span>
        {isSupabaseConfigured && <button className="link-button" onClick={signOut}>{t("auth.logout")}</button>}
      </footer>
    </div>
  );
}
