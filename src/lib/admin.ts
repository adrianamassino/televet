import { HttpError, userFromRequest } from "./supabase";
/** Televet staff = signed-in users whose e-mail is listed in ADMIN_EMAILS. */
export async function requireStaff(req: Request) {
  const user = await userFromRequest(req);
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!user || !admins.includes((user.email ?? "").toLowerCase())) throw new HttpError(403, "forbidden");
  return user;
}
