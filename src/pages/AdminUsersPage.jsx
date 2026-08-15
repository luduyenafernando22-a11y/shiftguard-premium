import React, { useEffect, useState } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { fetchOrganizationMembers, updateMemberRole } from "../lib/dataService";
import { supabase } from "../lib/supabase";

const ROLES = ["admin", "manager", "auditor", "employee"];
const DEMO_MEMBERS = [
  { id: "demo-admin", full_name: "Alex Morgan", email: "alex@shiftguard.demo", role: "admin", created_at: "2026-01-12T09:00:00Z" },
  { id: "demo-manager", full_name: "Sofia Weber", email: "sofia@shiftguard.demo", role: "manager", created_at: "2026-01-16T09:00:00Z" },
  { id: "demo-auditor", full_name: "Jonas Keller", email: "jonas@shiftguard.demo", role: "auditor", created_at: "2026-02-03T09:00:00Z" },
  { id: "demo-employee", full_name: "Mia Fischer", email: "mia@shiftguard.demo", role: "employee", created_at: "2026-02-08T09:00:00Z" },
];

export default function AdminUsersPage({ organizationId, currentUserId }) {
  const { t } = useI18n();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = supabase ? await fetchOrganizationMembers(organizationId) : DEMO_MEMBERS;
        if (active) setMembers(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [organizationId]);

  async function changeRole(member, role) {
    if (member.id === currentUserId && role !== "admin") return;
    setSaving(member.id);
    setError("");
    try {
      const updated = supabase
        ? await updateMemberRole(member.id, role, organizationId)
        : { ...member, role };
      setMembers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (err) { setError(err.message); }
    finally { setSaving(""); }
  }

  return <section className="admin-page">
    <div className="section-heading"><div><span className="eyebrow">{t("admin.eyebrow")}</span><h1>{t("admin.title")}</h1><p>{t("admin.subtitle")}</p></div><ShieldCheck size={28} color="var(--blue)" /></div>
    {error && <div className="global-error">{error}</div>}
    <div className="employees-panel">
      {loading ? <div className="state-block">{t("data.loading")}</div> : <div className="table-wrap"><table><thead><tr><th>{t("admin.member")}</th><th>{t("admin.email")}</th><th>{t("admin.role")}</th><th>{t("admin.joined")}</th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td><div className="employee-name-cell"><span className="avatar avatar-initials" style={{ width: 34, height: 34 }}><UsersRound size={16} /></span><div><div className="employee-name">{member.full_name || t("admin.unnamed")}</div>{member.id === currentUserId && <div className="employee-id">{t("admin.you")}</div>}</div></div></td><td>{member.email || "—"}</td><td><select value={member.role} disabled={saving === member.id || member.id === currentUserId} onChange={(event) => changeRole(member, event.target.value)}>{ROLES.map((role) => <option key={role} value={role}>{t(`role.${role}`)}</option>)}</select></td><td>{new Date(member.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
