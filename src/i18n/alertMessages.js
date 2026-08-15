/**
 * Localizes the compliance alerts produced by ../arbzg.js.
 *
 * arbzg.js (the audit engine, left unmodified per project rules) always
 * generates its alert.title/alert.detail strings in English. This file
 * reads only alert.code plus the numeric fields already present on an
 * audited shift (grossHours, breakMinutes, requiredBreak, restHours) and
 * rebuilds an equivalent, fully localized message. The engine's own
 * calculations are never touched — this is a presentation-layer concern.
 */
import { RULES } from "../arbzg";

const MESSAGES = {
  en: {
    DAILY_MAX: (s) => ({
      title: "Daily maximum exceeded",
      detail: `Recorded span is ${s.grossHours}h. The standard checker flags shifts above ${RULES.maximumDailyHours}h.`
    }),
    DAILY_STANDARD: (s) => ({
      title: "Above 8h standard",
      detail: `Recorded span is ${s.grossHours}h, above the ${RULES.standardDailyHours}h standard and within the ${RULES.maximumDailyHours}h ceiling.`
    }),
    BREAK: (s) => ({
      title: "Insufficient break",
      detail: `Recorded break: ${s.breakMinutes} min. Required by this standard checker: ${s.requiredBreak} min.`
    }),
    REST: (s) => ({
      title: "Rest period below 11h",
      detail: `Only ${s.restHours}h between the previous shift end and this shift start. Minimum checked: ${RULES.minimumRestHours}h.`
    })
  },
  de: {
    DAILY_MAX: (s) => ({
      title: "Tägliches Maximum überschritten",
      detail: `Erfasste Dauer: ${s.grossHours} Std. Der Standardprüfer markiert Schichten über ${RULES.maximumDailyHours} Std.`
    }),
    DAILY_STANDARD: (s) => ({
      title: "Über 8-Std.-Standard",
      detail: `Erfasste Dauer: ${s.grossHours} Std., über dem ${RULES.standardDailyHours}-Std.-Standard und innerhalb der ${RULES.maximumDailyHours}-Std.-Grenze.`
    }),
    BREAK: (s) => ({
      title: "Pause unzureichend",
      detail: `Erfasste Pause: ${s.breakMinutes} Min. Erforderlich nach diesem Standardprüfer: ${s.requiredBreak} Min.`
    }),
    REST: (s) => ({
      title: "Ruhezeit unter 11 Std.",
      detail: `Nur ${s.restHours} Std. zwischen dem Ende der vorherigen Schicht und dem Beginn dieser Schicht. Geprüftes Minimum: ${RULES.minimumRestHours} Std.`
    })
  }
};

/**
 * @param {{code:string,title?:string,detail?:string}} alert one entry from shift.alerts
 * @param {"en"|"de"} lang active UI language
 * @param {object} shift the audited shift the alert belongs to (for its numeric fields)
 */
export function localizeAlert(alert, lang, shift) {
  const dict = MESSAGES[lang] || MESSAGES.en;
  const build = dict[alert.code];
  if (!build || !shift) return { title: alert.title, detail: alert.detail };
  return build(shift);
}
