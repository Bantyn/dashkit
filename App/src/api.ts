import axios from "axios";
import { getCachedData, setCachedData, invalidateCacheKey, clearApiCache } from "./utils/apiCache";

export { clearApiCache };

/**
 * ⚠️ SETTING IP TO: 127.0.0.1 for local web development
 * Backend is configured to run on PORT 3000 by default.
 */
const YOUR_LAPTOP_IP = process.env.IP || "172.20.10.2";
const PORT = process.env.PORT || "3003";
const BASE_URL = process.env.BASE_URL || `http://${YOUR_LAPTOP_IP}:${PORT}/api/v1/admin`;
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s for heavy endpoints (product catalog can be large)
  headers: {
    "Content-Type": "application/json",
  },
});

// Fast API instance for time-critical calls like barcode scans
export const fastApi = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Mirror auth headers to fastApi whenever they change on the main api
const origSetApiToken = (token: string | null) => {
  if (token) {
    fastApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete fastApi.defaults.headers.common["Authorization"];
  }
};

export const setApiStaffId = (id: string | null) => {
  if (id) {
    api.defaults.headers.common["x-staff-id"] = id;
    fastApi.defaults.headers.common["x-staff-id"] = id;
  } else {
    delete api.defaults.headers.common["x-staff-id"];
    delete fastApi.defaults.headers.common["x-staff-id"];
  }
};

export const setApiToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    fastApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
    delete fastApi.defaults.headers.common["Authorization"];
  }
};

export const loginStaff = async (identifier: string, password: string) => {
  try {
    clearApiCache();
    // 1. Resolve mobile number or email to a definitive email address
    let emailToUse = identifier;
    if (!identifier.includes("@")) {
      const resolveRes = await axios.post(`${BASE_URL}/auth/resolve-identifier`, {
        identifier,
      });
      if (resolveRes.data && resolveRes.data.success) {
        emailToUse = resolveRes.data.data.email;
      }
    }

    // 2. Authenticate with Firebase using the resolved email
    const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD45PhCDp-Dz2TfQEksmWGGfgf2A4FwkXM";
    const fbRes = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      { email: emailToUse, password, returnSecureToken: true },
    );
    const token = fbRes.data.idToken;

    // Set token temporarily for the next request
    setApiToken(token);

    // Call backend to get staff profile
    const response = await api.post("/staff/login", {});
    return { ...response.data, token };
  } catch (error: any) {
    setApiToken(null);
    if (error.response?.data?.error?.message) {
      throw error.response.data.error.message; // Firebase error
    }
    if (error.code === "ECONNABORTED" || !error.response) {
      throw "Server unreachable. Make sure backend is running on port 3000 and you are on the same Wi-Fi.";
    }
    throw error.response?.data?.message || "Login failed.";
  }
};

export const getDashboardData = async (shopId: string, staffId?: string, forceRefresh = false) => {
  const cacheKey = `dashboard-${shopId}-${staffId || "all"}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    let url = `/analytics/${shopId}/dashboard`;
    if (staffId) {
      url += `?staffId=${staffId}`;
    }
    const response = await api.get(url);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("Dashboard fetch error:", error);
    return null;
  }
};

export const getInventoryByShop = async (shopId: string, forceRefresh = false) => {
  const cacheKey = `inventory-${shopId}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await api.get(`/inventory/${shopId}`);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("Inventory fetch error:", error);
    return { success: false, data: [] };
  }
};

// In-memory product store for fast local barcode lookups
let _cachedProductList: any[] = [];

export const getProductsByShop = async (shopId: string, forceRefresh = false) => {
  const cacheKey = `products-${shopId}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      _cachedProductList = cached.data || [];
      return cached;
    }
  }

  try {
    // Use a longer timeout for the full catalog fetch
    const response = await api.get(`/products/shop/${shopId}`, { timeout: 30000 });
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
      _cachedProductList = response.data.data || [];
    }
    return response.data;
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fast local barcode lookup — searches already-loaded products in memory.
 * Falls back to network only if not found locally.
 */
export const findProductByBarcodeLocal = (barcode: string): any | null => {
  if (!barcode || _cachedProductList.length === 0) return null;
  for (const product of _cachedProductList) {
    if (product.barcode === barcode) return product;
    if (product.variants) {
      for (const v of product.variants) {
        if (v.sku === barcode || v.barcode === barcode) {
          return { ...product, matchedVariant: v };
        }
      }
    }
  }
  return null;
};

export const getProductByBarcode = async (shopId: string, barcode: string) => {
  // 1. Fast local lookup first (instant, no network)
  const localResult = findProductByBarcodeLocal(barcode);
  if (localResult) {
    return { success: true, data: localResult, source: "local" };
  }

  // 2. Network fallback using fast 8s timeout
  try {
    const response = await fastApi.get(`/products/barcode/${shopId}/${barcode}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) return { success: false, data: null };
    throw error.response?.data?.message || "Error fetching product by barcode";
  }
};

