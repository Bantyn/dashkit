import axios from "axios";

const getAccessToken = async (): Promise<string> => {
  const apiKey = process.env.SANDBOX_API_KEY;
  const apiSecret = process.env.SANDBOX_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    console.error("[GST] Credentials missing in process.env");
    throw new Error(
      "Sandbox credentials (SANDBOX_API_KEY/SANDBOX_SECRET_KEY) missing in .env",
    );
  }

  console.log("[GST] Authenticating with Sandbox...");
  const response = await axios.post(
    "https://api.sandbox.co.in/authenticate",
    {},
    {
      headers: {
        "x-api-key": apiKey,
        "x-api-secret": apiSecret,
        "x-api-version": "1.0.0",
        "Content-Type": "application/json",
      },
    },
  );

  if (
    response.data &&
    (response.data.code === 200 || response.data.code === 201) &&
    response.data.data?.access_token
  ) {
    console.log("[GST] Auth successful, token received.");
    return response.data.data.access_token;
  }

  console.error("[GST] Auth failed:", response.data);
  throw new Error(response.data.message || "Failed to authenticate with Sandbox");
};

export const verifyGST = async (gstin: string): Promise<any> => {
  const apiKey = process.env.SANDBOX_API_KEY;
  const accessToken = await getAccessToken();

  const url = "https://api.sandbox.co.in/gst/compliance/public/gstin/search";
  console.log(`[GST] Calling search API for: ${gstin}`);

  const response = await axios.post(
    url,
    { gstin },
    {
      headers: {
        "x-api-key": apiKey,
        authorization: accessToken,
        "x-api-version": "1.0",
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};
