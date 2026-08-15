import React from "react";
import { Inbox, Loader2, AlertTriangle } from "lucide-react";

export function EmptyState({ title, body, action }) {
  return (
    <div className="state-block">
      <Inbox size={26} />
      <strong>{title}</strong>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="state-block state-loading">
      <Loader2 size={22} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="state-block state-error">
      <AlertTriangle size={22} />
      <span>{message}</span>
    </div>
  );
}
