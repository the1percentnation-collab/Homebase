// Default single-user id used while auth is not yet wired up.
// All writes attribute to this id; migration to real users happens when the
// household settings module lands.
export const DEFAULT_USER_ID = "owner";

// Lightweight stand-in for household members. Two-person setup (you + wife);
// wire up a real user module later and these ids will carry over.
export const ASSIGNEES = [
  { id: "owner", label: "Me", initials: "M", color: "bg-blue-500" },
  { id: "partner", label: "Partner", initials: "P", color: "bg-violet-500" },
] as const;

export type AssigneeId = (typeof ASSIGNEES)[number]["id"];

export function getAssignee(id: string | undefined) {
  if (!id) return undefined;
  return ASSIGNEES.find((a) => a.id === id);
}
