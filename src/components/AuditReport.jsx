import React from "react";
import { Printer, FileText } from "lucide-react";
import { getAuditSummary } from "../arbzg";
import { useState } from "react";
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
  const [isExporting, setIsExporting] = useState(false);

  async function exportPdf() {
    setIsExporting(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable")
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const today = new Date().toISOString().slice(0, 10);
      const statusLabel = (severity) => {
        if (severity === "warning") return t("stats.alerts");
        if (severity === "ok") return t("stats.ok");
        return t("stats.violations");
      };

      doc.setProperties({
        title: t("report.title"),
        subject: t("report.standard"),
        author: "ShiftGuard"
      });
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(19);
      doc.setFont("helvetica", "bold");
      doc.text("ShiftGuard", margin, 14);
      doc.setFontSize(13);
      doc.text(t("report.title"), margin, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`${t("report.standard")} · ${t("report.generated")}: ${new Date().toLocaleString(locale)}`, pageWidth - margin, 18, { align: "right" });

      doc.setTextColor(23, 32, 51);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${t("report.total")}: ${summary.total}`, margin, 42);
      doc.setTextColor(22, 101, 52);
      doc.text(`${t("stats.ok")}: ${summary.ok}`, margin + 43, 42);
      doc.setTextColor(180, 83, 9);
      doc.text(`${t("stats.alerts")}: ${summary.warnings}`, margin + 78, 42);
      doc.setTextColor(185, 28, 28);
      doc.text(`${t("stats.violations")}: ${summary.violations}`, margin + 126, 42);

      autoTable(doc, {
        startY: 49,
        margin: { left: margin, right: margin },
        head: [[
          t("table.employee"),
          t("table.date"),
          t("table.time"),
          t("table.gross"),
          t("table.break"),
          t("table.rest"),
          t("table.status"),
          t("report.discrepancyAlerts")
        ]],
        body: shifts.map((shift) => [
          shift.employee,
          formatDate(shift.date, locale),
          `${shift.start}–${shift.end}`,
          `${shift.grossHours}h`,
          `${shift.breakMinutes}m / ${shift.requiredBreak}m`,
          shift.restHours === undefined ? "—" : `${shift.restHours}h`,
          statusLabel(shift.severity),
          shift.alerts.length
            ? shift.alerts.map((alert) => localizeAlert(alert, lang, shift).title).join("; ")
            : t("report.noDiscrepancy")
        ]),
        theme: "grid",
        styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: [23, 32, 51], lineColor: [219, 226, 234], lineWidth: 0.2 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 29 }, 2: { cellWidth: 24 }, 3: { cellWidth: 20 }, 4: { cellWidth: 26 }, 5: { cellWidth: 20 }, 6: { cellWidth: 25 } },
        didDrawPage: () => {
          const pageNumber = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(t("report.legal"), margin, doc.internal.pageSize.getHeight() - 10, { maxWidth: pageWidth - margin * 2 - 25 });
          doc.text(`${pageNumber}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
        }
      });

      doc.save(`shiftguard-audit-report-${today}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }

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
          <button className="btn btn-secondary" onClick={exportPdf} disabled={isExporting}>
            <FileText size={17} /> {isExporting ? t("report.exportingPdf") : t("report.exportPdf")}
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
