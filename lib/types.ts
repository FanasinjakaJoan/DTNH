export const COMMITTEES = [
  { code: "administratif", label: "Comité administratif", shortLabel: "Administratif" },
  { code: "parents", label: "Comité des parents", shortLabel: "Parents" },
  { code: "joueurs", label: "Comité des joueurs", shortLabel: "Joueurs" },
  { code: "technique", label: "Comité technique / coachs", shortLabel: "Technique" },
] as const;

export type CommitteeCode = (typeof COMMITTEES)[number]["code"];

export type CheckInInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  committees: CommitteeCode[];
  children?: string[];
  parents?: string[];
};

export type AttendanceRow = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  committees: CommitteeCode[];
  checkedInAt: string;
  linkedPlayers: string[];
  linkedParents: string[];
};

export type AttendanceResponse = {
  event: {
    id: string;
    name: string;
    date: string;
  };
  rows: AttendanceRow[];
  totals: Record<CommitteeCode, number>;
  totalPresent: number;
};
