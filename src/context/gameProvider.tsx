import { useEffect, type PropsWithChildren } from "react";
import { useActions } from "./hooks";
import { useSessionId } from "convex-helpers/react/sessions";
import {useParams} from "react-router-dom";
import type {Player} from "@context/model/player.ts";
import {useFetchCurrentGame} from "@hooks/convex/game/useFetchCurrentGame.tsx";
import {useCheckUser} from "@hooks/convex/user/useCheckUser.ts";

export const GameProvider = ({ children }: PropsWithChildren) => {
  const game = useFetchCurrentGame();
  const { playerToken } = useParams();
  const [sessionId] = useSessionId();
  useCheckUser()

  const actions = useActions();

  useEffect(() => {
    if (game === undefined || game === null) {
      return;
    }

    actions.setGame(game);
  }, [actions, game]);

  useEffect(() => {
    if (!game) return
    if (!playerToken) return

    const players = game.players.filter((p: Player) => p.token === playerToken)
    if (players.length === 0) return

    actions.setPlayer(players[0]);
  }, [actions, game, playerToken]);

  useEffect(() => {
    if (sessionId === undefined || sessionId === null) {
      return;
    }

    actions.setSessionId(sessionId);
  }, [actions, sessionId]);

  return <>{children}</>;
};
