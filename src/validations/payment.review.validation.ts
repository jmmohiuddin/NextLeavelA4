import { z } from "zod";

export const createPaymentSchema = z.object({
  rentalOrderId: z
    .string({ required_error: "Rental order ID is required." })
    .cuid("Invalid rental order ID format."),
});

export const createReviewSchema = z.object({
  gearItemId: z
    .string({ required_error: "Gear item ID is required." })
    .cuid("Invalid gear item ID."),
  rentalOrderId: z
    .string({ required_error: "Rental order ID is required." })
    .cuid("Invalid rental order ID."),
  rating: z
    .number({ required_error: "Rating is required." })
    .int("Rating must be a whole number.")
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),
  comment: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
