import React, { useEffect, useState } from "react";
import { useI18n } from "../i18n/I18nContext";

const emptyForm = {
  employeeId: "",
  date: new Date().toISOString().slice(0, 10),
  start: "08:00",
  end: "16:30",
  breakMinutes: 30
};

/**
 * `employees` is the live roster (from EmployeesPage state). A shift stores
 * both `employeeId` (the relational link) and `employee` (the full name
 * string) — the latter is required by arbzg.js, which groups/sorts shifts
 * by that field and is left untouched.
 */
export default function ShiftForm({ initialValue, employees = [], onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState(initialValue || emptyForm);

  useEffect(() => {
    setForm(initialValue || emptyForm);
  }, [initialValue]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const employee = employees.find((e) => e.id === form.employeeId);
    if (!employee) return;
    onSave({
      ...form,
      employeeId: employee.id,
      employee: employee.fullName,
      breakMinutes: Number(form.breakMinutes) || 0
    });
  }

  return (
    <form className="shift-form" onSubmit={submit}>
      <div className="form-header">
        <div>
          <h2>{initialValue ? t("shiftForm.editTitle") : t("shiftForm.addTitle")}</h2>
          <p>{t("shiftForm.subtitle")}</p>
        </div>
        {initialValue && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t("shiftForm.cancel")}
          </button>
        )}
      </div>

      <div className="form-grid">
        <label>
          {t("shiftForm.employee")}
          <select
            value={form.employeeId}
            onChange={(e) => update("employeeId", e.target.value)}
            required
            disabled={employees.length === 0}
          >
            <option value="" disabled>
              {employees.length === 0 ? t("shiftForm.noEmployees") : t("shiftForm.employeePlaceholder")}
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("shiftForm.date")}
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            required
          />
        </label>

        <label>
          {t("shiftForm.start")}
          <input
            type="time"
            value={form.start}
            onChange={(e) => update("start", e.target.value)}
            required
          />
        </label>

        <label>
          {t("shiftForm.end")}
          <input
            type="time"
            value={form.end}
            onChange={(e) => update("end", e.target.value)}
            required
          />
        </label>

        <label>
          {t("shiftForm.break")}
          <input
            type="number"
            min="0"
            step="5"
            value={form.breakMinutes}
            onChange={(e) => update("breakMinutes", e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={employees.length === 0}>
          {initialValue ? t("shiftForm.save") : t("shiftForm.add")}
        </button>
      </div>
    </form>
  );
}
