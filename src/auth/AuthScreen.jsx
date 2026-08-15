import React, { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { useAuth } from "./AuthContext";

export default function AuthScreen() {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword, configError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", organizationName: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
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

  const title = mode === "login" ? t("auth.loginTitle") : mode === "register" ? t("auth.registerTitle") : t("auth.resetTitle");
  const actionLabel = busy ? t("auth.working") : mode === "login" ? t("auth.login") : mode === "register" ? t("auth.register") : t("auth.sendReset");

  return (
    <main className="auth-shell auth-shell-premium">
      <section className="auth-card auth-card-premium" aria-labelledby="auth-title">
        <div className="auth-brand auth-brand-premium">
          <span className="auth-brand-mark" aria-hidden="true"><ShieldCheck size={28} strokeWidth={2.4} /></span>
          <span>{t("app.name")}</span>
        </div>
        <span className="auth-eyebrow">{t("auth.eyebrow")}</span>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-copy">{t("auth.subtitle")}</p>

        <form onSubmit={submit} className="auth-form auth-form-premium">
          {mode === "register" && (
            <div className="auth-form-row">
              <label>{t("auth.fullName")}<input value={form.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" required /></label>
              <label>{t("auth.organization")}<input value={form.organizationName} onChange={(event) => update("organizationName", event.target.value)} autoComplete="organization" required /></label>
            </div>
          )}
          <label>{t("auth.email")}<input type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          {mode !== "reset" && <label>{t("auth.password")}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(event) => update("password", event.target.value)} minLength={8} required /></label>}
          {(error || configError) && <div className="form-error auth-feedback" role="alert">{error || configError}</div>}
          {message && <div className="form-success auth-feedback" role="status">{message}</div>}
          <button className="btn btn-primary full auth-submit" disabled={busy || Boolean(configError)} type="submit">
            <LockKeyhole size={18} />
            <span>{actionLabel}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-links auth-links-premium">
          {mode === "login" && <button className="link-button" onClick={() => switchMode("reset")}>{t("auth.forgotPassword")}</button>}
          {mode !== "login" && <button className="link-button" onClick={() => switchMode("login")}>{t("auth.backToLogin")}</button>}
          {mode === "login" && <button className="link-button" onClick={() => switchMode("register")}>{t("auth.createAccount")}</button>}
        </div>
      </section>
    </main>
  );
}
