import React from "react";
import { Sun, Moon, Languages } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../theme/ThemeContext";

export default function TopBar({ activeView, onNavigate, role, isDemoMode = false, demoRole, onDemoRoleChange }) {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const navItems = role === "employee"
    ? [{ id: "operational", label: t("nav.operational") }]
    : role === "manager"
      ? [
          { id: "dashboard", label: t("nav.dashboard") },
          { id: "employees", label: t("nav.employees") },
          { id: "report", label: t("nav.report") },
          { id: "live", label: t("nav.live") }
        ]
      : role === "admin"
        ? [
            { id: "dashboard", label: t("nav.dashboard") },
            { id: "employees", label: t("nav.employees") },
            { id: "report", label: t("nav.report") },
            { id: "live", label: t("nav.live") },
            { id: "admin", label: t("nav.admin") },
            { id: "settings", label: t("nav.settings") },
            { id: "auditLog", label: t("nav.auditLog") }
          ]
        : role === "auditor"
          ? [
              { id: "dashboard", label: t("nav.dashboard") },
              { id: "employees", label: t("nav.employees") },
              { id: "report", label: t("nav.report") },
              { id: "auditLog", label: t("nav.auditLog") }
            ]
          : [];

  return (
    <header className="topbar no-print">
      <div className="brand">
        <div className="brand-mark"><img src="/pwa-192x192-reference.png" alt="ShiftGuard" /></div>
        <div>
          <strong>{t("app.name")}</strong>
          <span>{t("app.tagline")}</span>
        </div>
      </div>

      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? "nav-active" : ""}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        {isDemoMode && (
          <label className="demo-role-switcher">
            <span>{t("demo.viewAs")}</span>
            <select value={demoRole} onChange={(event) => onDemoRoleChange(event.target.value)} aria-label={t("demo.viewAs")}>
              <option value="employee">{t("role.employee")}</option>
              <option value="admin">{t("role.admin")}</option>
            </select>
          </label>
        )}
        <button className="icon-btn" onClick={toggleLang} title={t("lang.toggle")}>
          <Languages size={16} />
          <span className="lang-code">{lang.toUpperCase()}</span>
        </button>
        <button className="icon-btn" onClick={toggleTheme} title={t("theme.toggle")}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="topbar-status">
          <span className="status-dot" /> {t("topbar.internalMode")}
        </div>
      </div>
    </header>
  );
}
