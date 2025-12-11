import { Pagination } from "../../types/domain/get-all-domains/get-all-domains.types";

export const calculatePagination = (
  page: number,
  limit: number,
  total: number
): Pagination => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const getPaginationOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};