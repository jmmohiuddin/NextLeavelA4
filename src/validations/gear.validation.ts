import { z } from "zod";

export const createGearSchema = z.object({
  name: z
    .string({ required_error: "Gear name is required." })
    .min(3, "Name must be at least 3 characters."),
  description: z
    .string({ required_error: "Description is required." })
    .min(10, "Description must be at least 10 characters."),
  brand: z
    .string({ required_error: "Brand is required." })
    .min(1, "Brand is required."),
  pricePerDay: z
    .number({ required_error: "Price per day is required." })
    .positive("Price must be a positive number."),
  stock: z
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .default(1),
  isAvailable: z.boolean().default(true),
  images: z
    .array(z.string().url("Each image must be a valid URL."))
    .optional()
    .default([]),
  specs: z.record(z.unknown()).optional(),
  categoryId: z
    .string({ required_error: "Category ID is required." })
    .cuid("Invalid category ID format."),
});

export const updateGearSchema = createGearSchema.partial();

export type CreateGearInput = z.infer<typeof createGearSchema>;
export type UpdateGearInput = z.infer<typeof updateGearSchema>;
