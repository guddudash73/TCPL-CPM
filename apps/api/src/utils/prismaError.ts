import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export function mapPrismaError(err: unknown): ApiError | null {
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return {
          status: 409,
          code: "CONFLICT",
          message: "Resource already exists",
          details: err.meta,
        };
      case "P2003":
        return {
          status: 400,
          code: "BAD_RELATION",
          message: "Invalid relation reference.",
          details: err.meta,
        };
      case "2025":
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
  return null;
}
