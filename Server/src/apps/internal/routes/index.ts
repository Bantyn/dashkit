import { Application } from "express";
import webhookRoutes from "./webhook.routes";
import gstRoutes from "./gst.routes";

export const registerInternalRoutes = (app: Application) => {
  app.use("/api/v1/webhooks", webhookRoutes);
  app.use("/api", gstRoutes);
};
