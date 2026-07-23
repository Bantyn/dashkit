import axios, { AxiosError } from "axios";

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

export interface ShiprocketAuthResult {
  token: string;
  expiry: Date;
}

export interface PickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<ShiprocketAuthResult> {
  try {
    const res = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
      email,
      password,
    });

    const token: string = res.data?.token;
    if (!token) {
      throw new Error("No token returned from Shiprocket");
    }

    const expiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
    return { token, expiry };
  } catch (err: any) {
    const axiosErr = err as AxiosError<any>;
    const msg =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "Shiprocket authentication failed";
    throw new Error(msg);
  }
}

export async function getPickupLocations(
  token: string,
): Promise<PickupLocation[]> {
  try {
    const res = await axios.get(`${SHIPROCKET_BASE}/settings/company/pickup`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data?.shipping_address ?? [];
  } catch (err: any) {
    const msg =
      (err as AxiosError<any>).response?.data?.message ||
      err.message ||
      "Failed to fetch pickup locations";
    throw new Error(msg);
  }
}

export async function createOrder(
  token: string,
  orderPayload: Record<string, any>,
): Promise<any> {
  try {
    const res = await axios.post(
      `${SHIPROCKET_BASE}/orders/create/adhoc`,
      orderPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data;
  } catch (err: any) {
    const data = (err as AxiosError<any>).response?.data;
    const msg =
      data?.message || err.message || "Shiprocket order creation failed";
    const code = (err as AxiosError).response?.status;

    if (code === 422) {
      throw new Error(`Invalid order data: ${msg}`);
    }
    if (code === 401) {
      throw new Error("Shiprocket token expired or invalid");
    }
    throw new Error(msg);
  }
}

export async function trackShipment(token: string, awb: string): Promise<any> {
  try {
    const res = await axios.get(`${SHIPROCKET_BASE}/courier/track/awb/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err: any) {
    const msg =
      (err as AxiosError<any>).response?.data?.message ||
      err.message ||
      "Tracking failed";
    throw new Error(msg);
  }
}

export async function checkServiceability(
  token: string,
  pickupPincode: string,
  deliveryPincode: string,
  weight: number,
  cod: boolean,
): Promise<any> {
  try {
    const res = await axios.get(`${SHIPROCKET_BASE}/courier/serviceability/`, {
      params: {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight,
        cod: cod ? 1 : 0,
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err: any) {
    const msg =
      (err as AxiosError<any>).response?.data?.message ||
      err.message ||
      "Serviceability check failed";
    throw new Error(msg);
  }
}
