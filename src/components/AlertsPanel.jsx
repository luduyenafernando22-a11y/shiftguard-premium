import React from "react";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { localizeAlert } from "../i18n/alertMessages";

export default function AlertsPanel({ shifts = [] }) {
  const { t, lang } = useI18n();
  const alerts = shifts.flatMap((shift) =>
    shift.alerts.map((alert) => ({
      ...alert,
      ...localizeAlert(alert, lang, shift),
      employee: shift.employee,
      date: shift.date
    }))
  );

  if (!alerts.length) {
    return (
      <div className="alerts-panel clean">
        <CheckCircle2 size={22} />
        <div>
          <strong>{t("alerts.none.title")}</strong>
          <p>{t("alerts.none.body")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-list">
      {alerts.map((alert, index) => (
        <div className={`alert-row alert-${alert.code.toLowerCase()}`} key={`${alert.code}-${alert.employee}-${index}`}>
          {alert.code === "REST" ? <Clock3 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>{alert.title}</strong>
            <p>{alert.employee} · {alert.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
