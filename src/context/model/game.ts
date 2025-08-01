import z from "zod";
import { playerSchema } from "./player";
import { cellSchema } from "./cell";

export const GAME_SIZE = 14;

const gameStatusSchema = z.enum(["waiting", "ongoing", "ended"] as const);
export type GameStatus = z.infer<typeof gameStatusSchema>;

export const gameSchema = z.object({
  _id: z.string(),
  token: z.string(),
  status: gameStatusSchema.default("waiting"),
  players: z.array(playerSchema),
  cells: z.array(cellSchema),
  currentTurn: z.number(),
});

export type Game = z.infer<typeof gameSchema>;
