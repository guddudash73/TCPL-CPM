import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export function mapPrismaError(err: unknown): ApiError | null {
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: "BAD_REQUEST",
      message: "Validation failed",
      details: err.issues,
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return {
          status: 409,
          code: "UNIQUE_VIOLATION",
          message: "A Record with this unique field already exists.",
          details: err.meta,
        };
      case "P2003":
        return {
          status: 409,
          code: "FK_CONFLICT",
          message: "Related resource not found or conflicts with existing data",
          details: err.meta,
        };
      case "P2025":
        return {
          status: 404,
          code: "NOT_FOUND",
          message: "Resource not found.",
          details: err.meta,
        };
      default:
        return {
          status: 500,
          code: err.code,
          message: "Database error.",
          details: err.meta,
        };
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      status: 400,
      code: "BAD_REQUEST",
      message: "Invalid request payload.",
      details: String(err.message),
    };
  }

  return null;
}
