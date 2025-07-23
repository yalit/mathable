import z from "zod";
import { playerSchema } from "./player";

export const GAME_SIZE = 14;

const gameStatusSchema = z.enum(["waiting", "ongoing", "ended"] as const);
export type GameStatus = z.infer<typeof gameStatusSchema>;

export const gameSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  token: z.string(),
  status: gameStatusSchema.default("waiting"),
  players: z.array(playerSchema),
});

export type Game = z.infer<typeof gameSchema>;
