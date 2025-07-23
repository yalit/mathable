import type { Tile, TileLocation } from "../model/tile";

export const createTile = (
  value: number,
  location: TileLocation = "in_bag",
): Tile => {
  return {
    id: null,
    value,
    location,
  };
};