export const updateStock = async (data: {
  productId: string;
  shopId: string;
  newStock: number;
  variantSku: string;
  reason: string;
  changeType: "set" | "add" | "subtract";
  amount: number;
  updatedBy: string;
}) => {
  try {
    const response = await api.put(`/inventory/update-stock`, data);
    invalidateCacheKey("inventory-");
    invalidateCacheKey("dashboard-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to update stock";
  }
};

export const createProduct = async (productData: any) => {
  try {
    const response = await api.post(`/products`, productData);
    invalidateCacheKey("products-");
    invalidateCacheKey("inventory-");
    invalidateCacheKey("dashboard-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to create product";
  }
};

export const updateProduct = async (id: string, productData: any) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    invalidateCacheKey("products-");
    invalidateCacheKey("inventory-");
    invalidateCacheKey("dashboard-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to update product";
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const response = await api.delete(`/products/${id}`);
    invalidateCacheKey("products-");
    invalidateCacheKey("inventory-");
    invalidateCacheKey("dashboard-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to delete product";
  }
};

export const getCustomersByShop = async (shopId: string, forceRefresh = false) => {
  const cacheKey = `customers-${shopId}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await api.get(`/customers/shop/${shopId}`);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("Customers fetch error:", error);
    return { success: false, data: [] };
  }
};

export const findCustomerByPhone = async (shopId: string, phone: string) => {
  try {
    const response = await api.get(
      `/customers/find?shopId=${shopId}&phone=${phone}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Find customer error:", error);
    return { success: false, data: null };
  }
};

export const createInvoice = async (invoiceData: any) => {
  try {
    const response = await api.post(`/invoices`, invoiceData);
    invalidateCacheKey("invoices-");
    invalidateCacheKey("dashboard-");
    invalidateCacheKey("inventory-");
    invalidateCacheKey("customers-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to create invoice";
  }
};

export const getInvoicesByShop = async (
  shopId: string,
  employeeId?: string,
  forceRefresh = false,
) => {
  const cacheKey = `invoices-${shopId}-${employeeId || "all"}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    let url = `/invoices/shop/${shopId}`;
    if (employeeId) {
      url += `?employeeId=${employeeId}`;
    }
    const response = await api.get(url);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Invoices fetch error:",
      error.response?.data || error.message,
    );
    return { success: false, data: [] };
  }
};

export const getStaffByShop = async (shopId: string, forceRefresh = false) => {
  const cacheKey = `staff-${shopId}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await api.get(`/staff/shop/${shopId}`);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error(
      "Staff fetch error details:",
      error.response?.data || error.message,
    );
    return { success: false, data: [], message: error.response?.data?.message };
  }
};

export const createStaff = async (staffData: any) => {
  try {
    const response = await api.post(`/staff`, staffData);
    invalidateCacheKey("staff-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to add staff member";
  }
};

export const updateStaff = async (id: string, staffData: any) => {
  try {
    const response = await api.put(`/staff/${id}`, staffData);
    invalidateCacheKey("staff-");
    invalidateCacheKey("staff-id-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to update staff member";
  }
};

export const deleteStaff = async (id: string, shopId: string) => {
  try {
    const response = await api.delete(`/staff/${id}?shopId=${shopId}`);
    invalidateCacheKey("staff-");
    invalidateCacheKey("staff-id-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to delete staff member";
  }
};

export const createReturnRequest = async (returnData: any) => {
  try {
    const response = await api.post(`/returns`, returnData);
    invalidateCacheKey("returns-");
    invalidateCacheKey("invoices-");
    invalidateCacheKey("dashboard-");
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || "Failed to create return request";
  }
};

export const getReturnRequestsByShop = async (shopId: string, forceRefresh = false) => {
  const cacheKey = `returns-${shopId}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await api.get(`/returns/shop/${shopId}`);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("Return requests fetch error:", error);
    return { success: false, data: [] };
  }
};

export const getStaffById = async (id: string | undefined, forceRefresh = false) => {
  if (!id) return { success: false, message: "No ID provided" };
  const cacheKey = `staff-id-${id}`;
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  try {
    const response = await api.get(`/staff/${id}`);
    if (response.data && response.data.success) {
      setCachedData(cacheKey, response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error("Fetch staff by ID error:", error);
    return { success: false, message: "Error fetching profile" };
  }
};
