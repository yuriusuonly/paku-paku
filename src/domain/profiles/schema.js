import { z } from "zod";
import { emailSchema } from "../../shared/validation/email.js";
import { passwordSchema } from "../../shared/validation/password.js";

/**
 * Profile domain schemas shared by server validation and admin forms.
 * @module domain/profiles/schema
 */

/**
 * Admin create-user schema.
 * @type {import("zod").ZodType}
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});
