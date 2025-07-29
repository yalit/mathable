import type { Player } from "@context/model/player";
import { api } from "@cvx/_generated/api";
import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";

export function useConvexPlayer(): Player | null | undefined {
  const { playerToken } = useParams();
  const player: Player | null | undefined = useQuery(api.queries.player.get, {
    playerToken: playerToken ?? "",
  });

  return player;
}
