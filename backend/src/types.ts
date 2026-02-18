import z from "zod";
import { getMultipleModelsSchema } from "./generalValidationSchemas";


type GetAllPagedQuery = z.infer<typeof getMultipleModelsSchema.shape.query>;

type BaseModelTimestamps = {
    createdAt: Date;
    editedAt: Date;
    deletedAt: Date | null;
};

type Pagination = {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItemCount: number;
};

type ApiRespSingle<T> = {
    item: T;
    message?: string;
};

type ApiRespMulti<T> = {
    items: T[];
    message?: string;
};

type ApiRespMultiPaginated<T> = ApiRespMulti<T> & {
    pagination: Pagination;
};


export {
    GetAllPagedQuery,
    BaseModelTimestamps,
    Pagination,
    ApiRespSingle,
    ApiRespMulti,
    ApiRespMultiPaginated,
};
