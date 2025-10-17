import { Prisma } from "@prisma/client";

export type ApiError = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
};

export function mapPrismaError(err: unknown): ApiError | null {
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
  return null;
}
