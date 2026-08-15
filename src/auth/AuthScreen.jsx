import React, { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useAuth } from "./AuthContext";

export default function AuthScreen() {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", organizationName: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        await signIn(form.email, form.password);
      } else if (mode === "register") {
        const result = await signUp(form);
        setMessage(result.session ? t("auth.accountCreated") : t("auth.confirmEmail"));
      } else {
        await resetPassword(form.email);
        setMessage(t("auth.resetSent"));
      }
    } catch (submitError) {
      setError(submitError.message || t("auth.genericError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><ShieldCheck size={28} /><span>{t("app.name")}</span></div>
        <span className="eyebrow">{t("auth.eyebrow")}</span>
        <h1>{mode === "login" ? t("auth.loginTitle") : mode === "register" ? t("auth.registerTitle") : t("auth.resetTitle")}</h1>
        <p className="auth-copy">{t("auth.subtitle")}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <label>{t("auth.fullName")}<input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></label>
              <label>{t("auth.organization")}<input value={form.organizationName} onChange={(event) => update("organizationName", event.target.value)} required /></label>
            </>
          )}
          <label>{t("auth.email")}<input type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          {mode !== "reset" && <label>{t("auth.password")}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => update("password", event.target.value)} minLength={8} required /></label>}
          {error && <div className="form-error" role="alert">{error}</div>}
          {message && <div className="form-success" role="status">{message}</div>}
          <button className="btn btn-primary full" disabled={busy} type="submit">
            <LockKeyhole size={17} /> {busy ? t("auth.working") : mode === "login" ? t("auth.login") : mode === "register" ? t("auth.register") : t("auth.sendReset")}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="auth-links">
          {mode === "login" && <button className="link-button" onClick={() => setMode("reset")}>{t("auth.forgotPassword")}</button>}
          {mode !== "login" && <button className="link-button" onClick={() => setMode("login")}>{t("auth.backToLogin")}</button>}
          {mode === "login" && <button className="link-button" onClick={() => setMode("register")}>{t("auth.createAccount")}</button>}
        </div>
      </section>
    </main>
  );
}
