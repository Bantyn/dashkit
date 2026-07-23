import { Application } from "express";
import publicAuthRoutes from "./auth.routes";
import publicAnnouncementRoutes from "./announcement.routes";
import publicOrderRoutes from "./order.routes";
import websiteRoutes from "./website.routes";
import reviewRoutes from "./review.routes";
import planRoutes from "./plan.routes";
import publicCustomerRoutes from "./customer.routes";
import publicLeadRoutes from "./lead.routes";
import paymentRoutes from "./payment.routes";
import headlessRoutes from "./headless.routes";
import { getThemeSettings } from "../../../modules/platform-settings/platform-settings.controller";
import { verifyToken } from "../../../middlewares/auth.middleware";
import { staffLogin } from "../../../modules/staff/staff.controller";

export const registerPublicApiRoutes = (app: Application) => {
  app.use("/api/v1/auth", publicAuthRoutes);
  app.post("/api/v1/staff/login", verifyToken, staffLogin);
  app.use("/api/v1/announcements", publicAnnouncementRoutes);
  app.use("/api/v1/orders", publicOrderRoutes);
  app.use("/api/v1/plans", planRoutes);
  app.use("/api/v1/website", websiteRoutes);
  app.use("/api/v1/reviews", reviewRoutes);
  app.use("/api/v1/customers", publicCustomerRoutes);
  app.use("/api/v1/leads", publicLeadRoutes);
  app.use("/api/v1/payment", paymentRoutes);
  app.use("/api/v1/headless", headlessRoutes);
  app.get("/api/v1/themes", getThemeSettings);
};
