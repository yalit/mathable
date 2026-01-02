import z from "zod";

const tileLocationSchema = z.enum(["in_bag", "in_hand", "on_board"]);
export type TileLocation = z.infer<typeof tileLocationSchema>;

export const tileSchema = z.object({
  id: z.string(),
  value: z.number(),
  location: tileLocationSchema,
  playerId: z
    .string("If not null, tile playerId should be a string")
    .nullable(),
});
export type Tile = z.infer<typeof tileSchema>;
