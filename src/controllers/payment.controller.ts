import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import SSLCommerzPayment from "sslcommerz-lts";
import prisma from "../config/prisma";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth.middleware";
import { config } from "../config/config";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qs = (v: any): string => (Array.isArray(v) ? v[0] : v) || "";


// ─── POST /api/payments/create ───────────────────────────────────────────────
export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { rentalOrderId } = req.body;
    const customerId = req.user!.userId;

    const rentalOrder = await prisma.rentalOrder.findUnique({
      where: { id: rentalOrderId },
      include: {
        customer: true,
        items: { include: { gearItem: { select: { name: true } } } },
      },
    });

    if (!rentalOrder) {
      sendError(res, 404, "Rental order not found.", { rentalOrderId });
      return;
    }

    if (rentalOrder.customerId !== customerId) {
      sendError(res, 403, "You do not have permission to pay for this order.");
      return;
    }

    if (rentalOrder.status !== "CONFIRMED") {
      sendError(
        res,
        400,
        `Payment can only be initiated for CONFIRMED orders. Current status: ${rentalOrder.status}.`,
        { currentStatus: rentalOrder.status, requiredStatus: "CONFIRMED" }
      );
      return;
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { rentalOrderId },
    });

    if (existingPayment && existingPayment.status === "COMPLETED") {
      sendError(res, 409, "Payment for this order has already been completed.", {
        paymentId: existingPayment.id,
      });
      return;
    }

    const transactionId = `GU-${uuidv4().split("-")[0].toUpperCase()}-${Date.now()}`;
    const amount = Number(rentalOrder.totalAmount);
    const customer = rentalOrder.customer;

    const payment = await prisma.payment.upsert({
      where: { rentalOrderId },
      create: {
        transactionId,
        rentalOrderId,
        customerId,
        amount,
        provider: "SSLCOMMERZ",
        status: "PENDING",
      },
      update: {
        transactionId,
        status: "PENDING",
      },
    });

    const sslData = {
      total_amount: amount,
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${config.baseUrl}/api/payments/confirm/success`,
      fail_url: `${config.baseUrl}/api/payments/confirm/fail`,
      cancel_url: `${config.baseUrl}/api/payments/confirm/cancel`,
      ipn_url: `${config.baseUrl}/api/payments/confirm/ipn`,
      shipping_method: "NO",
      product_name: rentalOrder.items
        .map((i) => i.gearItem.name)
        .join(", ")
        .substring(0, 255),
      product_category: "Sports & Outdoor Gear Rental",
      product_profile: "general",
      cus_name: customer.name,
      cus_email: customer.email,
      cus_add1: customer.address || "Dhaka, Bangladesh",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: customer.phone || "01700000000",
      value_a: rentalOrderId,
      value_b: payment.id,
      value_c: customerId,
    };

    const sslcz = new SSLCommerzPayment(
      config.sslcommerz.storeId,
      config.sslcommerz.storePassword,
      config.sslcommerz.isLive
    );

    const apiResponse = await sslcz.init(sslData);

    if (apiResponse.status === "SUCCESS" && apiResponse.GatewayPageURL) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayData: JSON.parse(JSON.stringify(apiResponse)) },
      });

      sendSuccess(
        res,
        200,
        "Payment session created. Redirect user to payment gateway.",
        {
          paymentId: payment.id,
          transactionId,
          amount,
          currency: "BDT",
          gatewayUrl: apiResponse.GatewayPageURL,
          provider: "SSLCOMMERZ",
        }
      );
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });
      sendError(
        res,
        502,
        "Failed to initialize payment gateway. Please try again.",
        { gatewayResponse: apiResponse }
      );
    }
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/payments/confirm/* ─────────────────────────────────────────────
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body as Record<string, string>;
    const {
      tran_id,
      val_id,
      card_type,
      bank_tran_id,
      status,
      value_a: rentalOrderId,
      value_b: paymentId,
    } = body;

    if (!tran_id || !val_id) {
      sendError(res, 400, "Invalid payment confirmation data.");
      return;
    }

    const sslcz = new SSLCommerzPayment(
      config.sslcommerz.storeId,
      config.sslcommerz.storePassword,
      config.sslcommerz.isLive
    );

    const validationResponse = await sslcz.validate({ val_id });

    if (
      validationResponse.status !== "VALID" &&
      validationResponse.status !== "VALIDATED"
    ) {
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });
      }
      sendError(res, 400, "Payment validation failed.", {
        validationStatus: validationResponse.status,
      });
      return;
    }

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          transactionId: tran_id,
          status: "COMPLETED",
          method: card_type || "SSLCOMMERZ",
          paidAt: new Date(),
          gatewayData: {
            val_id,
            bank_tran_id,
            status,
          },
        },
      }),
      prisma.rentalOrder.update({
        where: { id: rentalOrderId },
        data: { status: "PAID" },
      }),
    ]);

    sendSuccess(res, 200, "Payment confirmed successfully.", {
      paymentId: updatedPayment.id,
      transactionId: tran_id,
      status: "COMPLETED",
      paidAt: updatedPayment.paidAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/payments ───────────────────────────────────────────────────────
export const getMyPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user!.userId;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(qs(page as string | string[]) || "1") || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(qs(limit as string | string[]) || "10") || 10));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { customerId },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          rentalOrder: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              items: {
                include: {
                  gearItem: { select: { id: true, name: true, brand: true } },
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where: { customerId } }),
    ]);

    sendSuccess(res, 200, "Payment history retrieved successfully.", payments, {
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/payments/:id ───────────────────────────────────────────────────
export const getPaymentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        rentalOrder: {
          include: {
            items: {
              include: {
                gearItem: { select: { id: true, name: true, brand: true } },
              },
            },
          },
        },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payment) {
      sendError(res, 404, "Payment not found.", { paymentId: id });
      return;
    }

    if (userRole !== "ADMIN" && payment.customerId !== userId) {
      sendError(res, 403, "You do not have permission to view this payment.");
      return;
    }

    sendSuccess(res, 200, "Payment details retrieved successfully.", payment);
  } catch (error) {
    next(error);
  }
};
