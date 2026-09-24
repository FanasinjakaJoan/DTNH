import crypto from "node:crypto";
import { cleanName, normalizePhone } from "@/lib/format";
import {
  COMMITTEES,
  type AttendanceResponse,
  type AttendanceRow,
  type CheckInInput,
  type CommitteeCode,
} from "@/lib/types";

const EVENT = {
  id: "ag-2026",
  name: "Assemblée Générale 2026",
  date: "2026-09-26",
};

type MemoryMember = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  committees: Set<CommitteeCode>;
};

type MemoryAttendance = {
  id: string;
  memberId: string;
  checkedInAt: string;
};

type MemoryStore = {
  members: Map<string, MemoryMember>;
  links: Set<string>;
  attendances: Map<string, MemoryAttendance>;
};

declare global {
  // eslint-disable-next-line no-var
  var dtnhMemoryStore: MemoryStore | undefined;
}

function getStore(): MemoryStore {
  if (!globalThis.dtnhMemoryStore) {
    globalThis.dtnhMemoryStore = {
      members: new Map(),
      links: new Set(),
      attendances: new Map(),
    };
  }
  return globalThis.dtnhMemoryStore;
}

function memberKey(firstName: string, lastName: string, phone: string) {
  return `${cleanName(firstName).toLocaleLowerCase()}|${cleanName(lastName).toLocaleLowerCase()}|${normalizePhone(phone)}`;
}

function findMember(store: MemoryStore, firstName: string, lastName: string, phone: string) {
  const key = memberKey(firstName, lastName, phone);
  return Array.from(store.members.values()).find(
    (member) => memberKey(member.firstName, member.lastName, member.phone) === key,
  );
}

function upsertMember(
  store: MemoryStore,
  firstName: string,
  lastName: string,
  phone: string,
  email: string | null,
  committees: CommitteeCode[],
) {
  const existing = findMember(store, firstName, lastName, phone);
  if (existing) {
    committees.forEach((committee) => existing.committees.add(committee));
    if (email) existing.email = email;
    return existing;
  }

  const member: MemoryMember = {
    id: crypto.randomUUID(),
    firstName: cleanName(firstName),
    lastName: cleanName(lastName),
    phone: normalizePhone(phone),
    email,
    committees: new Set(committees),
  };
  store.members.set(member.id, member);
  return member;
}

function link(store: MemoryStore, parentId: string, playerId: string) {
  if (parentId !== playerId) store.links.add(`${parentId}:${playerId}`);
}

function linkedIds(store: MemoryStore, memberId: string, side: "parent" | "player") {
  return Array.from(store.links)
    .map((value) => value.split(":"))
    .filter(([parentId, playerId]) => (side === "parent" ? parentId === memberId : playerId === memberId))
    .map(([parentId, playerId]) => (side === "parent" ? playerId : parentId));
}

function validateInput(input: CheckInInput) {
  if (!input.firstName || !input.lastName || !input.phone) {
    throw new Error("Le prénom, le nom et le téléphone sont obligatoires.");
  }
  if (!input.committees.length) {
    throw new Error("Choisissez au moins un comité.");
  }
  if (input.committees.includes("parents") && !input.children?.length) {
    throw new Error("Un membre du comité des parents doit renseigner au moins un joueur.");
  }
  if (input.committees.includes("joueurs") && !input.parents?.length) {
    throw new Error("Un membre du comité des joueurs doit renseigner au moins un parent.");
  }
}

export function registerMemoryCheckIn(input: CheckInInput) {
  validateInput(input);
  const store = getStore();
  const member = upsertMember(
    store,
    input.firstName,
    input.lastName,
    normalizePhone(input.phone),
    input.email?.trim().toLowerCase() || null,
    input.committees,
  );

  input.children?.forEach((childName) => {
    const parts = cleanName(childName).split(" ");
    const firstName = parts.shift() || childName;
    const lastName = parts.join(" ") || "À compléter";
    const player = upsertMember(store, firstName, lastName, member.phone, null, ["joueurs"]);
    link(store, member.id, player.id);
  });

  input.parents?.forEach((parentName) => {
    const parts = cleanName(parentName).split(" ");
    const firstName = parts.shift() || parentName;
    const lastName = parts.join(" ") || "À compléter";
    const parent = upsertMember(store, firstName, lastName, member.phone, null, ["parents"]);
    link(store, parent.id, member.id);
  });

  const attendanceKey = `${EVENT.id}:${member.id}`;
  const alreadyPresent = store.attendances.has(attendanceKey);
  if (!alreadyPresent) {
    store.attendances.set(attendanceKey, {
      id: crypto.randomUUID(),
      memberId: member.id,
      checkedInAt: new Date().toISOString(),
    });
  }

  return { alreadyPresent, memberName: `${member.firstName} ${member.lastName}` };
}

export function getMemoryAttendance(committee?: CommitteeCode): AttendanceResponse {
  const store = getStore();
  const rows: AttendanceRow[] = Array.from(store.attendances.values())
    .map((attendance) => {
      const member = store.members.get(attendance.memberId);
      if (!member) return null;
      const linkedPlayerIds = linkedIds(store, member.id, "parent");
      const linkedParentIds = linkedIds(store, member.id, "player");
      const linkedPlayers = linkedPlayerIds
        .map((id) => store.members.get(id))
        .filter(Boolean)
        .map((item) => `${item!.firstName} ${item!.lastName}`);
      const linkedParents = linkedParentIds
        .map((id) => store.members.get(id))
        .filter(Boolean)
        .map((item) => `${item!.firstName} ${item!.lastName}`);
      return {
        id: attendance.id,
        memberId: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        committees: Array.from(member.committees),
        checkedInAt: attendance.checkedInAt,
        linkedPlayers,
        linkedParents,
      } satisfies AttendanceRow;
    })
    .filter((row): row is AttendanceRow => Boolean(row))
    .filter((row) => !committee || row.committees.includes(committee))
    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));

  const totals = Object.fromEntries(COMMITTEES.map(({ code }) => [code, 0])) as Record<CommitteeCode, number>;
  for (const row of rows) {
    for (const code of row.committees) totals[code] += 1;
  }

  return { event: EVENT, rows, totals, totalPresent: rows.length };
}

export { EVENT };
