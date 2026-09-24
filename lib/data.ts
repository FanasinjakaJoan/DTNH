import { cleanName, normalizePhone } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import {
  COMMITTEES,
  type AttendanceResponse,
  type AttendanceRow,
  type CheckInInput,
  type CommitteeCode,
} from "@/lib/types";
import { EVENT, getMemoryAttendance, registerMemoryCheckIn } from "@/lib/store";

function validateInput(input: CheckInInput) {
  if (!input.firstName || !input.lastName || !input.phone) {
    throw new Error("Le prénom, le nom et le téléphone sont obligatoires.");
  }
  if (!input.committees.length) throw new Error("Choisissez au moins un comité.");
  if (input.committees.includes("parents") && !input.children?.length) {
    throw new Error("Un membre du comité des parents doit renseigner au moins un joueur.");
  }
  if (input.committees.includes("joueurs") && !input.parents?.length) {
    throw new Error("Un membre du comité des joueurs doit renseigner au moins un parent.");
  }
}

function splitPersonName(value: string) {
  const parts = cleanName(value).split(" ");
  const firstName = parts.shift() || value;
  return { firstName, lastName: parts.join(" ") || "À compléter" };
}

async function getEvent(supabase: NonNullable<ReturnType<typeof getSupabase>>) {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("event_date", EVENT.date)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return { id: data.id, name: data.name, date: data.event_date };

  const inserted = await supabase
    .from("events")
    .insert({ name: EVENT.name, event_date: EVENT.date, status: "open" })
    .select("id, name, event_date")
    .single();
  if (inserted.error) throw inserted.error;
  return { id: inserted.data.id, name: inserted.data.name, date: inserted.data.event_date };
}

async function committeeIds(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  codes: CommitteeCode[],
) {
  const result = await supabase.from("committees").select("id, code").in("code", codes);
  if (result.error) throw result.error;
  const byCode = new Map(result.data.map((item) => [item.code as CommitteeCode, item.id]));
  return codes.map((code) => {
    const id = byCode.get(code);
    if (!id) throw new Error(`Comité introuvable : ${code}`);
    return { code, id };
  });
}

async function findOrCreateMember(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  firstName: string,
  lastName: string,
  phone: string,
  email: string | null,
  committees: CommitteeCode[],
) {
  const normalizedPhone = normalizePhone(phone);
  const found = await supabase
    .from("members")
    .select("id, first_name, last_name, phone, email")
    .eq("first_name", cleanName(firstName))
    .eq("last_name", cleanName(lastName))
    .eq("phone", normalizedPhone)
    .limit(1)
    .maybeSingle();
  if (found.error) throw found.error;

  let member = found.data;
  if (!member) {
    const inserted = await supabase
      .from("members")
      .insert({
        first_name: cleanName(firstName),
        last_name: cleanName(lastName),
        phone: normalizedPhone,
        email,
      })
      .select("id, first_name, last_name, phone, email")
      .single();
    if (inserted.error) throw inserted.error;
    member = inserted.data;
  } else if (email && !member.email) {
    const updated = await supabase
      .from("members")
      .update({ email, updated_at: new Date().toISOString() })
      .eq("id", member.id)
      .select("id, first_name, last_name, phone, email")
      .single();
    if (updated.error) throw updated.error;
    member = updated.data;
  }

  const ids = await committeeIds(supabase, committees);
  const memberships = await supabase.from("member_committees").upsert(
    ids.map(({ id }) => ({ member_id: member!.id, committee_id: id })),
    { onConflict: "member_id,committee_id", ignoreDuplicates: true },
  );
  if (memberships.error) throw memberships.error;
  return member;
}

