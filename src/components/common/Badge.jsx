import React from "react";
import { useI18n } from "../../i18n/I18nContext";

const LABEL_KEYS = {
  ok: "employees.compliant",
  warning: "employees.warning",
  violation: "employees.violation"
};

export default function Badge({ status }) {
  const { t } = useI18n();
  return <span className={`badge badge-${status}`}>{t(LABEL_KEYS[status] || status)}</span>;
}
