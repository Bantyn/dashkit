import axios from "axios";
import { db } from "../../config/firebase.config";

export class DelhiveryService {
  private async getShopConfig(shopId: string) {
    const shopSnap = await db.collection("shops").doc(shopId).get();
    if (!shopSnap.exists) {
      throw new Error(`Shop ${shopId} not found`);
    }
    const shop = shopSnap.data();
    const delhivery = shop?.integrations?.delhivery;
    if (!delhivery || !delhivery.connected || !delhivery.apiKey) {
      throw new Error("Delhivery integration is not configured or connected for this shop");
    }
    return {
      apiKey: delhivery.apiKey.trim(),
      apiUrl: shop.metadata?.delhiveryApiUrl || "https://staging-express.delhivery.com",
      warehouseName: shop.pickupAddress?.address || shop.address || "Main Warehouse"
    };
  }

  async checkServiceability(shopId: string, pincode: string) {
    const config = await this.getShopConfig(shopId);
    try {
      const url = `${config.apiUrl}/c/api/pin-codes/json/?filter_codes=${pincode}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${config.apiKey}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error("Delhivery Serviceability Check Error:", error.response?.data || error.message);
      throw new Error("Failed to verify serviceability with Delhivery");
    }
  }

  async createShipment(shopId: string, order: any) {
    const config = await this.getShopConfig(shopId);
    try {
      const isCOD = order.paymentMethod === "cod" || order.paymentMethod === "COD";
      const codAmount = isCOD ? order.totalAmount : 0;
      const paymentMode = isCOD ? "COD" : "Prepaid";

      const capitalize = (str: string) => {
        if (!str) return "";
        return str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
      };

      const desc = (order.items || []).map((item: any) => `${item.productName || item.name} x ${item.quantity || item.qty}`).join(", ");

      const payload = {
        shipments: [
          {
            name: order.shippingAddress?.fullName || "Customer",
            add: order.shippingAddress?.address || "",
            city: capitalize(order.shippingAddress?.city || ""),
            state: capitalize(order.shippingAddress?.state || ""),
            pin: order.shippingAddress?.pincode || "",
            phone: order.shippingAddress?.phone || "",
            email: order.shippingAddress?.email || "",
            country: "India",
            seller_name: config.warehouseName,
            waybill: "",
            order: order.id,
            payment_mode: paymentMode,
            cod_amount: codAmount,
            total_amount: order.totalAmount,
            pickup_location: config.warehouseName,
            products_desc: desc.substring(0, 240),
            quantity: (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || item.qty || 1), 0),
            weight: "0.5",
            shipment_width: "15",
            shipment_height: "5",
            shipment_length: "20",
            shipping_mode: "Surface",
            address_type: "home",
            order_date: new Date().toISOString()
          }
        ],
        pickup_location: {
          name: config.warehouseName
        }
      };

      const requestBody = new URLSearchParams();
      requestBody.append("format", "json");
      requestBody.append("data", JSON.stringify(payload));

      const url = `${config.apiUrl}/api/cmu/create.json`;
      const response = await axios.post(url, requestBody.toString(), {
        headers: {
          Authorization: `Token ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      return response.data;
    } catch (error: any) {
      console.error("Delhivery Shipment Creation Error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async getTrackingDetails(shopId: string, awb: string) {
    const config = await this.getShopConfig(shopId);
    try {
      const url = `${config.apiUrl}/api/v1/packages/json/?waybill=${awb}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Token ${config.apiKey}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Delhivery Tracking Error for AWB ${awb}:`, error.response?.data || error.message);
      throw new Error("Failed to fetch tracking details from Delhivery");
    }
  }

  async getPackingSlipUrl(shopId: string, awb: string) {
    const config = await this.getShopConfig(shopId);
    return `${config.apiUrl}/api/p/packing_slip?wbns=${awb}&token=${config.apiKey}`;
  }
}

export const delhiveryService = new DelhiveryService();
