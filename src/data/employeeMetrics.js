/**
 * Links Employees to the (unmodified) arbzg engine output.
 *
 * Shifts store both `employee` (full name string, required by arbzg.js
 * which groups/sorts by that field) and `employeeId` (the relational
 * link used everywhere else). This file never changes arbzg.js — it only
 * reads its output and aggregates it per employee.
 */

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isInCurrentWeek(shiftDate) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const d = new Date(`${shiftDate}T00:00:00`);
  return d >= weekStart && d < weekEnd;
}

/**
 * Worst severity wins: violation > warning > ok.
 */
function worstSeverity(shifts) {
  if (shifts.some((s) => s.severity === "violation")) return "violation";
  if (shifts.some((s) => s.severity === "warning")) return "warning";
  return "ok";
}

/**
 * Builds a metrics object per employee from the already-audited shift list
 * (the output of arbzg.js's auditShifts()).
 */
export function computeEmployeeMetrics(employee, auditedShifts = []) {
  const own = auditedShifts.filter((s) => s.employeeId === employee.id);
  const thisWeek = own.filter((s) => isInCurrentWeek(s.date));

  const weeklyHours = thisWeek.reduce((sum, s) => sum + s.netHours, 0);
  const warnings = own.reduce((sum, s) => sum + s.alerts.filter((a) => s.severity === "warning").length, 0);
  const violations = own.filter((s) => s.severity === "violation").length;
  const warningShifts = own.filter((s) => s.severity === "warning").length;

  return {
    employee,
    shifts: own,
    shiftsThisWeek: thisWeek.length,
    weeklyHours: Math.round(weeklyHours * 100) / 100,
    complianceStatus: own.length ? worstSeverity(own) : "ok",
    warnings: warningShifts,
    violations,
    discrepancies: own.filter((s) => s.alerts.length > 0).length
  };
}

export function computeAllEmployeeMetrics(employees = [], auditedShifts = []) {
  return employees.map((e) => computeEmployeeMetrics(e, auditedShifts));
}

export function computeOrgSummary(metricsList = []) {
  return {
    total: metricsList.length,
    compliant: metricsList.filter((m) => m.complianceStatus === "ok").length,
    warning: metricsList.filter((m) => m.complianceStatus === "warning").length,
    violation: metricsList.filter((m) => m.complianceStatus === "violation").length
  };
}
