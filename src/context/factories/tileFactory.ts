import type { Tile, TileLocation } from "../model/tile";

export const createTile = (value: number, location: TileLocation): Tile => {
  return {
    id: null,
    value,
    location,
  };
};
