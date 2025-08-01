import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Game } from "@context/model/game";

export function useConvexGame(): Game | null | undefined {
  const { gameToken } = useParams();
  const game: Game | null | undefined = useQuery(api.queries.game.get, {
    gameToken: (gameToken as string) ?? "",
  });

  return game;
}
