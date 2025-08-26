import { Faq } from "@/models";
import { errorResponse, successResponse } from "@/helpers/respose.helper";
import { AuthenticatedRequest } from "@/types/auth";
import { Response, NextFunction } from "express";
import { Op } from "sequelize";

export const getAllFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = parseInt(req.query.limit as string) || undefined;
    const offset = parseInt(req.query.offset as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const where: any = {};
    if (search) where.question = { [Op.like]: `%${search}%` };
    if (status) where.status = status;
    const { rows: data, count } = await Faq.findAndCountAll({
      where,
      limit,
      offset,
    });
    return successResponse(res, "Berhasil mengambil data faq", data, {
      limit,
      offset,
      count,
      totalPages: limit ? Math.ceil(count / limit) : 1,
    });
  } catch (error: unknown) {
    next(error);
  }
};

export const getFaqById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Faq.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    return successResponse(res, "Berhasil mengambil data faq", data);
  } catch (error: unknown) {
    next(error);
  }
};

export const createFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, answer } = req.body;
    const data = await Faq.create({
      question,
      answer,
    });
    return successResponse(res, "Berhasil menambahkan data faq", data);
  } catch (error: unknown) {
    console.log(error);

    next(error);
  }
};

export const updateFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { question, answer } = req.body;
    const { id } = req.params;
    const data = await Faq.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (data.status === "PUBLISH") {
      return errorResponse(res, "Data tidak dapat diubah", null, 403);
    }
    if (question) data.question = question;
    if (answer) data.answer = answer;
    await data.save();
    return successResponse(res, "Berhasil mengubah data faq");
  } catch (error: unknown) {
    next(error);
  }
};

export const deleteFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Faq.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (data.status === "PUBLISH") {
      return errorResponse(res, "Data tidak dapat dihapus", null, 403);
    }
    await data.destroy();
    return successResponse(res, "Berhasil menghapus data faq");
  } catch (error: unknown) {
    next(error);
  }
};

export const publishFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Faq.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (data.status === "PUBLISH") {
      return errorResponse(res, "Data sudah dipublish", null, 403);
    }
    data.status = "PUBLISH";
    await data.save();
    return successResponse(res, "Berhasil publish data faq");
  } catch (error: unknown) {
    next(error);
  }
};

export const draftFaq = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = await Faq.findByPk(id);
    if (!data) {
      return errorResponse(res, "Data tidak ditemukan", null, 404);
    }
    if (data.status === "DRAFT") {
      return errorResponse(res, "Data sudah dalam status draft", null, 403);
    }
    data.status = "DRAFT";
    await data.save();
    return successResponse(res, "Berhasil mengubah status faq menjadi draft");
  } catch (error: unknown) {
    next(error);
  }
};
