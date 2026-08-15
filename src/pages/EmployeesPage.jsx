import React, { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { computeAllEmployeeMetrics, computeOrgSummary } from "../data/employeeMetrics";
import EmployeeTable from "../components/employees/EmployeeTable";
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeProfile from "../components/employees/EmployeeProfile";
import StatCard from "../components/StatCard";
import { Users, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export default function EmployeesPage({ employees = [], auditedShifts = [], onSaveEmployee, onDeleteEmployee, readOnly = false }) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [profileId, setProfileId] = useState(null);

  const metricsList = computeAllEmployeeMetrics(employees, auditedShifts);
  const summary = computeOrgSummary(metricsList);
  const profileMetrics = metricsList.find((m) => m.employee.id === profileId) || null;

  function openAdd() {
    if (readOnly) return;
    setEditingEmployee(null);
    setFormOpen(true);
  }

  function openEdit(employee) {
    if (readOnly) return;
    setEditingEmployee(employee);
    setFormOpen(true);
    setProfileId(null);
  }

  function handleSave(form) {
    onSaveEmployee(editingEmployee ? { ...form, id: editingEmployee.id } : form);
    setFormOpen(false);
    setEditingEmployee(null);
  }

  function handleDelete(id) {
    if (readOnly) return;
    onDeleteEmployee(id);
    setProfileId(null);
  }

  return (
    <div className="employees-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("nav.employees")}</span>
          <h1>{t("employeesPage.title")}</h1>
          <p>{t("employeesPage.subtitle")}</p>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label={`${t("employees.total")} (${t("employees.totalSuffix")})`} value={summary.total} tone="default" icon={<Users size={20} />} />
        <StatCard label={t("employees.compliant")} value={summary.compliant} tone="ok" icon={<CheckCircle2 size={20} />} />
        <StatCard label={t("employees.warning")} value={summary.warning} tone="warning" icon={<AlertTriangle size={20} />} />
        <StatCard label={t("employees.violation")} value={summary.violation} tone="danger" icon={<AlertCircle size={20} />} />
      </section>

      <EmployeeTable metricsList={metricsList} onOpenProfile={setProfileId} onAddEmployee={readOnly ? undefined : openAdd} />

      {formOpen && (
        <EmployeeForm
          initialValue={editingEmployee}
          onSave={handleSave}
          onCancel={() => {
            setFormOpen(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {profileMetrics && (
        <EmployeeProfile
          metrics={profileMetrics}
          onClose={() => setProfileId(null)}
          onEdit={readOnly ? undefined : openEdit}
          onDelete={readOnly ? undefined : handleDelete}
        />
      )}
    </div>
  );
}
