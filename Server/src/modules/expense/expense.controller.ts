import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { expenseService } from "./expense.service";

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const expenses = await expenseService.getExpenses(shopId);
  return sendSuccess(res, expenses, "Expenses fetched");
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const expense = await expenseService.createExpense({ ...req.body, shopId });
  return sendSuccess(res, expense, "Expense created", 201);
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  await expenseService.updateExpense(String(req.params.id), req.body);
  return sendSuccess(res, null, "Expense updated");
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  await expenseService.deleteExpense(String(req.params.id));
  return sendSuccess(res, null, "Expense deleted");
});

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const categories = await expenseService.getCategories(shopId);
  return sendSuccess(res, categories, "Categories fetched");
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const shopId = String(req.params.shopId);
  const { name, description } = req.body;
  const cat = await expenseService.createCategory(shopId, name, description);
  return sendSuccess(res, cat, "Category created", 201);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await expenseService.deleteCategory(String(req.params.id));
  return sendSuccess(res, null, "Category deleted");
});
