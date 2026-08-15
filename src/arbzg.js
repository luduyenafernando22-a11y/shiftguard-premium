/**
 * Standard ArbZG audit engine.
 *
 * Business rules implemented for this MVP:
 * - > 8h and <= 10h: amber alert.
 * - > 10h: red violation.
 * - 6h–9h inclusive: at least 30 min break.
 * - > 9h: at least 45 min break.
 * - Less than 11h between one employee's consecutive shifts: red violation.
 *
 * This is intentionally a configurable "standard checker", not a complete
 * implementation of every sector-specific working-time rule.
 */

export const RULES = {
  standardDailyHours: 8,
  maximumDailyHours: 10,
  breakThresholdHours: 6,
  breakThresholdLongHours: 9,
  breakMinutesStandard: 30,
  breakMinutesLong: 45,
  minimumRestHours: 11
};

export function toDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function minutesBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

export function hoursFromMinutes(minutes) {
  return round(minutes / 60);
}

export function getRequiredBreakMinutes(grossHours, rules = RULES) {
  if (grossHours > rules.breakThresholdLongHours) {
    return rules.breakMinutesLong;
  }
  if (grossHours >= rules.breakThresholdHours) {
    return rules.breakMinutesStandard;
  }
  return 0;
}

export function auditShift(shift, rules = RULES) {
  const start = toDateTime(shift.date, shift.start);
  const end = toDateTime(shift.date, shift.end);

  // A shift ending after midnight is represented by an end time earlier
  // than or equal to its start time and is therefore moved to the next day.
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const grossMinutes = minutesBetween(start, end);
  const grossHours = hoursFromMinutes(grossMinutes);
  const breakMinutes = Number(shift.breakMinutes) || 0;
  const netMinutes = Math.max(0, grossMinutes - breakMinutes);
  const netHours = hoursFromMinutes(netMinutes);
  const requiredBreak = getRequiredBreakMinutes(grossHours, rules);

  const alerts = [];
  let severity = "ok";

  if (grossHours > rules.maximumDailyHours) {
    severity = "violation";
    alerts.push({
      code: "DAILY_MAX",
      title: "Daily maximum exceeded",
      detail: `Recorded span is ${grossHours}h. The standard checker flags shifts above ${rules.maximumDailyHours}h.`
    });
  } else if (grossHours > rules.standardDailyHours) {
    severity = "warning";
    alerts.push({
      code: "DAILY_STANDARD",
      title: "Above 8h standard",
      detail: `Recorded span is ${grossHours}h, above the ${rules.standardDailyHours}h standard and within the configured ceiling.`
    });
  }

  if (breakMinutes < requiredBreak) {
    severity = "violation";
    alerts.push({
      code: "BREAK",
      title: "Insufficient break",
      detail: `Recorded break: ${breakMinutes} min. Required by this standard checker: ${requiredBreak} min.`
    });
  }

  return {
    ...shift,
    startDateTime: start,
    endDateTime: end,
    grossMinutes,
    grossHours,
    breakMinutes,
    netMinutes,
    netHours,
    requiredBreak,
    alerts,
    severity
  };
}

export function auditShifts(shifts, rules = RULES) {
  const audited = shifts.map((shift) => auditShift(shift, rules));

  const grouped = new Map();
  audited.forEach((shift) => {
    // employeeId is the stable internal identity; employee remains display-only.
    const employeeKey = shift.employeeId || shift.employee;
    if (!grouped.has(employeeKey)) grouped.set(employeeKey, []);
    grouped.get(employeeKey).push(shift);
  });

  for (const employeeShifts of grouped.values()) {
    employeeShifts.sort((a, b) => a.startDateTime - b.startDateTime);

    for (let i = 1; i < employeeShifts.length; i += 1) {
      const previous = employeeShifts[i - 1];
      const current = employeeShifts[i];
      const restMinutes = minutesBetween(previous.endDateTime, current.startDateTime);

      current.restMinutes = restMinutes;
      current.restHours = hoursFromMinutes(restMinutes);

      if (restMinutes < rules.minimumRestHours * 60) {
        current.severity = "violation";
        current.alerts.push({
          code: "REST",
          title: "Rest period below 11h",
          detail: `Only ${current.restHours}h between the previous shift end and this shift start. Minimum checked: ${rules.minimumRestHours}h.`
        });
      }
    }
  }

  // Re-sort to preserve the user's table order.
  const order = new Map(shifts.map((shift, index) => [shift.id, index]));
  return audited.sort((a, b) => order.get(a.id) - order.get(b.id));
}

export function getAuditSummary(audited) {
  return {
    total: audited.length,
    ok: audited.filter((s) => s.severity === "ok").length,
    warnings: audited.filter((s) => s.severity === "warning").length,
    violations: audited.filter((s) => s.severity === "violation").length
  };
}