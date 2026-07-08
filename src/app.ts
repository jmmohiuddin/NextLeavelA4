import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { sendError } from "./utils/response";
import { errorHandler } from "./middleware/error.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import gearRoutes, { categoryRouter } from "./routes/gear.routes";
import rentalRoutes from "./routes/rental.routes";
import paymentRoutes from "./routes/payment.routes";
import providerRoutes from "./routes/provider.routes";
import reviewRoutes from "./routes/review.routes";
import adminRoutes from "./routes/admin.routes";

const app: Application = express();

// ─── Security & Parsing Middleware ────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "🏋️ GearUp API is running!",
    data: {
      name: "GearUp – Sports & Outdoor Gear Rental API",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      docs: "https://documenter.getpostman.com",
      endpoints: {
        auth: "/api/auth",
        gear: "/api/gear",
        categories: "/api/categories",
        rentals: "/api/rentals",
        payments: "/api/payments",
        provider: "/api/provider",
        reviews: "/api/reviews",
        admin: "/api/admin",
      },
    },
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is healthy.",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/gear", gearRoutes);
app.use("/api/categories", categoryRouter);
app.use("/api/rentals", rentalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/provider", providerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
    hint: "Check the API documentation for available routes.",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
  }
);

export default app;
