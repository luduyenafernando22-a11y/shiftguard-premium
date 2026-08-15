import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { fetchAuditLogs } from "../lib/dataService";

export default function AuditLogPage({ organizationId }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; fetchAuditLogs(organizationId).then((data) => active && setLogs(data)).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [organizationId]);
  return <section className="admin-page"><div className="section-heading"><div><span className="eyebrow">{t("auditLog.eyebrow")}</span><h1>{t("auditLog.title")}</h1><p>{t("auditLog.subtitle")}</p></div><ClipboardList size={28} color="var(--blue)" /></div>{error && <div className="global-error">{error}</div>}<div className="employees-panel">{loading ? <div className="state-block">{t("data.loading")}</div> : <div className="table-wrap"><table><thead><tr><th>{t("auditLog.when")}</th><th>{t("auditLog.action")}</th><th>{t("auditLog.entity")}</th><th>{t("auditLog.entityId")}</th><th>{t("auditLog.details")}</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan="5" className="empty-cell">{t("auditLog.empty")}</td></tr> : logs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td><span className={`badge badge-${log.action === "deleted" ? "violation" : log.action === "updated" ? "warning" : "ok"}`}>{t(`auditLog.${log.action}`)}</span></td><td>{log.entity_type}</td><td>{log.entity_id || "—"}</td><td><details><summary>{t("auditLog.viewChange")}</summary><pre className="audit-json">{JSON.stringify({ before: log.before_data, after: log.after_data }, null, 2)}</pre></details></td></tr>)}</tbody></table></div>}</div></section>;
}
