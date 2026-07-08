import { z } from "zod";

export const createRentalSchema = z.object({
  startDate: z
    .string({ required_error: "Start date is required." })
    .datetime({ message: "Start date must be a valid ISO 8601 date string." }),
  endDate: z
    .string({ required_error: "End date is required." })
    .datetime({ message: "End date must be a valid ISO 8601 date string." }),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        gearItemId: z
          .string({ required_error: "Gear item ID is required." })
          .cuid("Invalid gear item ID."),
        quantity: z
          .number()
          .int("Quantity must be a whole number.")
          .min(1, "Quantity must be at least 1.")
          .default(1),
      }),
      { required_error: "At least one item is required." }
    )
    .min(1, "At least one item is required."),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date.",
    path: ["endDate"],
  }
);

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
