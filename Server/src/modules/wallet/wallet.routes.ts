import { Router } from "express";
import {
  createCreditPack,
  updateCreditPack,
  getCreditPacks,
  deleteCreditPack,
  getShopWallet,
  getTransactions,
  createWalletOrder,
  verifyWalletPayment
} from "./wallet.controller";
import { checkPermission } from "../../middlewares/role.middleware";

const router = Router();

// Admin / Platform API for Packs
router.post("/packs", checkPermission("platform.settings"), createCreditPack);
router.put("/packs/:id", checkPermission("platform.settings"), updateCreditPack);
router.get("/packs", getCreditPacks); // shops need to view packs too
router.delete("/packs/:id", checkPermission("platform.settings"), deleteCreditPack);

// Shop API for Wallet
router.get("/shop/:shopId", checkPermission("marketing.campaigns"), getShopWallet);
router.get("/shop/:shopId/transactions", checkPermission("marketing.campaigns"), getTransactions);
router.post("/shop/:shopId/purchase/create-order", checkPermission("marketing.campaigns"), createWalletOrder);
router.post("/shop/:shopId/purchase/verify", checkPermission("marketing.campaigns"), verifyWalletPayment);

export default router;
