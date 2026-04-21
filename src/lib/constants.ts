// Default single-user id used while auth is not yet wired up.
// All writes attribute to this id; migration to real users happens when the
// household settings module lands.
export const DEFAULT_USER_ID = "owner";
