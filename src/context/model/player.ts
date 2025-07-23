import z from "zod";
import { tileSchema } from "./tile";

export const playerSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  token: z.string(),
  current: z.boolean(),
  tiles: z.array(tileSchema),
  score: z.number(),
});
export type Player = z.infer<typeof playerSchema>;
