import type { Game } from "@context/model/game.ts";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Game as ConvexGame } from "@cvx/domain/models/Game.ts";
import { api } from "@cvx/_generated/api";
import { useFetchFromBackendGameActions } from "@hooks/convex/game/useFetchFromBackendGameActions.tsx";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useFetchCurrentGame(): Game | null {
  const { gameToken } = useParams();
  const { toGame } = useFetchFromBackendGameActions();
  const [game, setGame] = useState<Game | null>(null);
  const convexGame: ConvexGame | null | undefined = useSessionQuery(
    api.controllers.game.queries.get,
    {
      gameToken: (gameToken as string) ?? "",
    },
  );

  useEffect(() => {
    if (!convexGame) return;

    toGame(convexGame).then((g) => setGame(g));
  }, [convexGame, toGame]);

  return game;
}

