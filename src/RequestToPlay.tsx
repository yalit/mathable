import { useParams } from "react-router-dom";

export default function RequestToPlay() {
  const { gameToken } = useParams();

  return <div>Request to play to game {gameToken}</div>;
}
