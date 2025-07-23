import z from "zod";

const tileLocationSchema = z.enum(["in_bag", "in_hand", "on_board"]);
export type TileLocation = z.infer<typeof tileLocationSchema>;

export const tileSchema = z.object({
  id: z.string().nullable(),
  value: z.number(),
  location: tileLocationSchema,
});
export type Tile = z.infer<typeof tileSchema>;
