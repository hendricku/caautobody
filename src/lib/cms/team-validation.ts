import { z } from "zod";

export const adminEmailSchema = z.string().trim().toLowerCase().max(254).email();
export const addAdminSchema = z.object({ email: adminEmailSchema }).strict();
export const changeMemberSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["deactivate", "reactivate"]),
}).strict();
export const removeMemberSchema = z.object({ userId: z.string().uuid() }).strict();
export const startAdminLoginSchema = z.object({ email: adminEmailSchema }).strict();
export const verifyAdminLoginSchema = z.object({ email: adminEmailSchema, code: z.string().regex(/^\d{6}$/) }).strict();
