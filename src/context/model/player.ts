import z from "zod";
import { tileSchema } from "./tile";

export const playerSchema = z.object({
  _id: z.string().nullable(),
  name: z.string(),
  token: z.string(),
  current: z.boolean(),
  tiles: z.array(tileSchema),
  score: z.number(),
  owner: z.boolean(),
  order: z.number().nullable(),
  userId: z.string(),
});
export type Player = z.infer<typeof playerSchema>;
