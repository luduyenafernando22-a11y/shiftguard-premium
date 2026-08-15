import React, { useMemo, useState } from "react";
import { auditShifts, getAuditSummary } from "./arbzg";
import { createEmployee } from "./data/models";
import { useI18n } from "./i18n/I18nContext";
import TopBar from "./components/layout/TopBar";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import AuditReport from "./components/AuditReport";

const DEMO_EMPLOYEES = [
  createEmployee({
    id: "emp-anna",
    employeeId: "EMP-001",
    fullName: "Anna Müller",
    profession: "registeredNurse",
    department: "Emergency",
    contractedHours: 38.5
  }),
  createEmployee({
    id: "emp-jonas",
    employeeId: "EMP-002",
    fullName: "Jonas Weber",
    profession: "physician",
    department: "ICU",
    contractedHours: 40
  }),
  createEmployee({
    id: "emp-sofia",
    employeeId: "EMP-003",
    fullName: "Sofia Klein",
    profession: "registeredNurse",
    department: "Surgery",
    contractedHours: 38.5
  })
];

const DEMO_SHIFTS = [
  {
    id: "demo-1",
    employeeId: "emp-anna",
    employee: "Anna Müller",
    date: "2026-08-13",
    start: "07:00",
    end: "15:30",
    breakMinutes: 30
  },
  {
    id: "demo-2",
    employeeId: "emp-anna",
    employee: "Anna Müller",
    date: "2026-08-14",
    start: "01:00",
    end: "09:00",
    breakMinutes: 30
  },
  {
    id: "demo-3",
    employeeId: "emp-jonas",
    employee: "Jonas Weber",
    date: "2026-08-13",
    start: "06:00",
    end: "16:30",
    breakMinutes: 45
  },
  {
    id: "demo-4",
    employeeId: "emp-sofia",
    employee: "Sofia Klein",
    date: "2026-08-13",
    start: "08:00",
    end: "18:30",
    breakMinutes: 30
  }
];

export default function App() {
  const { t } = useI18n();
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
  const [rawShifts, setRawShifts] = useState(DEMO_SHIFTS);
  const [editingShift, setEditingShift] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");

  const auditedShifts = useMemo(() => auditShifts(rawShifts), [rawShifts]);
  const summary = getAuditSummary(auditedShifts);

  function navigate(view) {
    setActiveView(view);
    if (view === "report") {
      setTimeout(() => document.getElementById("audit-report")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }

  function saveShift(form) {
    if (editingShift) {
      setRawShifts((current) =>
        current.map((shift) => (shift.id === editingShift.id ? { ...form, id: editingShift.id } : shift))
      );
      setEditingShift(null);
    } else {
      setRawShifts((current) => [
        ...current,
        { ...form, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
      ]);
    }
    setShowForm(true);
  }

  function deleteShift(id) {
    setRawShifts((current) => current.filter((shift) => shift.id !== id));
    if (editingShift?.id === id) setEditingShift(null);
  }

  function editShift(shift) {
    setEditingShift({
      id: shift.id,
      employeeId: shift.employeeId,
      date: shift.date,
      start: shift.start,
      end: shift.end,
      breakMinutes: shift.breakMinutes
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function loadDemo() {
    setEmployees(DEMO_EMPLOYEES);
    setRawShifts(DEMO_SHIFTS);
    setEditingShift(null);
    setShowForm(true);
  }

  function clearAll() {
    setRawShifts([]);
    setEditingShift(null);
  }

  function saveEmployee(form) {
    if (form.id) {
      setEmployees((current) => current.map((e) => (e.id === form.id ? { ...e, ...form } : e)));
    } else {
      setEmployees((current) => [...current, createEmployee(form)]);
    }
  }

  function deleteEmployee(id) {
    setEmployees((current) => current.filter((e) => e.id !== id));
  }

  return (
    <div className="app-shell">
      <TopBar activeView={activeView} onNavigate={navigate} />

      <main>
        {activeView === "dashboard" && (
          <DashboardPage
            employees={employees}
            auditedShifts={auditedShifts}
            summary={summary}
            showForm={showForm}
            editingShift={editingShift}
            onSaveShift={saveShift}
            onDeleteShift={deleteShift}
            onEditShift={editShift}
            onCancelEdit={() => setEditingShift(null)}
            onOpenAddShift={() => {
              setEditingShift(null);
              setShowForm(true);
            }}
            onLoadDemo={loadDemo}
            onClearAll={clearAll}
          />
        )}

        {activeView === "employees" && (
          <EmployeesPage
            employees={employees}
            auditedShifts={auditedShifts}
            onSaveEmployee={saveEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        )}

        <AuditReport shifts={auditedShifts} />
      </main>

      <footer className="app-footer no-print">
        <span>{t("app.name")} · {t("hero.badgeSub")}</span>
        <span>{t("footer.tagline")}</span>
      </footer>
    </div>
  );
}
