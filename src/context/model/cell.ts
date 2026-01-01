import z from "zod";
import { tileSchema } from "./tile";

const cellTypeSchema = z.enum(["empty", "value", "operator", "multiplier"]);
export type CellType = z.infer<typeof cellTypeSchema>;

const cellOperatorSchema = z.enum(["+", "-", "*", "/"]);
export type CellOperator = z.infer<typeof cellOperatorSchema>;

const baseCellSchema = z.object({
  id: z.string(),
  row: z.number(),
  column: z.number(),
  allowedValues: z.array(z.number()),
  type: cellTypeSchema,
  tile: tileSchema.optional().nullable(),
});

export const cellSchema = z.discriminatedUnion("type", [
  baseCellSchema.extend({ type: z.literal("empty") }),
  baseCellSchema.extend({ type: z.literal("value"), value: z.number() }),
  baseCellSchema.extend({
    type: z.literal("operator"),
    operator: z.enum(["+", "-", "*", "/"]),
  }),
  baseCellSchema.extend({
    type: z.literal("multiplier"),
    multiplier: z.number(),
  }),
]);
export type Cell = z.infer<typeof cellSchema>;
