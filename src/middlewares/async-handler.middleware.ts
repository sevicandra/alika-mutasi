import { NextFunction, Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from "@/models";

interface AsyncHandlerOptions {
  useTransaction?: boolean;
}

type RouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: RouteHandler, options: AsyncHandlerOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { useTransaction = false } = options;

    let t: Transaction | undefined;

    try {
      if (useTransaction) {
        t = await sequelize.transaction();
        req.transaction = t;
      }

      await fn(req, res, next);

      if (t) {
        await t.commit();
      }
    } catch (error) {
      if (t) {
        await t.rollback();
      }
      next(error);
    }
  };
};
