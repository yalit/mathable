import type { Player } from "@context/model/player";
import { useParams } from "react-router-dom";

export function usePlayer(): Player | null {
  const { playerToken } = useParams();

  return null;
}