export async function registerCheckIn(input: CheckInInput) {
  validateInput(input);
  const supabase = getSupabase();
  if (!supabase) return registerMemoryCheckIn(input);

  const email = input.email?.trim().toLowerCase() || null;
  const member = await findOrCreateMember(
    supabase,
    input.firstName,
    input.lastName,
    input.phone,
    email,
    input.committees,
  );

  if (input.children?.length) {
    for (const child of input.children) {
      const names = splitPersonName(child);
      const player = await findOrCreateMember(supabase, names.firstName, names.lastName, input.phone, null, ["joueurs"]);
      const relation = await supabase
        .from("parent_player_links")
        .upsert({ parent_member_id: member.id, player_member_id: player.id }, { onConflict: "parent_member_id,player_member_id" });
      if (relation.error) throw relation.error;
    }
  }

  if (input.parents?.length) {
    for (const parentName of input.parents) {
      const names = splitPersonName(parentName);
      const parent = await findOrCreateMember(supabase, names.firstName, names.lastName, input.phone, null, ["parents"]);
      const relation = await supabase
        .from("parent_player_links")
        .upsert({ parent_member_id: parent.id, player_member_id: member.id }, { onConflict: "parent_member_id,player_member_id" });
      if (relation.error) throw relation.error;
    }
  }

  const event = await getEvent(supabase);
  const existing = await supabase
    .from("attendances")
    .select("id")
    .eq("event_id", event.id)
    .eq("member_id", member.id)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) return { alreadyPresent: true, memberName: `${member.first_name} ${member.last_name}` };
  const attendance = await supabase.from("attendances").insert({ event_id: event.id, member_id: member.id });
  if (attendance.error) throw attendance.error;
  return { alreadyPresent: false, memberName: `${member.first_name} ${member.last_name}` };
}

export async function getAttendance(committee?: CommitteeCode): Promise<AttendanceResponse> {
  const supabase = getSupabase();
  if (!supabase) return getMemoryAttendance(committee);

  const event = await getEvent(supabase);
  const attendanceResult = await supabase
    .from("attendances")
    .select("id, member_id, checked_in_at")
    .eq("event_id", event.id)
    .order("checked_in_at", { ascending: false });
  if (attendanceResult.error) throw attendanceResult.error;

  const memberIds = attendanceResult.data.map((item) => item.member_id);
  if (!memberIds.length) {
    return {
      event,
      rows: [],
      totals: Object.fromEntries(COMMITTEES.map(({ code }) => [code, 0])) as Record<CommitteeCode, number>,
      totalPresent: 0,
    };
  }

  const [membersResult, membershipsResult, linksResult] = await Promise.all([
    supabase.from("members").select("id, first_name, last_name, phone, email").in("id", memberIds),
    supabase.from("member_committees").select("member_id, committee_id").in("member_id", memberIds),
    supabase.from("parent_player_links").select("parent_member_id, player_member_id"),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (membershipsResult.error) throw membershipsResult.error;
  if (linksResult.error) throw linksResult.error;

  const committeeIdsUsed = Array.from(new Set(membershipsResult.data.map((item) => item.committee_id)));
  const committeesResult = await supabase.from("committees").select("id, code").in("id", committeeIdsUsed);
  if (committeesResult.error) throw committeesResult.error;
  const members = new Map(membersResult.data.map((item) => [item.id, item]));
  const committeeById = new Map(committeesResult.data.map((item) => [item.id, item.code as CommitteeCode]));
  const memberships = new Map<string, CommitteeCode[]>();
  for (const item of membershipsResult.data) {
    const code = committeeById.get(item.committee_id);
    if (!code) continue;
    memberships.set(item.member_id, [...(memberships.get(item.member_id) || []), code]);
  }
  const linkedPlayers = new Map<string, string[]>();
  const linkedParents = new Map<string, string[]>();
  for (const link of linksResult.data) {
    const player = members.get(link.player_member_id);
    const parent = members.get(link.parent_member_id);
    if (parent && player) {
      linkedPlayers.set(link.parent_member_id, [...(linkedPlayers.get(link.parent_member_id) || []), `${player.first_name} ${player.last_name}`]);
      linkedParents.set(link.player_member_id, [...(linkedParents.get(link.player_member_id) || []), `${parent.first_name} ${parent.last_name}`]);
    }
  }

  const rows = attendanceResult.data
    .map((attendance) => {
      const member = members.get(attendance.member_id);
      if (!member) return null;
      return {
        id: attendance.id,
        memberId: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        phone: member.phone,
        email: member.email,
        committees: memberships.get(member.id) || [],
        checkedInAt: attendance.checked_in_at,
        linkedPlayers: linkedPlayers.get(member.id) || [],
        linkedParents: linkedParents.get(member.id) || [],
      } satisfies AttendanceRow;
    })
    .filter((row): row is AttendanceRow => Boolean(row))
    .filter((row) => !committee || row.committees.includes(committee));

  const totals = Object.fromEntries(COMMITTEES.map(({ code }) => [code, 0])) as Record<CommitteeCode, number>;
  for (const row of rows) for (const code of row.committees) totals[code] += 1;
  return { event, rows, totals, totalPresent: rows.length };
}
