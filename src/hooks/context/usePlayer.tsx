import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";

export function usePlayer(): Player | null {
  const { playerToken } = useParams();
  console.log("playerToken");
  const player: Player | null = useQuery(api.game.queries.getPlayer.default, {
    playerToken: playerToken ?? "",
  });

  return player;
}
