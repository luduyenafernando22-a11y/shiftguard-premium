# ShiftGuard Premium

A React + Vite internal workspace for shift monitoring, ArbZG standard
compliance auditing, and Employee Management — built on top of the original
ArbZG Standard Auditor MVP, whose audit engine (`src/arbzg.js`) and
shift-tracking workflow are preserved unchanged.

This is a **correction pass** on a previously delivered Premium build. It
did not start from zero: the incoming ZIP already contained a working
Employee Management layer, a working ArbZG engine, and a working i18n/theme
setup. This pass fixed real bugs, closed i18n gaps, hardened a few
components against edge-case crashes, and prepared the project for a clean
Netlify deploy. Nothing was rewritten from scratch.

## Stack

- React 18 + Vite 6
- Lucide React icons
- Plain CSS with light/dark theme tokens (**no Tailwind, no PostCSS
  config anywhere in this project** — confirmed by a full file-by-file scan)
- No new runtime dependencies added
- Netlify-ready SPA routing fallback

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Deploy to Netlify

Push the repository to GitHub and import it into Netlify, or upload the
project through your preferred Netlify workflow.

The included `netlify.toml` uses:

- Build command: `npm run build`
- Publish directory: `dist`
- Node version pinned to `20` (added this pass, see below)
- SPA fallback: `/* -> /index.html`

### About the previous "tailwindcss" build error

This project has **zero Tailwind or PostCSS references** — no
`tailwind.config.*`, no `postcss.config.*`, nothing in `package.json` or
anywhere in `src/`. A clean `npm install` cannot fail on a `tailwindcss`
module that the project never declares as a dependency. If the error
reappears on Netlify, it is almost certainly environment-side rather than
project-side. In order of likelihood:

1. **Stale build cache.** Netlify caches `node_modules` between deploys.
   If an earlier version of this repo (or a different project) previously
   built in that same Netlify site with Tailwind installed, the cache can
   carry that dependency forward. Fix: Netlify dashboard → Deploys →
   **Trigger deploy → Clear cache and deploy site**.
2. **Wrong base directory.** If this `shiftguard-premium/` folder sits
   inside a larger repo (e.g. next to other project attempts that *do* use
   Tailwind), and Netlify's "Base directory" / "Package directory" setting
   points at the repo root instead of this folder, it will install from
   the wrong `package.json`. Fix: set the Netlify site's base directory to
   the folder containing this `package.json`.
3. **Node version mismatch.** Vite 6 requires Node ≥ 18. This pass pins
   `NODE_VERSION = "20"` in `netlify.toml` and `"engines": { "node":
   ">=20.0.0" }` in `package.json` to remove this as a variable.

If none of these apply and the error still reproduces on a genuinely clean
Netlify site pointed at exactly this folder, please share the full Netlify
build log — that would indicate something environment-specific that isn't
visible from the project files alone.

## What this pass fixed

This ZIP was audited file-by-file before any change was made (all
`package.json`, configs, `src/`, styles, i18n, theme, data models, and the
ArbZG engine). The following real issues were found and fixed:

