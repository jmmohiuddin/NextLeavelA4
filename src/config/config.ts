import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "gearup_fallback_secret_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID || "",
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
    isLive: process.env.SSLCOMMERZ_IS_LIVE === "true",
  },
  baseUrl: process.env.BASE_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
};
