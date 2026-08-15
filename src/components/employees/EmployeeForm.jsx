import React, { useEffect, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { PROFESSIONS } from "../../data/professions";
import { readAvatarAsLocalDataUrl } from "../../data/models";
import Avatar from "../common/Avatar";

const emptyForm = {
  fullName: "",
  employeeId: "",
  profession: "registeredNurse",
  customProfession: "",
  department: "",
  contractedHours: 38.5,
  status: "active",
  avatarDataUrl: null
};

export default function EmployeeForm({ initialValue, onSave, onCancel }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState(initialValue || emptyForm);

  useEffect(() => {
    setForm(initialValue || emptyForm);
  }, [initialValue]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readAvatarAsLocalDataUrl(file);
    update("avatarDataUrl", dataUrl);
  }

  function submit(event) {
    event.preventDefault();
    if (!form.fullName.trim()) return;
    onSave({
      ...form,
      fullName: form.fullName.trim(),
      employeeId: form.employeeId.trim(),
      contractedHours: Number(form.contractedHours) || 0
    });
  }

  const previewEmployee = { fullName: form.fullName || "?", avatarDataUrl: form.avatarDataUrl };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel employee-form-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialValue ? t("employeeForm.editTitle") : t("employeeForm.addTitle")}</h2>
          <button type="button" className="icon-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="employee-form">
          <div className="avatar-row">
            <Avatar employee={previewEmployee} size={64} />
            <div className="avatar-controls">
              <label className="btn btn-secondary avatar-upload-btn">
                <Upload size={15} /> {t("employeeForm.uploadPhoto")}
                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
              </label>
              {form.avatarDataUrl && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => update("avatarDataUrl", null)}
                >
                  <Trash2 size={14} /> {t("employeeForm.removePhoto")}
                </button>
              )}
              <p className="field-note">{t("employeeForm.avatarNote")}</p>
            </div>
          </div>

          <div className="form-grid employee-form-grid">
            <label>
              {t("employeeForm.fullName")}
              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder={t("employeeForm.placeholderName")}
                required
              />
            </label>

            <label>
              {t("employeeForm.employeeId")}
              <input
                value={form.employeeId}
                onChange={(e) => update("employeeId", e.target.value)}
                placeholder={t("employeeForm.placeholderId")}
              />
            </label>

            <label>
              {t("employeeForm.profession")}
              <select value={form.profession} onChange={(e) => update("profession", e.target.value)}>
                {PROFESSIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "de" ? p.de : p.en}
                  </option>
                ))}
              </select>
            </label>

            {form.profession === "custom" && (
              <label>
                {t("employeeForm.customProfession")}
                <input
                  value={form.customProfession}
                  onChange={(e) => update("customProfession", e.target.value)}
                  placeholder={t("employeeForm.placeholderCustomProfession")}
                />
              </label>
            )}

            <label>
              {t("employeeForm.department")}
              <input
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                placeholder={t("employeeForm.placeholderDepartment")}
              />
            </label>

            <label>
              {t("employeeForm.hours")}
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.contractedHours}
                onChange={(e) => update("contractedHours", e.target.value)}
              />
            </label>

            <label>
              {t("employeeForm.status")}
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="active">{t("employeesPage.active")}</option>
                <option value="inactive">{t("employeesPage.inactive")}</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              {t("employeeForm.cancel")}
            </button>
            <button type="submit" className="btn btn-primary">
              {t("employeeForm.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
