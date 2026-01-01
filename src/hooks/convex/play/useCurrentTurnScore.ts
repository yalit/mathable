import type { Game } from "@context/model/game";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useCurrentTurnScore(game: Game) {
  const score = useSessionQuery(
    api.controllers.play.queries.getCurrentTurnScore,
    { gameId: game.id as Id<"games"> },
  );

  return score;
}
