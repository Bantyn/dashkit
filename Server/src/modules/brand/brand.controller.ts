import { Request, Response } from "express";
import { RepositoryFactory } from "../../application/repositories/factories/repository.factory";

const getProductRepository = () => RepositoryFactory.getProductRepository();

export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId } = req.query;
    if (!shopId) {
      res.status(400).json({ success: false, message: "Shop ID required" });
      return;
    }

    const repo = await getProductRepository();
    const data = await repo.getBrandsByShop(shopId as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = await getProductRepository();
    const generatedId = repo.generateBrandId();
    const data = {
      ...req.body,
      id: generatedId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await repo.createBrand(data);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = await getProductRepository();
    await repo.updateBrand(req.params.id as string, req.body);
    res.status(200).json({ success: true, message: "Brand updated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = await getProductRepository();
    await repo.deleteBrand(req.params.id as string);
    res.status(200).json({ success: true, message: "Brand deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
