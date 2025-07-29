import { useEffect, type PropsWithChildren } from "react";
import { useActions } from "./hooks";
import { useSessionId } from "convex-helpers/react/sessions";
import { useConvexGame } from "@hooks/convex/useConvexGame";
import { useConvexPlayer } from "@hooks/convex/useConvexPlayer";

export const GameProvider = ({ children }: PropsWithChildren) => {
  const game = useConvexGame();
  const player = useConvexPlayer();
  const [sessionId] = useSessionId();

  const actions = useActions();

  useEffect(() => {
    if (game === undefined || game === null) {
      return;
    }

    actions.setGame(game);
  }, [game]);

  useEffect(() => {
    if (player === undefined || player === null) {
      return;
    }

    actions.setPlayer(player);
  }, [player]);

  useEffect(() => {
    if (sessionId === undefined || sessionId === null) {
      return;
    }

    actions.setSessionId(sessionId);
  }, [sessionId]);

  return <>{children}</>;
};
