import { z } from "zod";

export const adminEmailSchema = z.string().trim().toLowerCase().max(254).email();
export const moduleSchema = z.enum(["blogs", "services", "brands", "offers", "areas", "gallery", "faq", "contacts", "settings"]);
const modulesSchema = z.array(moduleSchema).min(1).max(9).refine((values) => new Set(values).size === values.length);
export const addAdminSchema = z.object({ email: adminEmailSchema, modules: modulesSchema.optional() }).strict();
export const updateModulesSchema = z.object({ userId: z.string().uuid(), modules: modulesSchema.nullable() }).strict();
export const changeMemberSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["deactivate", "reactivate"]),
}).strict();
export const removeMemberSchema = z.object({ userId: z.string().uuid() }).strict();
export const startAdminLoginSchema = z.object({ email: adminEmailSchema }).strict();
export const verifyAdminLoginSchema = z.object({ email: adminEmailSchema, code: z.string().regex(/^\d{6}$/) }).strict();
