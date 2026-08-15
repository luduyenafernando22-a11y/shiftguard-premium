import React from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  ShieldCheck,
  Users
} from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { computeAllEmployeeMetrics, computeOrgSummary } from "../data/employeeMetrics";
import ShiftForm from "../components/ShiftForm";
import ShiftTable from "../components/ShiftTable";
import StatCard from "../components/StatCard";
import AlertsPanel from "../components/AlertsPanel";

export default function DashboardPage({
  employees = [],
  auditedShifts = [],
  summary = { total: 0, ok: 0, warnings: 0, violations: 0 },
  showForm,
  editingShift,
  onSaveShift,
  onDeleteShift,
  onEditShift,
  onCancelEdit,
  onOpenAddShift,
  onLoadDemo,
  onClearAll
}) {
  const { t } = useI18n();
  const employeeMetrics = computeAllEmployeeMetrics(employees, auditedShifts);
  const orgSummary = computeOrgSummary(employeeMetrics);

  return (
    <>
      <section className="hero no-print">
        <div>
          <span className="eyebrow">{t("hero.eyebrow")}</span>
          <h1>{t("hero.title")}</h1>
          <p>{t("hero.body")}</p>
        </div>
        <div className="hero-badge">
          <ClipboardCheck size={22} />
          <div><strong>{t("hero.badgeTitle")}</strong><span>{t("hero.badgeSub")}</span></div>
        </div>
      </section>

      <section className="stats-grid no-print">
        <StatCard label={t("stats.totalShifts")} value={summary.total} tone="default" icon={<CalendarDays size={20} />} />
        <StatCard label={t("stats.ok")} value={summary.ok} tone="ok" icon={<CheckCircle2 size={20} />} />
        <StatCard label={t("stats.alerts")} value={summary.warnings} tone="warning" icon={<Activity size={20} />} />
        <StatCard label={t("stats.violations")} value={summary.violations} tone="danger" icon={<AlertCircle size={20} />} />
      </section>

      <section className="stats-grid no-print">
        <StatCard label={`${t("employees.total")} (${t("employees.totalSuffix")})`} value={orgSummary.total} tone="default" icon={<Users size={20} />} />
        <StatCard label={t("employees.compliant")} value={orgSummary.compliant} tone="ok" icon={<CheckCircle2 size={20} />} />
        <StatCard label={t("employees.warning")} value={orgSummary.warning} tone="warning" icon={<Activity size={20} />} />
        <StatCard label={t("employees.violation")} value={orgSummary.violation} tone="danger" icon={<AlertCircle size={20} />} />
      </section>

      <section className="workspace no-print">
        <div className="workspace-main">
          {showForm && (
            <ShiftForm
              initialValue={editingShift}
              employees={employees}
              onSave={onSaveShift}
              onCancel={onCancelEdit}
            />
          )}

          <div className="section-heading table-heading">
            <div>
              <span className="eyebrow">{t("schedule.eyebrow")}</span>
              <h2>{t("schedule.heading")}</h2>
            </div>
            <button className="btn btn-primary" onClick={onOpenAddShift}>
              <Plus size={17} /> {t("schedule.addShift")}
            </button>
          </div>

          <ShiftTable shifts={auditedShifts} onEdit={onEditShift} onDelete={onDeleteShift} />
        </div>

        <aside className="sidebar">
          <div className="side-card">
            <div className="side-title"><AlertCircle size={18} /> {t("alerts.title")}</div>
            <AlertsPanel shifts={auditedShifts} />
          </div>

          <div className="side-card rules-card">
            <div className="side-title"><ShieldCheck size={18} /> {t("rules.title")}</div>
            <ul>
              <li><strong>8h</strong><span>{t("rules.standard")}</span></li>
              <li><strong>10h</strong><span>{t("rules.max")}</span></li>
              <li><strong>30m</strong><span>{t("rules.break1")}</span></li>
              <li><strong>45m</strong><span>{t("rules.break2")}</span></li>
              <li><strong>11h</strong><span>{t("rules.rest")}</span></li>
            </ul>
          </div>

          <div className="side-card no-print">
            <div className="side-title"><Users size={18} /> {t("controls.title")}</div>
            <p className="side-copy">{t("controls.body")}</p>
            <div className="side-buttons">
              <button className="btn btn-secondary full" onClick={onLoadDemo}>{t("controls.loadDemo")}</button>
              <button className="btn btn-ghost full" onClick={onClearAll}>{t("controls.clear")}</button>
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
