import React from "react";
import { Printer, FileText } from "lucide-react";
import { getAuditSummary } from "../arbzg";
import { useI18n } from "../i18n/I18nContext";
import { localizeAlert } from "../i18n/alertMessages";

function formatDate(date, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export default function AuditReport({ shifts = [] }) {
  const { t, lang } = useI18n();
  const summary = getAuditSummary(shifts);
  const locale = lang === "de" ? "de-DE" : "en-GB";

  function printReport() {
    window.print();
  }

  function exportHtml() {
    const rows = shifts.map((s) => {
      const alertTitles = s.alerts
        .map((a) => localizeAlert(a, lang, s).title)
        .join("; ") || t("report.noDiscrepancy");
      return `
      <tr>
        <td>${escapeHtml(s.employee)}</td>
        <td>${escapeHtml(formatDate(s.date, locale))}</td>
        <td>${escapeHtml(s.start)}–${escapeHtml(s.end)}</td>
        <td>${s.grossHours}h</td>
        <td>${s.breakMinutes}m / ${s.requiredBreak}m</td>
        <td>${s.restHours === undefined ? "—" : `${s.restHours}h`}</td>
        <td>${escapeHtml(s.severity)}</td>
        <td>${escapeHtml(alertTitles)}</td>
      </tr>
    `;
    }).join("");

    const html = `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(t("report.title"))}</title>
<style>
body{font-family:Arial,sans-serif;padding:32px;color:#172033}
h1{margin-bottom:4px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:24px}
th,td{border:1px solid #dbe2ea;padding:9px;text-align:left;font-size:12px}
th{background:#f1f5f9}footer{margin-top:30px;font-size:11px;color:#64748b}
</style></head><body>
<h1>${escapeHtml(t("report.title"))}</h1>
<div class="muted">${escapeHtml(t("report.standard"))} · ${escapeHtml(t("report.generated"))} ${new Date().toLocaleString(locale)}</div>
<p>${escapeHtml(t("report.total"))}: ${summary.total} · ${escapeHtml(t("stats.ok"))}: ${summary.ok} · ${escapeHtml(t("stats.alerts"))}: ${summary.warnings} · ${escapeHtml(t("stats.violations"))}: ${summary.violations}</p>
<table><thead><tr><th>${escapeHtml(t("table.employee"))}</th><th>${escapeHtml(t("table.date"))}</th><th>${escapeHtml(t("table.time"))}</th><th>${escapeHtml(t("table.gross"))}</th><th>${escapeHtml(t("table.break"))}</th><th>${escapeHtml(t("table.rest"))}</th><th>${escapeHtml(t("table.status"))}</th><th>${escapeHtml(t("report.discrepancyAlerts"))}</th></tr></thead>
<tbody>${rows}</tbody></table>
<footer>${escapeHtml(t("report.legal"))}</footer>
</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `internal-audit-report-${new Date().toISOString().slice(0, 10)}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="report-section" id="audit-report">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("report.eyebrow")}</span>
          <h2>{t("report.title")}</h2>
          <p>{t("report.subtitle")}</p>
        </div>
        <div className="report-actions no-print">
          <button className="btn btn-secondary" onClick={exportHtml}>
            <FileText size={17} /> {t("report.exportHtml")}
          </button>
          <button className="btn btn-primary" onClick={printReport}>
            <Printer size={17} /> {t("report.print")}
          </button>
        </div>
      </div>

      <div className="report-meta">
        <span>{t("report.generated")}: {new Date().toLocaleString(locale)}</span>
        <span>{t("report.standard")}</span>
      </div>

      <div className="audit-summary">
        <div><strong>{summary.total}</strong><span>{t("report.total")}</span></div>
        <div className="ok-text"><strong>{summary.ok}</strong><span>{t("stats.ok")}</span></div>
        <div className="warning-text"><strong>{summary.warnings}</strong><span>{t("stats.alerts")}</span></div>
        <div className="danger-text"><strong>{summary.violations}</strong><span>{t("stats.violations")}</span></div>
      </div>

      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>{t("table.employee")}</th>
              <th>{t("table.time")}</th>
              <th>{t("table.gross")}</th>
              <th>{t("table.break")}</th>
              <th>{t("table.rest")}</th>
              <th>{t("table.status")}</th>
              <th>{t("report.discrepancyAlerts")}</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id}>
                <td><strong>{shift.employee}</strong><small>{formatDate(shift.date, locale)}</small></td>
                <td>{shift.start}–{shift.end}</td>
                <td>{shift.grossHours}h</td>
                <td>{shift.breakMinutes}m / {shift.requiredBreak}m</td>
                <td>{shift.restHours === undefined ? "—" : `${shift.restHours}h`}</td>
                <td><span className={`badge badge-${shift.severity}`}>{shift.severity === "warning" ? t("stats.alerts") : shift.severity}</span></td>
                <td>
                  {shift.alerts.length ? (
                    <ul className="alert-cells">
                      {shift.alerts.map((a, i) => (
                        <li key={i}>{localizeAlert(a, lang, shift).title}</li>
                      ))}
                    </ul>
                  ) : t("report.noDiscrepancy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="legal-footer">
        {t("report.legal")}
      </footer>
    </section>
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