- **i18n leak in compliance alerts (the main bug).** `src/arbzg.js`
  generates its `alert.title` / `alert.detail` strings in English by
  design (it's the audit engine and was left untouched). Several
  components displayed those strings verbatim, so switching to German
  still showed English alert text in the Discrepancy Alerts panel, the
  Audit Report, and an Employee Profile's Audit History tab — a real
  language-mixing bug. Fixed with a new presentation-only helper,
  `src/i18n/alertMessages.js`, which maps `alert.code` (e.g. `DAILY_MAX`,
  `BREAK`, `REST`) plus the shift's own numeric fields to a fully
  localized title/detail, in both languages. `arbzg.js` itself was not
  modified — its calculations, ordering, and severities are exactly as
  before.
- **Employee profession dropdown ignored the selected language** — it
  always rendered the English profession name (`p.en`) regardless of UI
  language. Now respects `lang`.
- **A handful of hardcoded English strings** that had slipped past
  translation: the Shift Register's Edit/Delete icon-button tooltips, the
  footer tagline, and the "e.g. …" placeholder text in the employee form.
  All now translated (both keys added to `translations.js`, EN/DE stay in
  sync — verified programmatically, 122 keys each, zero mismatches).
- **Exported HTML audit report was always English** regardless of the
  active UI language. Now uses the same translation dictionary and a
  locale-correct date format (`de-DE` / `en-GB`).
- **White-screen hardening:** wrapped the theme/language `localStorage`
  reads and writes in `try/catch` (some privacy modes or embedded webviews
  throw on `localStorage` access instead of just returning `null`), and
  added `= []` / safe default fallbacks to the props of `DashboardPage`,
  `EmployeesPage`, `EmployeeTable`, `ShiftTable`, `AlertsPanel`,
  `AuditReport`, `ShiftForm`, and the `employeeMetrics.js` aggregation
  helpers, so a missing or momentarily-undefined array can't crash a
  render.
- **Netlify build resilience:** pinned Node 20 in both `netlify.toml` and
  `package.json` `engines`, to remove Node-version drift as a possible
  build failure cause.

Everything else — Employee Management CRUD, Employee Profile tabs,
Employees↔Shifts linking via `employeeId`, the Dashboard employee summary,
Light/Dark mode, avatar upload, custom professions, responsive layout —
was already working correctly in the incoming ZIP and was left as-is.

## What's implemented in this version

**Core (from the original MVP, unchanged):**
- ArbZG standard checker: 8h/10h daily thresholds, 30min/45min break
  tiers, 11h minimum rest between an employee's consecutive shifts
  (overnight shifts handled correctly).
- Live shift register, discrepancy alerts panel, printable/exportable
  audit report — now correctly localized in both directions (screen and
  exported HTML).

**Premium layer:**
- **Employee Management 2.0** — full CRUD, with employee ID, profession
  (predefined list + Custom with free text, now correctly localized),
  department, contracted weekly hours, active/inactive status, and a
  photo/initials avatar.
- **Employee Profile** — clicking an employee opens a detail view with
  five tabs (Profile, Schedule, Working Hours, Compliance, Audit History),
  all computed live from that employee's actual shifts through the
  unmodified `arbzg.js` engine — not static placeholders.
- **Shifts are relationally linked to employees** (`employeeId`), while
  still feeding the engine the plain `employee` name string it expects
  (that string field is what `arbzg.js` groups/sorts consecutive shifts
  by — see "Known limitation" below).
- **Dashboard** shows an organization-wide employee compliance summary
  (total / compliant / warning / violation), alongside the existing shift
  stats.
- **Light/Dark mode**, persisted to `localStorage` (now crash-safe),
  applied across the whole app via CSS custom properties — no page is
  left partially in the other theme.
- **German/English i18n**, persisted to `localStorage` (now crash-safe).
  Every visible string, including compliance alert text and the exported
  report, now follows the active language — verified with no leftover
  hardcoded English strings anywhere in `src/`.
- Empty/loading/error state components (`States.jsx`) for future use in
  data-fetching flows.
- Data model factories (`Organization`, `Employee`, `Department`,
  `ComplianceRecord` shape) in `src/data/models.js`, each carrying an
  `organizationId` field so a future multi-tenant backend can scope rows
  with minimal shape changes. **No real multi-tenancy, auth, or backend
  exists yet** — there is exactly one in-memory `DEFAULT_ORGANIZATION`
  and it is not enforced anywhere.
- Avatar upload reads the file into a local base64 data URL kept only in
  React state for the current session — nothing is persisted or
  uploaded. `readAvatarAsLocalDataUrl()` in `src/data/models.js` is the
  single function to swap out once real storage (e.g. Supabase Storage)
  exists.

## Known limitation (intentionally not changed)

`arbzg.js` groups and sorts an employee's consecutive shifts by the
`shift.employee` **name string**, not by `employeeId`. In the current
single-organization, no-auth setup this only matters if two different
employees are ever given the exact same full name — an edge case, but
worth knowing about. Fixing it means changing how the engine groups
shifts, which this pass deliberately avoided per the "don't touch the
ArbZG engine without necessity" rule. If this ever needs fixing, the
change belongs in `auditShifts()` in `arbzg.js` (group by `employeeId`
instead of `employee`), not in the presentation layer.

## Project structure

```
src/
├── arbzg.js                  # unchanged compliance engine
├── App.jsx                   # shell: employees/shifts state, routing
├── data/
│   ├── models.js              # Organization/Employee/Department factories
│   ├── professions.js         # predefined professions + custom
│   └── employeeMetrics.js     # derives per-employee metrics from arbzg output
├── i18n/
│   ├── translations.js        # DE/EN dictionaries (122 keys each, in sync)
│   ├── I18nContext.jsx        # language context (now crash-safe)
│   └── alertMessages.js       # NEW — localizes arbzg.js alert codes
├── theme/                     # light/dark context (now crash-safe)
├── pages/
│   ├── DashboardPage.jsx
│   └── EmployeesPage.jsx
└── components/
    ├── layout/TopBar.jsx
    ├── employees/              # EmployeeTable, EmployeeForm, EmployeeProfile
    ├── common/                 # Avatar, Badge, States
    └── ShiftForm.jsx, ShiftTable.jsx, AlertsPanel.jsx, StatCard.jsx,
        AuditReport.jsx
```

## Still needed before production / commercial deployment

- **Backend & persistence**: everything still lives in React state and is
  lost on refresh. No database, no API.
- **Real multi-tenancy & auth**: the `organizationId` field exists on
  every model but nothing enforces tenant isolation; there is no login.
- **Avatar storage**: currently local-only (session state, base64). A
  real deployment needs Supabase Storage (or equivalent) plus size/type
  validation.
- **Audit log / history persistence**: compliance history is recomputed
  live from current shifts, not stored as an immutable audit trail.
- **CSV/XLSX import** for bulk shift or employee upload.
- **Role-based permissions** (e.g. HR admin vs. read-only viewer).
- **Server-side validation** — all rule-checking currently happens
  client-side only.
- **Automated tests** (unit tests for `arbzg.js`, component tests) — none
  exist yet.
- **Real build verification**: this pass was checked by exhaustive static
  review — every import/export resolved and cross-checked, brace/paren
  balance verified per file, every CSS class used cross-referenced against
  `styles.css`, all 122 translation keys verified present and in sync in
  both languages, and every user-visible string scanned for leftover
  hardcoded English — but **not** by an actual `npm install && npm run
  build`, because this sandboxed environment has no network access to
  reach the npm registry. Please run the build once locally or let
  Netlify run it before presenting this to a buyer, and treat that as the
  final gate, not this document.

## Compliance note

The ArbZG engine implements core standard rules only (daily hours,
breaks, 11h rest). Collective agreements and sector-specific exceptions
are outside the current scope. This is an internal management support
tool — final validation of work schedules rests with the institution's
HR/Legal department.
