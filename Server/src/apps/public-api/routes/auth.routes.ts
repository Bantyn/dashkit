import { Router } from "express";
import { register, login, registerWithPayment, resolveIdentifier } from "../../../modules/auth/auth.controller";
import { sendOtp, verifyOtp } from "../../../modules/auth/otp.controller";

const router = Router();

router.post("/register", register);
router.post("/register-with-payment", registerWithPayment);
router.post("/login", login);
router.post("/resolve-identifier", resolveIdentifier);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;
