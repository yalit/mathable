import { UUID } from "./uuidFactory";
import type { Player } from "../model/player";

export const createPlayer = (
  name: string,
  current: boolean = false,
  score: number = 0,
): Player => {
  return {
    id: null,
    name,
    token: UUID(),
    current,
    score,
    tiles: [],
  };
};
