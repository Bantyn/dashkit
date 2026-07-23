import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { Category } from "./category.model";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

const getProductRepository = () => RepositoryFactory.getProductRepository();

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const repo = await getProductRepository();
  const generatedId = repo.generateCategoryId();
  const category: Category = {
    ...req.body,
    id: generatedId,
    isActive: req.body.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await repo.createCategory(category);
  return sendSuccess(res, category, "Category created");
});

export const getCategoriesByShop = asyncHandler(async (req: Request, res: Response) => {
  const repo = await getProductRepository();
  const data = await repo.getCategoriesByShop(String(req.params.shopId));
  return sendSuccess(res, data, "Shop categories fetched");
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const repo = await getProductRepository();
  const data = await repo.getCategory(String(req.params.id));
  if (!data) return sendError(res, "Category not found", 404);
  return sendSuccess(res, data, "Category fetched");
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const repo = await getProductRepository();
  await repo.updateCategory(String(req.params.id), req.body);
  return sendSuccess(res, null, "Category updated");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const repo = await getProductRepository();
  await repo.deleteCategory(String(req.params.id));
  return sendSuccess(res, null, "Category deleted");
});
