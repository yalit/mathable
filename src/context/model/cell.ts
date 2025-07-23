import z from "zod";
import { GAME_SIZE } from "./game";
import { tileSchema } from "./tile";

const cellTypeSchema = z.enum(["empty", "value", "operator", "multiplier"]);
export type CellType = z.infer<typeof cellTypeSchema>;

const cellOperatorSchema = z.enum(["+", "-", "*", "/"]);
export type CellOperator = z.infer<typeof cellOperatorSchema>;

export const cellSchema = z.object({
  id: z.string().nullable(),
  row: z
    .number()
    .min(0)
    .max(GAME_SIZE - 1),
  column: z
    .number()
    .min(0)
    .max(GAME_SIZE - 1),
  allowedValues: z.array(z.number()),
  type: cellTypeSchema,
  operator: cellOperatorSchema.optional().nullable(),
  value: z.number().optional().nullable(),
  multiplier: z.number().optional().nullable(),
  tile: tileSchema.optional().nullable(),
});
export type Cell = z.infer<typeof cellSchema>;
