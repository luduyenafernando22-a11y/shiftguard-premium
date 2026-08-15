import React, { useState } from "react";
import { X, Pencil, Trash2, AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { professionLabel } from "../../data/professions";
import { localizeAlert } from "../../i18n/alertMessages";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";

const TABS = ["profile", "schedule", "hours", "compliance", "audit"];

export default function EmployeeProfile({ metrics, onClose, onEdit, onDelete }) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState("profile");
  const { employee, shifts, weeklyHours, complianceStatus, warnings, violations, discrepancies } = metrics;

  const allAlerts = shifts.flatMap((s) =>
    s.alerts.map((a) => ({ ...a, ...localizeAlert(a, lang, s), date: s.date, severity: s.severity }))
  );

  function confirmDelete() {
    if (window.confirm(t("profile.confirmDelete"))) onDelete(employee.id);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel profile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <div className="profile-identity">
            <Avatar employee={employee} size={56} />
            <div>
              <h2>{employee.fullName}</h2>
              <p>{professionLabel(employee, lang)} · {employee.department || "—"}</p>
            </div>
          </div>
          <div className="profile-header-actions">
            <Badge status={complianceStatus} />
            <button className="icon-btn" onClick={() => onEdit(employee)} title={t("profile.edit")}>
              <Pencil size={16} />
            </button>
            <button className="icon-btn danger" onClick={confirmDelete} title={t("profile.delete")}>
              <Trash2 size={16} />
            </button>
            <button className="icon-btn" onClick={onClose} title={t("profile.close")}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          {TABS.map((id) => (
            <button
              key={id}
              className={tab === id ? "profile-tab active" : "profile-tab"}
              onClick={() => setTab(id)}
            >
              {t(`profile.tabs.${id}`)}
            </button>
          ))}
        </div>

        <div className="profile-body">
          {tab === "profile" && (
            <div className="profile-grid">
              <div>
                <span className="field-label">{t("profile.employeeId")}</span>
                <strong>{employee.employeeId}</strong>
              </div>
              <div>
                <span className="field-label">{t("profile.department")}</span>
                <strong>{employee.department || "—"}</strong>
              </div>
              <div>
                <span className="field-label">{t("profile.contractedHours")}</span>
                <strong>{employee.contractedHours}h</strong>
              </div>
              <div>
                <span className="field-label">{t("profile.weeklyHours")}</span>
                <strong>{weeklyHours}h</strong>
              </div>
              <div>
                <span className="field-label">{t("profile.status")}</span>
                <strong>{t(`employeesPage.${employee.status}`)}</strong>
              </div>
              <div>
                <span className="field-label">{t("employeesPage.col.status")}</span>
                <Badge status={complianceStatus} />
              </div>
            </div>
          )}

          {tab === "schedule" && (
            <ScheduleTab shifts={shifts} t={t} />
          )}

          {tab === "hours" && (
            <HoursTab shifts={shifts} weeklyHours={weeklyHours} contractedHours={employee.contractedHours} t={t} />
          )}

          {tab === "compliance" && (
            <ComplianceTab
              warnings={warnings}
              violations={violations}
              discrepancies={discrepancies}
              total={shifts.length}
              t={t}
            />
          )}

          {tab === "audit" && (
            <AuditTab alerts={allAlerts} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ shifts, t }) {
  if (!shifts.length) return <p className="muted-note">{t("profile.noShifts")}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("table.date")}</th>
            <th>{t("table.time")}</th>
            <th>{t("table.gross")}</th>
            <th>{t("table.break")}</th>
            <th>{t("table.rest")}</th>
            <th>{t("table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id}>
              <td>{s.date}</td>
              <td>{s.start} → {s.end}</td>
              <td>{s.grossHours}h</td>
              <td>{s.breakMinutes}m / {s.requiredBreak}m</td>
              <td>{s.restHours === undefined ? "—" : `${s.restHours}h`}</td>
              <td><span className={`badge badge-${s.severity}`}>{s.severity}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HoursTab({ shifts, weeklyHours, contractedHours, t }) {
  const totalNet = shifts.reduce((sum, s) => sum + s.netHours, 0);
  const pct = contractedHours > 0 ? Math.min(150, Math.round((weeklyHours / contractedHours) * 100)) : 0;

  return (
    <div className="hours-tab">
      <div className="audit-summary">
        <div>
          <strong>{weeklyHours}h</strong>
          <span>{t("profile.weeklyHours")}</span>
        </div>
        <div>
          <strong>{contractedHours}h</strong>
          <span>{t("profile.contractedHours")}</span>
        </div>
        <div>
          <strong>{Math.round(totalNet * 100) / 100}h</strong>
          <span>{t("stats.totalShifts")}</span>
        </div>
      </div>
      <div className="hours-bar-track">
        <div
          className={`hours-bar-fill ${pct > 100 ? "over" : ""}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="muted-note">{pct}% {t("profile.contractedHours").toLowerCase()}</p>
    </div>
  );
}

function ComplianceTab({ warnings, violations, discrepancies, total, t }) {
  return (
    <div className="audit-summary">
      <div>
        <strong>{total}</strong>
        <span>{t("stats.totalShifts")}</span>
      </div>
      <div className="warning-text">
        <strong>{warnings}</strong>
        <span>{t("employees.warning")}</span>
      </div>
      <div className="danger-text">
        <strong>{violations}</strong>
        <span>{t("employees.violation")}</span>
      </div>
      <div>
        <strong>{discrepancies}</strong>
        <span>{t("report.discrepancyAlerts")}</span>
      </div>
    </div>
  );
}

function AuditTab({ alerts, t }) {
  if (!alerts.length) {
    return (
      <div className="alerts-panel clean">
        <CheckCircle2 size={22} />
        <div>
          <strong>{t("alerts.none.title")}</strong>
          <p>{t("profile.noAlerts")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      {alerts.map((a, i) => (
        <div className={`alert-row alert-${a.code.toLowerCase()}`} key={`${a.code}-${i}`}>
          {a.code === "REST" ? <Clock3 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>{a.title}</strong>
            <p>{a.date} · {a.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
