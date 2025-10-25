import type { AnyZodObject, ZodTypeAny } from "zod";
import type { RequestHandler } from "express";

type SchemaShape = {
  body?: AnyZodObject | ZodTypeAny;
  query?: AnyZodObject | ZodTypeAny;
  params?: AnyZodObject | ZodTypeAny;
};

export function validate(schmea: SchemaShape): RequestHandler {
  return (req, res, next) => {
    try {
      const parsed = {
        body: schmea.body ? schmea.body.parse(req.body) : undefined,
        query: schmea.query ? schmea.query.parse(req.query) : undefined,
        params: schmea.params ? schmea.params.parse(req.params) : undefined,
      };

      res.locals.validated = parsed;
      next();
    } catch (err: any) {
      return res.status(400).json({
        error: "BAD_REQUEST",
        message: "Validation failed",
        details: err?.issues ?? String(err),
      });
    }
  };
}
