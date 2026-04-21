import type { SupabaseClient, User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Confusable characters (0, O, I, 1) removed so codes can be read aloud
// without ambiguity.
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_LENGTH = 6;

export type Profile = {
  id: string;
  householdId: string;
  role: "owner" | "member";
  email: string | null;
  name: string | null;
};

export type Household = {
  id: string;
  inviteCode: string;
  name: string | null;
};

export function generateInviteCode(): string {
  let out = "";
  for (let i = 0; i < INVITE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * INVITE_ALPHABET.length);
    out += INVITE_ALPHABET[idx];
  }
  return out;
}

function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** The pending invite code is stashed locally between signup and first
 *  sign-in so email-confirmation flows don't lose it. */
const PENDING_KEY = "homebase:pendingInviteCode";

export function setPendingInviteCode(code: string | null): void {
  if (typeof window === "undefined") return;
  if (code) {
    window.localStorage.setItem(PENDING_KEY, code);
  } else {
    window.localStorage.removeItem(PENDING_KEY);
  }
}

export function getPendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PENDING_KEY);
}

async function fetchProfile(
  client: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id, household_id, role, email, name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    householdId: data.household_id as string,
    role: data.role as "owner" | "member",
    email: (data.email as string | null) ?? null,
    name: (data.name as string | null) ?? null,
  };
}

async function fetchHouseholdByCode(
  client: SupabaseClient,
  code: string
): Promise<Household | null> {
  const { data, error } = await client
    .from("households")
    .select("id, invite_code, name")
    .eq("invite_code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    inviteCode: data.invite_code as string,
    name: (data.name as string | null) ?? null,
  };
}

async function createHousehold(client: SupabaseClient): Promise<Household> {
  // Generate + retry on the very unlikely invite-code collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    const id = nanoid();
    const { error } = await client.from("households").insert({
      id,
      invite_code: code,
      name: null,
    });
    if (!error) {
      return { id, inviteCode: code, name: null };
    }
    // Unique-violation on invite_code -> retry with a fresh code.
    if (!/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
  }
  throw new Error("Could not allocate a unique invite code after 5 attempts.");
}

async function createProfile(
  client: SupabaseClient,
  user: User,
  householdId: string,
  role: "owner" | "member"
): Promise<Profile> {
  const { error } = await client.from("profiles").insert({
    id: user.id,
    household_id: householdId,
    role,
    email: user.email ?? null,
    name: null,
  });
  if (error) throw new Error(error.message);
  return {
    id: user.id,
    householdId,
    role,
    email: user.email ?? null,
    name: null,
  };
}

/**
 * Idempotent: always returns a Profile for the user, creating a household
 * and profile on first call. If an invite code is pending or provided, the
 * user joins that household as a member instead of creating a new one.
 */
export async function bootstrapProfile(
  client: SupabaseClient,
  user: User,
  invite?: string | null
): Promise<Profile> {
  const existing = await fetchProfile(client, user.id);
  if (existing) {
    // Already bootstrapped; clear any leftover pending code.
    setPendingInviteCode(null);
    return existing;
  }

  const code = normalizeInviteCode(invite ?? getPendingInviteCode() ?? "");
  if (code) {
    const household = await fetchHouseholdByCode(client, code);
    if (!household) {
      throw new Error(
        `Invite code "${code}" not found. Double-check the code or ask your partner to share it again.`
      );
    }
    const profile = await createProfile(client, user, household.id, "member");
    setPendingInviteCode(null);
    return profile;
  }

  const household = await createHousehold(client);
  const profile = await createProfile(client, user, household.id, "owner");
  setPendingInviteCode(null);
  return profile;
}

export async function fetchHousehold(
  client: SupabaseClient,
  householdId: string
): Promise<Household | null> {
  const { data, error } = await client
    .from("households")
    .select("id, invite_code, name")
    .eq("id", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    inviteCode: data.invite_code as string,
    name: (data.name as string | null) ?? null,
  };
}

export async function rotateInviteCode(
  client: SupabaseClient,
  householdId: string
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    const { error } = await client
      .from("households")
      .update({ invite_code: code })
      .eq("id", householdId);
    if (!error) return code;
    if (!/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
  }
  throw new Error("Could not rotate the invite code — please try again.");
}
