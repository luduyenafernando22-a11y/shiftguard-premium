import { supabase } from "./supabase";

const OFFLINE_PREFIX = "shiftguard-offline:";

function readOffline(key, fallback) {
  try {
    const value = localStorage.getItem(`${OFFLINE_PREFIX}${key}`);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeOffline(key, value) {
  try { localStorage.setItem(`${OFFLINE_PREFIX}${key}`, JSON.stringify(value)); } catch { /* storage is optional */ }
}

export function mapEmployeeRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    employeeId: row.employee_code,
    fullName: row.full_name,
    profession: row.profession,
    customProfession: row.custom_profession || "",
    department: row.department || "",
    contractedHours: Number(row.contracted_hours) || 0,
    status: row.status,
    avatarDataUrl: row.avatar_url || null
  };
}

export function mapShiftRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    employeeId: row.employee_id,
    employee: row.employees?.full_name || "",
    date: row.shift_date,
    start: String(row.start_time).slice(0, 5),
    end: String(row.end_time).slice(0, 5),
    breakMinutes: row.break_minutes
  };
}

export async function fetchOrganizationData(organizationId) {
  if (!supabase || !organizationId) return { employees: [], shifts: [] };
  try {
    const [{ data: employeeRows, error: employeeError }, { data: shiftRows, error: shiftError }] = await Promise.all([
      supabase.from("employees").select("*").eq("organization_id", organizationId).order("full_name"),
      supabase.from("shifts").select("*, employees(full_name)").eq("organization_id", organizationId).order("shift_date", { ascending: true })
    ]);
    if (employeeError) throw employeeError;
    if (shiftError) throw shiftError;
    const result = { employees: (employeeRows || []).map(mapEmployeeRow), shifts: (shiftRows || []).map(mapShiftRow) };
    writeOffline(`organization:${organizationId}:data`, result);
    return result;
  } catch (error) {
    const cached = readOffline(`organization:${organizationId}:data`, null);
    if (cached) return cached;
    throw error;
  }
}

export async function insertEmployee(employee, organizationId) {
  const { data, error } = await supabase.from("employees").insert({
    organization_id: organizationId,
    employee_code: employee.employeeId,
    full_name: employee.fullName,
    profession: employee.profession,
    custom_profession: employee.customProfession || "",
    department: employee.department || "",
    contracted_hours: employee.contractedHours,
    status: employee.status,
    avatar_url: employee.avatarDataUrl || null
  }).select().single();
  if (error) throw error;
  return mapEmployeeRow(data);
}

export async function updateEmployee(employee, organizationId) {
  const { data, error } = await supabase.from("employees").update({
    employee_code: employee.employeeId,
    full_name: employee.fullName,
    profession: employee.profession,
    custom_profession: employee.customProfession || "",
    department: employee.department || "",
    contracted_hours: employee.contractedHours,
    status: employee.status,
    avatar_url: employee.avatarDataUrl || null
  }).eq("id", employee.id).eq("organization_id", organizationId).select().single();
  if (error) throw error;
  return mapEmployeeRow(data);
}

export async function removeEmployee(id, organizationId) {
  const { error } = await supabase.from("employees").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) throw error;
}

export async function insertShift(shift, organizationId, userId) {
  const { data, error } = await supabase.from("shifts").insert({
    organization_id: organizationId,
    employee_id: shift.employeeId,
    shift_date: shift.date,
    start_time: shift.start,
    end_time: shift.end,
    break_minutes: Number(shift.breakMinutes) || 0,
    created_by: userId
  }).select("*, employees(full_name)").single();
  if (error) throw error;
  return mapShiftRow(data);
}

export async function updateShift(shift, organizationId) {
  const { data, error } = await supabase.from("shifts").update({
    employee_id: shift.employeeId,
    shift_date: shift.date,
    start_time: shift.start,
    end_time: shift.end,
    break_minutes: Number(shift.breakMinutes) || 0
  }).eq("id", shift.id).eq("organization_id", organizationId).select("*, employees(full_name)").single();
  if (error) throw error;
  return mapShiftRow(data);
}

export async function removeShift(id, organizationId) {
  const { error } = await supabase.from("shifts").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) throw error;
}


export async function fetchOrganizationMembers(organizationId) {
  const { data, error } = await supabase.from("profiles").select("id, organization_id, full_name, email, role, employee_id, created_at").eq("organization_id", organizationId).order("full_name");
  if (error) throw error;
  return data || [];
}

export async function updateMemberRole(id, role, organizationId) {
  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", id).eq("organization_id", organizationId).select("id, organization_id, full_name, email, role, employee_id, created_at").single();
  if (error) throw error;
  return data;
}

