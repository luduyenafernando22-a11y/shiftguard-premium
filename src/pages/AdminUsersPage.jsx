import React, { useEffect, useState } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { fetchOrganizationMembers, updateMemberRole } from "../lib/dataService";

const ROLES = ["admin", "manager", "auditor", "employee"];

export default function AdminUsersPage({ organizationId, currentUserId }) {
  const { t } = useI18n();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    let active = true;
    fetchOrganizationMembers(organizationId).then((data) => active && setMembers(data)).catch((err) => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [organizationId]);

  async function changeRole(member, role) {
    if (member.id === currentUserId && role !== "admin") return;
    setSaving(member.id);
    setError("");
    try {
      const updated = await updateMemberRole(member.id, role, organizationId);
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
