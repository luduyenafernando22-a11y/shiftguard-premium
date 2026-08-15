/**
 * Data model shapes for ShiftGuard.
 *
 * These are plain-JS factory functions, not TypeScript types (the project
 * intentionally stays JS-only for now — see README "Not implemented yet").
 *
 * Every entity carries an `organizationId` field so that, once a real
 * backend/auth layer exists (e.g. Supabase), rows can be scoped to a
 * tenant with minimal changes to the shape of the data itself. Today,
 * with no backend, all data lives under a single in-memory
 * DEFAULT_ORGANIZATION and organizationId is not enforced anywhere.
 *
 * Relationship the app is built around:
 *   Organization -> Employees -> Employee Profile -> Shifts ->
 *   Working Hours -> Compliance -> Audit History
 */

export function createOrganization({ id, name }) {
  return { id, name };
}

export const DEFAULT_ORGANIZATION = createOrganization({
  id: "org-demo",
  name: "Universitätsklinikum Demo"
});

export function createDepartment({ id, name, organizationId = DEFAULT_ORGANIZATION.id }) {
  return { id, name, organizationId };
}

let employeeSeq = 1000;
export function createEmployee({
  id,
  organizationId = DEFAULT_ORGANIZATION.id,
  employeeId,
  fullName,
  profession = "registeredNurse",
  customProfession = "",
  department = "",
  contractedHours = 38.5,
  status = "active",
  avatarDataUrl = null
} = {}) {
  employeeSeq += 1;
  return {
    id: id || `emp-${employeeSeq}`,
    organizationId,
    employeeId: employeeId || `EMP-${employeeSeq}`,
    fullName,
    profession,
    customProfession,
    department,
    contractedHours: Number(contractedHours) || 0,
    status, // "active" | "inactive"
    avatarDataUrl // base64 dataURL, local-only for now — see uploadAvatar()
  };
}

/**
 * Placeholder for the future Supabase Storage integration.
 * Today it just resolves the file to a local base64 dataURL kept in React
 * state — nothing is uploaded or persisted anywhere. Swapping this
 * function's internals is the only change needed once real storage exists.
 */
export function readAvatarAsLocalDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getInitials(fullName = "") {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * A ComplianceRecord is a derived view, not stored data: it is computed
 * on the fly from an employee's audited shifts (see engine.js). It is
 * modelled here only so the shape is documented for a future persistence
 * layer (an "audit snapshot" table).
 */
export function createComplianceRecordShape() {
  return {
    employeeId: null,
    organizationId: DEFAULT_ORGANIZATION.id,
    period: null, // e.g. ISO week string
    status: "ok", // "ok" | "warning" | "violation"
    shiftsCount: 0,
    netHours: 0,
    warnings: 0,
    violations: 0
  };
}