export function mapRulesRow(row) {
  if (!row) return null;
  return {
    standardDailyHours: Number(row.standard_daily_hours),
    maximumDailyHours: Number(row.maximum_daily_hours),
    breakThresholdHours: Number(row.break_threshold_hours),
    breakThresholdLongHours: Number(row.break_threshold_long_hours),
    breakMinutesStandard: Number(row.break_minutes_standard),
    breakMinutesLong: Number(row.break_minutes_long),
    minimumRestHours: Number(row.minimum_rest_hours)
  };
}

export async function fetchOrganizationRules(organizationId) {
  try {
    const { data, error } = await supabase.from("organization_rules").select("*").eq("organization_id", organizationId).single();
    if (error && error.code !== "PGRST116") throw error;
    const rules = mapRulesRow(data);
    if (rules) writeOffline(`organization:${organizationId}:rules`, rules);
    return rules;
  } catch (error) {
    const cached = readOffline(`organization:${organizationId}:rules`, null);
    if (cached) return cached;
    throw error;
  }
}

export async function updateOrganizationRules(rules, organizationId, userId) {
  const payload = {
    organization_id: organizationId,
    standard_daily_hours: rules.standardDailyHours,
    maximum_daily_hours: rules.maximumDailyHours,
    break_threshold_hours: rules.breakThresholdHours,
    break_threshold_long_hours: rules.breakThresholdLongHours,
    break_minutes_standard: rules.breakMinutesStandard,
    break_minutes_long: rules.breakMinutesLong,
    minimum_rest_hours: rules.minimumRestHours,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("organization_rules").upsert(payload).select().single();
  if (error) throw error;
  return mapRulesRow(data);
}

export async function fetchAuditLogs(organizationId) {
  try {
    const { data, error } = await supabase.from("audit_logs").select("id, organization_id, actor_id, action, entity_type, entity_id, before_data, after_data, created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    const logs = data || [];
    writeOffline(`organization:${organizationId}:audit`, logs);
    return logs;
  } catch (error) {
    const cached = readOffline(`organization:${organizationId}:audit`, null);
    if (cached) return cached;
    throw error;
  }
}


const ATTENDANCE_QUEUE_KEY = "shiftguard-attendance-queue";

function readAttendanceQueue() {
  return readOffline("attendance-queue", []);
}

function writeAttendanceQueue(queue) {
  writeOffline("attendance-queue", queue);
}

export function mapAttendanceRow(row) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    type: row.type,
    timestamp: row.timestamp,
    locationCoords: row.location_coords || null,
    isOfflineSync: Boolean(row.is_offline_sync),
    verifiedAt: row.verified_at || null
  };
}

export async function fetchAttendanceLogs(organizationId, userId, canMonitor = false) {
  let query = supabase.from("attendance_logs").select("*").eq("organization_id", organizationId).order("timestamp", { ascending: false }).limit(500);
  if (!canMonitor) query = query.eq("user_id", userId);
  const { data, error } = await query;
  if (error) throw error;
  const logs = (data || []).map(mapAttendanceRow);
  writeOffline(`organization:${organizationId}:attendance:${canMonitor ? "all" : userId}`, logs);
  return logs;
}

export async function getCachedAttendanceLogs(organizationId, userId, canMonitor = false) {
  return readOffline(`organization:${organizationId}:attendance:${canMonitor ? "all" : userId}`, []);
}

export async function insertAttendanceLog(payload, allowQueue = true) {
  try {
    const { data, error } = await supabase.from("attendance_logs").insert(payload).select().single();
    if (error) throw error;
    return { queued: false, log: mapAttendanceRow(data) };
  } catch (error) {
    const networkFailure = typeof navigator !== "undefined" && (!navigator.onLine || /network|fetch|failed to fetch|offline/i.test(error?.message || ""));
    if (!allowQueue || !networkFailure) throw error;
    const queue = readAttendanceQueue();
    const queuedItem = { ...payload, id: crypto.randomUUID(), queuedAt: new Date().toISOString() };
    writeAttendanceQueue([...queue, queuedItem]);
    return { queued: true, log: mapAttendanceRow({ ...queuedItem, timestamp: queuedItem.timestamp || new Date().toISOString(), is_offline_sync: true }) };
  }
}

export async function flushAttendanceQueue() {
  const queue = readAttendanceQueue();
  if (!queue.length || !supabase) return { synced: 0 };
  const remaining = [];
  let synced = 0;
  for (const item of queue) {
    try {
      const { id: _localId, queuedAt: _queuedAt, ...attendancePayload } = item;
      const { error } = await supabase.from("attendance_logs").insert({ ...attendancePayload, is_offline_sync: true }).select().single();
      if (error) throw error;
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeAttendanceQueue(remaining);
  return { synced };
}

export function subscribeToAttendance(organizationId, callback) {
  if (!supabase) return () => {};
  const channel = supabase.channel(`attendance:${organizationId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "attendance_logs", filter: `organization_id=eq.${organizationId}` }, callback)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
