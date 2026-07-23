import { Request, Response } from "express";
import { asyncHandler, sendSuccess, sendError } from "../../shared/utils/response";
import { productService } from "./product.service";

export const createProduct = asyncHandler(async (req: any, res: Response) => {
  const product = await productService.createProduct({ ...req.body, branchId: req.branchId });
  return sendSuccess(res, product, "Product created");
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const shopId = (req as any).user?.shopId || req.params?.shopId || req.query?.shopId;
  if (!shopId) return sendError(res, "Shop context not found", 404);
  const products = await productService.getProductsByShop(String(shopId), (req as any).branchId);
  return sendSuccess(res, products, "Products fetched");
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProduct(String(req.params.id));
  if (!product) return sendError(res, "Product not found", 404);
  return sendSuccess(res, product, "Product fetched");
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.updateProduct(String(req.params.id), req.body);
  return sendSuccess(res, null, "Product updated");
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(String(req.params.id));
  return sendSuccess(res, null, "Product deleted");
});

export const deleteAllProducts = asyncHandler(async (req: any, res: Response) => {
  const result = await productService.deleteAllProducts(String(req.params.shopId), req.branchId);
  return sendSuccess(res, result, "All products deleted successfully");
});

export const getProductsByShop = asyncHandler(async (req: any, res: Response) => {
  const products = await productService.getProductsByShop(String(req.params.shopId), req.branchId);
  return sendSuccess(res, products, "Shop products fetched");
});

export const getProductByBarcode = asyncHandler(async (req: Request, res: Response) => {
  const foundProduct = await productService.getProductByBarcode(
    String(req.params.shopId),
    String(req.params.barcode),
  );

  if (!foundProduct) {
    return sendError(res, "Product not found", 404);
  }

  return sendSuccess(res, foundProduct, "Product found by barcode");
});

export const bulkImportProducts = asyncHandler(async (req: Request, res: Response) => {
  const { shopId, products: rawProducts } = req.body;

  if (!shopId || !Array.isArray(rawProducts)) {
    return sendError(res, "Invalid request data", 400);
  }

  const result = await productService.bulkImportProducts(
    String(shopId),
    rawProducts,
    req.body.staffId,
    (req as any).branchId
  );

  return sendSuccess(res, result, "Bulk import completed");
});

export const incrementViewCount = asyncHandler(async (req: Request, res: Response) => {
  await productService.incrementViewCount(String(req.params.id));
  return sendSuccess(res, null, "Product view count incremented");
});
