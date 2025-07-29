import type { SessionId } from "convex-helpers/server/sessions";
import { gameContext, type GameContextActions } from "./gameContext";
import type { Game } from "./model/game";
import type { Player } from "./model/player";

export const useGameLoaded = (): boolean => {
  return gameContext((state) => state.game._id !== "");
};

export const useLoaded = (): boolean => {
  return gameContext(
    (state) => state.game._id !== "" && state.player._id !== "",
  );
};

export const useGame = (): Game => {
  return gameContext((state) => state.game);
};

export const usePlayer = (): Player => {
  return gameContext((state) => state.player);
};

export const useSessionId = (): SessionId => {
  return gameContext((state) => state.sessionId);
};

export const useActions = (): GameContextActions => {
  return gameContext((state) => state.actions);
};
