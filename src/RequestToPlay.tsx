import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useGame } from "@hooks/context/useGame";
import { useMutation } from "convex/react";
import { useMemo, useState, type FormEvent } from "react";

export default function RequestToPlay() {
  const game = useGame();
  const joinGame = useMutation(api.mutations.public.game.join);

  const [playerName, setPlayerName] = useState<string>("");

  const requestToPlay = async (e: FormEvent) => {
    e.preventDefault();
    if (game && game._id) {
      const result = await joinGame({
        gameId: game._id as Id<"games">,
        playerName,
      });

      if (!result.success) {
        return;
      }

      if (result.token !== "") {
        document.location = `/game/${game.token}/player/${result.token}`;
      }
    }
  };

  const canJoin = useMemo(() => {
    if (!game) return false;
    return game.players.length < 4;
  }, [game?.players]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="border rounded border-cyan-800 text-cyan-700 text-xl font-semibold min-w-[70vw] md:min-w-[50vw]">
        {canJoin ? (
          <form className="p-5 flex flex-col gap-5" onSubmit={requestToPlay}>
            <div>
              There is already a game ongoing... Do you want to join the game?
            </div>
            <div className="flex gap-2 flex-col">
              <label htmlFor="player_name">Player Name</label>
              <input
                className="focus:outline-none font-normal text-lg border-b border-inherit pb-1"
                id="player_name"
                name="player_name"
                placeholder="What's your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="flex justify-center">
              <button type="submit" className="cursor-pointer">
                Join the game
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 text-center">
            The game is full already... Sorry better luck next time...
          </div>
        )}
      </div>
    </div>
  );
}
