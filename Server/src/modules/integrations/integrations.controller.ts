import { Request, Response } from "express";
import { integrationsService } from "./integrations.service";
import { subscriptionService } from "../subscription/subscription.service";
import { FEATURE_KEYS } from "../subscription/subscription.constants";

const PROVIDER_FEATURE_MAP: Record<string, string> = {
  whatsapp: FEATURE_KEYS.MKTG_WHATSAPP,
  twilio: FEATURE_KEYS.MKTG_SMS,
  cloudinary: FEATURE_KEYS.WEB_STOREFRONT,
  awsS3: FEATURE_KEYS.WEB_STOREFRONT,
  smtp: FEATURE_KEYS.MKTG_TEMPLATES,
  sendgrid: FEATURE_KEYS.MKTG_TEMPLATES,
  delhivery: FEATURE_KEYS.SHIP_SETUP,
  googleAnalytics: FEATURE_KEYS.ANALYTICS_DASHBOARD,
  shiprocket: FEATURE_KEYS.SHIP_SHIPROCKET,
};

export const getIntegrations = async (req: Request, res: Response) => {
  try {
    const result = await integrationsService.getIntegrations(String(req.params.shopId));
    if (result.status === "not_found") {
      return res.status(404).json({ message: "Shop not found" });
    }
    return res.json({ data: result.data });
  } catch (err) {
    console.error("getIntegrations error:", err);
    return res.status(500).json({ message: "Failed to fetch integrations" });
  }
};

export const updateIntegrations = async (req: Request, res: Response) => {
  try {
    const { provider, config } = req.body as {
      provider: string;
      config: Record<string, any>;
    };

    const requiredFeature = PROVIDER_FEATURE_MAP[provider];
    if (requiredFeature) {
      await subscriptionService.assertFeatureEnabled(requiredFeature, {
        shopId: String(req.params.shopId),
        userId: (req as any).user?.uid, // Cast to any to get user if attached
      });
    }

    const result = await integrationsService.updateIntegrations(
      String(req.params.shopId),
      provider,
      config,
    );

    if (result.status === "bad_request") {
      return res.status(400).json({ message: "provider and config are required" });
    }
    if (result.status === "not_found") {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.json({
      message: result.message,
      data: result.data,
    });
  } catch (err: any) {
    if (err.name === "PlanRestrictionError") {
      return res.status(403).json({ success: false, message: "Feature not available in your plan" });
    }
    console.error("updateIntegrations error:", err);
    return res.status(500).json({ message: "Failed to update integration" });
  }
};

export const deleteIntegration = async (req: Request, res: Response) => {
  try {
    const provider = String(req.params.provider);
    const requiredFeature = PROVIDER_FEATURE_MAP[provider];
    if (requiredFeature) {
      await subscriptionService.assertFeatureEnabled(requiredFeature, {
        shopId: String(req.params.shopId),
        userId: (req as any).user?.uid,
      });
    }

    const result = await integrationsService.deleteIntegration(
      String(req.params.shopId),
      provider,
    );

    if (result.status === "not_found") {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.json({ message: result.message });
  } catch (err: any) {
    if (err.name === "PlanRestrictionError") {
      return res.status(403).json({ success: false, message: "Feature not available in your plan" });
    }
    console.error("deleteIntegration error:", err);
    return res.status(500).json({ message: "Failed to delete integration" });
  }
};
