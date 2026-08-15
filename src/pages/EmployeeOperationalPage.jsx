import React, { useEffect, useMemo, useState } from "react";
import { Clock3, MapPin, WifiOff } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchAttendanceLogs, flushAttendanceQueue, getCachedAttendanceLogs, insertAttendanceLog } from "../lib/dataService";

const DEMO_KEY = "shiftguard-demo-attendance";
function readDemoLogs() { try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "[]"); } catch { return []; } }
function writeDemoLogs(logs) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(logs)); } catch { /* optional */ } }

function locate() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ error: "UNAVAILABLE" });
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
      (error) => resolve({ error: error.code === 1 ? "PERMISSION_DENIED" : error.code === 3 ? "TIMEOUT" : "POSITION_UNAVAILABLE" }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  });
}

export default function EmployeeOperationalPage({ organizationId, userId }) {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [locationNotice, setLocationNotice] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const latest = logs[0];
  const onShift = latest?.type === "CLOCK_IN";

  async function refresh() {
    if (!isSupabaseConfigured) { setLogs(readDemoLogs().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); return; }
    const cached = await getCachedAttendanceLogs(organizationId, userId, false);
    if (cached.length) setLogs(cached);
    try { setLogs(await fetchAttendanceLogs(organizationId, userId, false)); } catch { /* cached state remains visible */ }
  }
  useEffect(() => { refresh(); const online = () => { setOffline(false); flushAttendanceQueue().then(refresh); }; const offlineEvent = () => setOffline(true); window.addEventListener("online", online); window.addEventListener("offline", offlineEvent); return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offlineEvent); }; }, [organizationId, userId]);

  async function clock() {
    if (busy) return;
    setBusy(true); setNotice(""); setLocationNotice(false);
    const locationCoords = await locate();
    if (locationCoords.error) setLocationNotice(true);
    const type = onShift ? "CLOCK_OUT" : "CLOCK_IN";
    const timestamp = new Date().toISOString();
    const payload = { organization_id: organizationId, user_id: userId, type, timestamp, location_coords: locationCoords, is_offline_sync: false };
    try {
      let result;
      if (!isSupabaseConfigured) {
        const localLog = { id: crypto.randomUUID(), userId, type, timestamp, locationCoords, isOfflineSync: false };
        const next = [localLog, ...readDemoLogs()]; writeDemoLogs(next); result = { queued: false, log: localLog };
      } else result = await insertAttendanceLog(payload);
      setLogs((current) => [result.log, ...current.filter((item) => item.id !== result.log.id)]);
      setNotice(result.queued ? t("attendance.queued") : t("attendance.success"));
      setOffline(Boolean(result.queued));
      if (navigator.vibrate) navigator.vibrate(80);
    } catch (error) { setNotice(error.message || t("attendance.error")); }
    finally { setBusy(false); }
  }

  const workedTime = useMemo(() => latest ? new Date(latest.timestamp).toLocaleString() : t("attendance.noRecord"), [latest, t]);
  return <section className="operational-page"><div className="operational-card"><span className="eyebrow">{t("attendance.eyebrow")}</span><h1>{t("attendance.title")}</h1><p className="operational-status">{onShift ? t("attendance.onShift") : t("attendance.offShift")}</p><div className={`clock-status ${onShift ? "clock-status-on" : ""}`}><Clock3 size={42} /><strong>{onShift ? t("attendance.clockedIn") : t("attendance.ready")}</strong><span>{workedTime}</span></div><button className={`clock-action ${onShift ? "clock-out" : "clock-in"}`} onClick={clock} disabled={busy}>{busy ? t("attendance.processing") : onShift ? t("attendance.clockOut") : t("attendance.clockIn")}</button>{offline && <div className="offline-notice"><WifiOff size={16} />{t("attendance.offline")}</div>}{locationNotice && <div className="location-notice"><MapPin size={16} />{t("attendance.locationFallback")}</div>}{notice && <div className="form-success">{notice}</div>}</div><div className="attendance-history-card"><div className="section-heading"><div><h2>{t("attendance.history")}</h2><p>{t("attendance.historySubtitle")}</p></div></div>{logs.slice(0, 12).map((log) => <div className="attendance-row" key={log.id}><span className={`attendance-dot ${log.type === "CLOCK_IN" ? "is-in" : "is-out"}`} /><strong>{log.type === "CLOCK_IN" ? t("attendance.clockInShort") : t("attendance.clockOutShort")}</strong><time>{new Date(log.timestamp).toLocaleString()}</time></div>)}</div></section>;
}
