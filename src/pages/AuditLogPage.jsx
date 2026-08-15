import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { fetchAuditLogs } from "../lib/dataService";
import { supabase } from "../lib/supabase";

export default function AuditLogPage({ organizationId }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = supabase ? await fetchAuditLogs(organizationId) : [
          { id: "demo-audit-1", created_at: "2026-02-14T08:45:00Z", action: "created", entity_type: "shift", entity_id: "demo-shift-01", before_data: null, after_data: { employee: "Mia Fischer", hours: 8 } },
          { id: "demo-audit-2", created_at: "2026-02-14T09:20:00Z", action: "updated", entity_type: "compliance_rules", entity_id: organizationId || "demo-org", before_data: { maximum_daily_hours: 10 }, after_data: { maximum_daily_hours: 10 } },
        ];
        if (active) setLogs(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [organizationId]);
  return <section className="admin-page"><div className="section-heading"><div><span className="eyebrow">{t("auditLog.eyebrow")}</span><h1>{t("auditLog.title")}</h1><p>{t("auditLog.subtitle")}</p></div><ClipboardList size={28} color="var(--blue)" /></div>{error && <div className="global-error">{error}</div>}<div className="employees-panel">{loading ? <div className="state-block">{t("data.loading")}</div> : <div className="table-wrap"><table><thead><tr><th>{t("auditLog.when")}</th><th>{t("auditLog.action")}</th><th>{t("auditLog.entity")}</th><th>{t("auditLog.entityId")}</th><th>{t("auditLog.details")}</th></tr></thead><tbody>{logs.length === 0 ? <tr><td colSpan="5" className="empty-cell">{t("auditLog.empty")}</td></tr> : logs.map((log) => <tr key={log.id}><td>{new Date(log.created_at).toLocaleString()}</td><td><span className={`badge badge-${log.action === "deleted" ? "violation" : log.action === "updated" ? "warning" : "ok"}`}>{t(`auditLog.${log.action}`)}</span></td><td>{log.entity_type}</td><td>{log.entity_id || "—"}</td><td><details><summary>{t("auditLog.viewChange")}</summary><pre className="audit-json">{JSON.stringify({ before: log.before_data, after: log.after_data }, null, 2)}</pre></details></td></tr>)}</tbody></table></div>}</div></section>;
}
