import React, { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { professionLabel } from "../../data/professions";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import { EmptyState } from "../common/States";

export default function EmployeeTable({ metricsList = [], onOpenProfile, onAddEmployee }) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(() => {
    const set = new Set(metricsList.map((m) => m.employee.department).filter(Boolean));
    return Array.from(set).sort();
  }, [metricsList]);

  const filtered = metricsList.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.employee.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.employee.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesDept = department === "all" || m.employee.department === department;
    const matchesStatus = status === "all" || m.employee.status === status;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="employees-panel">
      <div className="table-toolbar">
        <div className="search-field">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("employeesPage.search")}
          />
        </div>
        <select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="all">{t("employeesPage.allDepartments")}</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t("employeesPage.allStatus")}</option>
          <option value="active">{t("employeesPage.active")}</option>
          <option value="inactive">{t("employeesPage.inactive")}</option>
        </select>
        {onAddEmployee && <button className="btn btn-primary" onClick={onAddEmployee}>
          <Plus size={16} /> {t("employeesPage.add")}
        </button>}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("employeesPage.col.employee")}</th>
              <th>{t("employeesPage.col.role")}</th>
              <th>{t("employeesPage.col.department")}</th>
              <th>{t("employeesPage.col.week")}</th>
              <th>{t("employeesPage.col.status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">
                  <EmptyState title={t("employeesPage.empty")} />
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr
                  key={m.employee.id}
                  className="clickable-row"
                  onClick={() => onOpenProfile(m.employee.id)}
                >
                  <td>
                    <div className="employee-name-cell">
                      <Avatar employee={m.employee} />
                      <div>
                        <div className="employee-name">{m.employee.fullName}</div>
                        <div className="employee-id">{m.employee.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td>{professionLabel(m.employee, lang)}</td>
                  <td>{m.employee.department || "—"}</td>
                  <td>{m.weeklyHours}h</td>
                  <td>
                    <Badge status={m.complianceStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
