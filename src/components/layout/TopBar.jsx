import React from "react";
import { ShieldCheck, Sun, Moon, Languages } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../theme/ThemeContext";

export default function TopBar({ activeView, onNavigate }) {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "dashboard", label: t("nav.dashboard") },
    { id: "employees", label: t("nav.employees") },
    { id: "report", label: t("nav.report") }
  ];

  return (
    <header className="topbar no-print">
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <div>
          <strong>{t("app.name")}</strong>
          <span>{t("app.tagline")}</span>
        </div>
      </div>

      <nav>
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
