import type { Game } from "../model/game";
import { createPlayer } from "./playerFactory";
import { UUID } from "./uuidFactory";

export const createGame = (gameName: string, firstPlayerName: string): Game => {
  return {
    id: null,
    name: gameName,
    token: UUID(),
    status: "waiting",
    players: [createPlayer(firstPlayerName)],
  };
};
