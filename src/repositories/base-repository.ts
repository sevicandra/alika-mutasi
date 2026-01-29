import {
  Attributes,
  CountOptions,
  CreateOptions,
  CreationAttributes,
  DestroyOptions,
  FindOptions,
  Identifier,
  Model,
  ModelStatic,
  Transaction,
  UpdateOptions,
} from "sequelize";
import { Col, Fn, Literal } from "sequelize/types/utils";
import { NotFoundError } from "@/utils/errors";
import { handleSequelizeError } from "@/utils/errors/sequelize-error-handler";

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

export abstract class BaseRepository<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findAll(options?: FindOptions<T>): Promise<T[]> {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async findAllWithPagination(options?: FindOptions<T>): Promise<PaginatedResult<T>> {
    try {
      const { count, rows } = await this.model.findAndCountAll(options);

      const limit = options?.limit || count;
      const offset = options?.offset || 0;

      return {
        items: rows,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          offset: offset,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async findById(id: Identifier, options?: Omit<FindOptions<T>, "where">): Promise<T | null> {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async findOne(options: FindOptions<T>): Promise<T | null> {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async create(data: CreationAttributes<T>, options?: CreateOptions<T>): Promise<T> {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async createBulk(data: CreationAttributes<T>[], options?: CreateOptions<T>): Promise<T[]> {
    try {
      return await this.model.bulkCreate(data, options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async update(
    data: {
      [key in keyof Attributes<T>]?: Attributes<T>[key] | Fn | Col | Literal;
    },
    options: UpdateOptions<T>
  ): Promise<number> {
    try {
      const [affectedCount] = await this.model.update(data, options);
      return affectedCount;
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async updateOne(
    options: FindOptions<T>,
    values: {
      [key in keyof Attributes<T>]?: Attributes<T>[key] | Fn | Col | Literal;
    },
    t: Transaction
  ): Promise<T> {
    try {
      const data = await this.model.findOne(options);
      if (!data) {
        throw new NotFoundError(`Data not found`);
      }
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          (data as any)[key] = value;
        }
      });
      await data.save({ transaction: t });
      await data.reload({ transaction: t });
      return data;
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async updateById(
    id: Identifier,
    values: {
      [key in keyof Attributes<T>]?: Attributes<T>[key] | Fn | Col | Literal;
    },
    t?: Transaction
  ): Promise<T> {
    try {
      const data = await this.findById(id, {
        transaction: t,
      });
      if (!data) {
        throw new NotFoundError(`Data with ID ${id} not found`);
      }
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          (data as any)[key] = value;
        }
      });
      await data.save({ transaction: t });
      await data.reload({ transaction: t });
      return data;
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async delete(options: DestroyOptions<T>, t: Transaction): Promise<number> {
    try {
      return this.model.destroy({ ...options, transaction: t });
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async deleteOne(options: FindOptions<T>, t: Transaction): Promise<number> {
    try {
      const data = await this.findOne(options);
      if (!data) {
        throw new NotFoundError(`Data with not found`);
      }
      await data.destroy({ transaction: t });
      return 1;
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async deleteById(id: Identifier, t: Transaction): Promise<number> {
    try {
      return this.model.destroy({ transaction: t, where: { id } as any });
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async count(options?: CountOptions<T>): Promise<number> {
    try {
      return await this.model.count(options);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }

  async CreateOrUpdate(data: CreationAttributes<T>, t: Transaction) {
    try {
      return await this.model.upsert(data, { transaction: t });
    } catch (error) {
      throw handleSequelizeError(error);
    }
  }
}
