import { Request, Response } from "express";
import { Op } from "sequelize";
import { asyncHandler } from "@/middlewares/async-handler.middleware";
import { InvalidRequestError, NotFoundError, InternalServerError } from "@/utils/errors";
import { successResponse } from "@/helpers/respose.helper";
import { sortBuilder } from "@/helpers/sequelizer.helper";
import { Faq } from "@/repositories";

export const FaqControllerV2 = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const sort = req.query.sort as string;
    const order = sortBuilder(sort);
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const where: any = {};
    if (search) where.question = { [Op.like]: `%${search}%` };
    if (status) where.status = status;

    const { items: data, pagination } = await Faq.findAllWithPagination({
      limit,
      offset,
      order,
      where,
    });

    successResponse(res, "Success get all FAQ", data, pagination);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new InvalidRequestError("Invalid request");
    }

    const data = await Faq.findById(id);
    if (!data) {
      throw new NotFoundError("Data not found");
    }

    successResponse(res, "Success get FAQ", data);
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    const { question, answer } = req.body;
    const data = await Faq.create({
      question,
      answer,
    });
    successResponse(res, "Success create FAQ", data);
  }),
  update: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { question, answer } = req.body;
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      const data = await Faq.updateOne(
        {
          where: {
            id: id,
          },
        },
        {
          question,
          answer,
        },
        t
      );
      successResponse(res, "Success update FAQ", data);
    },
    {
      useTransaction: true,
    }
  ),
  delete: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await Faq.deleteOne(
        {
          where: {
            id: id,
          },
        },
        t
      );
      successResponse(res, "Success delete FAQ", data);
    },
    {
      useTransaction: true,
    }
  ),
  publish: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await Faq.publish(id, t);
      successResponse(res, "Success publish FAQ", data);
    },
    {
      useTransaction: true,
    }
  ),
  draft: asyncHandler(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const t = req.transaction;
      if (!t) {
        throw new InternalServerError("Transaction not found");
      }
      if (typeof id !== "string") {
        throw new InvalidRequestError("Invalid request");
      }
      const data = await Faq.unPublish(id, t);
      successResponse(res, "Success unpublish FAQ", data);
    },
    {
      useTransaction: true,
    }
  ),
};
