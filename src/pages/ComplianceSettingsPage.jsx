import React, { useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { fetchOrganizationRules, updateOrganizationRules } from "../lib/dataService";
import { supabase } from "../lib/supabase";

const DEFAULTS = { standard_daily_hours: 8, maximum_daily_hours: 10, break_threshold_hours: 6, break_threshold_long_hours: 9, break_minutes_standard: 30, break_minutes_long: 45, minimum_rest_hours: 11 };
const FIELDS = [
  ["standard_daily_hours", "settings.standard"], ["maximum_daily_hours", "settings.maximum"], ["break_threshold_hours", "settings.breakThreshold"], ["break_threshold_long_hours", "settings.longBreakThreshold"], ["break_minutes_standard", "settings.breakStandard"], ["break_minutes_long", "settings.breakLong"], ["minimum_rest_hours", "settings.rest"]
];

export default function ComplianceSettingsPage({ organizationId, userId, onRulesSaved }) {
  const { t } = useI18n();
  const [rules, setRules] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = supabase ? await fetchOrganizationRules(organizationId) : DEFAULTS;
        if (active && data) setRules(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [organizationId]);
  function update(key, value) { setRules((current) => ({ ...current, [key]: Number(value) })); }
  async function save(event) { event.preventDefault(); setSaving(true); setMessage(""); setError(""); try { const saved = supabase ? await updateOrganizationRules(rules, organizationId, userId) : rules; setRules(saved); onRulesSaved?.(saved); setMessage(t("settings.saved")); } catch (err) { setError(err.message); } finally { setSaving(false); } }
  return <section className="settings-page"><div className="section-heading"><div><span className="eyebrow">{t("settings.eyebrow")}</span><h1>{t("settings.title")}</h1><p>{t("settings.subtitle")}</p></div><SlidersHorizontal size={28} color="var(--blue)" /></div><div className="settings-card">{loading ? <div className="state-block">{t("data.loading")}</div> : <form onSubmit={save}><div className="settings-grid">{FIELDS.map(([key, label]) => <label key={key}>{t(label)}<input type="number" min="0" step="0.5" value={rules[key]} onChange={(event) => update(key, event.target.value)} required /></label>)}</div>{error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}<div className="form-actions"><button className="btn btn-primary" disabled={saving} type="submit"><Save size={16} />{saving ? t("auth.working") : t("settings.save")}</button></div></form>}</div></section>;
}
