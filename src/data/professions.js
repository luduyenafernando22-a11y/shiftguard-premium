/**
 * Predefined professions. "custom" allows free text via
 * employee.customProfession, still requires the user to type a value.
 */
export const PROFESSIONS = [
  { id: "registeredNurse", en: "Registered Nurse", de: "Krankenschwester/-pfleger" },
  { id: "physician", en: "Physician", de: "Arzt/Ärztin" },
  { id: "nursingAssistant", en: "Nursing Assistant", de: "Pflegehelfer/in" },
  { id: "surgeon", en: "Surgeon", de: "Chirurg/in" },
  { id: "residentDoctor", en: "Resident Doctor", de: "Assistenzarzt/-ärztin" },
  { id: "physiotherapist", en: "Physiotherapist", de: "Physiotherapeut/in" },
  { id: "manager", en: "Manager", de: "Manager/in" },
  { id: "custom", en: "Custom…", de: "Individuell…" }
];

export function professionLabel(employee, lang) {
  if (employee.profession === "custom") {
    return employee.customProfession?.trim() || (lang === "de" ? "Individuell" : "Custom");
  }
  const found = PROFESSIONS.find((p) => p.id === employee.profession);
  if (!found) return employee.profession;
  return lang === "de" ? found.de : found.en;
}
