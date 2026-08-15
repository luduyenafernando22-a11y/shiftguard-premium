import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";

function formatDate(date, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function SeverityBadge({ severity, t }) {
  const labels = {
    ok: t("stats.ok"),
    warning: t("stats.alerts"),
    violation: t("employees.violation")
  };
  return <span className={`badge badge-${severity}`}>{labels[severity]}</span>;
}

export default function ShiftTable({ shifts = [], onEdit, onDelete }) {
  const { t, lang } = useI18n();
  const locale = lang === "de" ? "de-DE" : "en-GB";
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("table.employee")}</th>
            <th>{t("table.date")}</th>
            <th>{t("table.time")}</th>
            <th>{t("table.gross")}</th>
            <th>{t("table.break")}</th>
            <th>{t("table.rest")}</th>
            <th>{t("table.status")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shifts.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-cell">
                {t("table.empty")}
              </td>
            </tr>
          ) : (
            shifts.map((shift) => (
              <tr key={shift.id}>
                <td className="employee-cell">{shift.employee}</td>
                <td>{formatDate(shift.date, locale)}</td>
                <td>{shift.start} → {shift.end}</td>
                <td>{shift.grossHours}h</td>
                <td>{shift.breakMinutes}m / {shift.requiredBreak}m</td>
                <td>
                  {shift.restHours === undefined ? "—" : `${shift.restHours}h`}
                </td>
                <td><SeverityBadge severity={shift.severity} t={t} /></td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => onEdit(shift)} title={t("profile.edit")}>
                      <Pencil size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => onDelete(shift.id)} title={t("profile.delete")}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
