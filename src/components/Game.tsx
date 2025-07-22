import { useParams } from "react-router-dom";

export default function Game() {
  const { gameToken, playerToken } = useParams();

  return (
    <div>
      Showing the game... {gameToken} for the player {playerToken}
    </div>
  );
}
