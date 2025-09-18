import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { createUserInputSchema, createUserOutputSchema } from "./users.schema";
import { createUserByAdmin } from "./users.service";

export async function createUserController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = createUserInputSchema.parse(req.body);
    const created = await createUserByAdmin(parsed);

    const payload = {
      id: created.id,
      email: created.email,
      roleId: created.roleId,
      name: created.name,
      createdAt: created.createdAt.toISOString(),
    };

    const validated = createUserOutputSchema.parse(payload);
    return res.status(201).json({ ok: true, data: validated });
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid request", issues: err.issues });
    }
    if (err instanceof PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res
          .status(409)
          .json({ ok: false, message: "Email already exists" });
      }
      if (err.code === "P2003") {
        return res.status(400).json({ ok: false, message: "Invalid roleId" });
      }
    }
    return next(err);
  }
}
