import React, { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, UsersRound } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchAttendanceLogs, fetchOrganizationMembers, getCachedAttendanceLogs, subscribeToAttendance } from "../lib/dataService";

export default function LiveDashboardPage({ organizationId }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [connected, setConnected] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function refresh() {
    if (!isSupabaseConfigured) { setLogs([]); return; }
    const cached = await getCachedAttendanceLogs(organizationId, null, true);
    if (cached.length) setLogs(cached);
    try { setLogs(await fetchAttendanceLogs(organizationId, null, true)); } catch { /* cached data remains visible */ }
    try { setMembers(await fetchOrganizationMembers(organizationId)); } catch { /* ids remain usable */ }
  }
  useEffect(() => {
    refresh();
    if (!isSupabaseConfigured) return undefined;
    const unsubscribe = subscribeToAttendance(organizationId, (payload) => {
      const next = payload.new || payload.old;
      if (payload.eventType === "DELETE") setLogs((current) => current.filter((item) => item.id !== next.id));
      else setLogs((current) => [next, ...current.filter((item) => item.id !== next.id)].map((row) => row.type ? { ...row, timestamp: row.timestamp } : row));
      setConnected(true);
    });
    const timeout = window.setTimeout(() => setConnected(true), 800);
    return () => { unsubscribe(); window.clearTimeout(timeout); };
  }, [organizationId]);

  const latestByUser = useMemo(() => { const map = new Map(); [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach((log) => { if (!map.has(log.userId || log.user_id)) map.set(log.userId || log.user_id, log); }); return map; }, [logs]);
  const onShift = [...latestByUser.values()].filter((log) => log.type === "CLOCK_IN").length;
  const completed = logs.filter((log) => log.type === "CLOCK_OUT" && String(log.timestamp).slice(0, 10) === today).length;
  const late = logs.filter((log) => log.type === "CLOCK_IN" && String(log.timestamp).slice(0, 10) === today && new Date(log.timestamp).getHours() >= 9).length;
  const nameFor = (id) => members.find((member) => member.id === id)?.full_name || id?.slice(0, 8) || t("attendance.unknown");
  return <section className="live-page"><div className="section-heading"><div><span className="eyebrow">{t("live.eyebrow")}</span><h1>{t("live.title")}</h1><p>{t("live.subtitle")}</p></div><div className={`live-connection ${connected ? "is-connected" : ""}`}><span className="status-dot" />{connected ? t("live.connected") : t("live.connecting")}</div></div><div className="live-metrics"><div className="live-metric live-metric-primary"><UsersRound size={24} /><strong>{onShift}</strong><span>{t("live.onShift")}</span></div><div className="live-metric"><Activity size={24} /><strong>{late}</strong><span>{t("live.lateToday")}</span></div><div className="live-metric"><CheckCircle2 size={24} /><strong>{completed}</strong><span>{t("live.completedToday")}</span></div></div><div className="live-list">{[...latestByUser.entries()].map(([userId, log]) => <div className="live-row" key={userId}><span className={`attendance-dot ${log.type === "CLOCK_IN" ? "is-in" : "is-out"}`} /><div><strong>{nameFor(userId)}</strong><span>{log.type === "CLOCK_IN" ? t("attendance.clockedIn") : t("attendance.clockedOut")}</span></div><time>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div></section>;
}
