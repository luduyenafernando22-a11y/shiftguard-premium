import { supabase } from "./supabase";

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
  const [{ data: employeeRows, error: employeeError }, { data: shiftRows, error: shiftError }] = await Promise.all([
    supabase.from("employees").select("*").eq("organization_id", organizationId).order("full_name"),
    supabase.from("shifts").select("*, employees(full_name)").eq("organization_id", organizationId).order("shift_date", { ascending: true })
  ]);
  if (employeeError) throw employeeError;
  if (shiftError) throw shiftError;
  return {
    employees: (employeeRows || []).map(mapEmployeeRow),
    shifts: (shiftRows || []).map(mapShiftRow)
  };
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
