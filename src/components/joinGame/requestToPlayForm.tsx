import { useGame, useSessionId } from "@context/hooks";
import { api } from "@cvx/_generated/api";
import type { Id } from "@cvx/_generated/dataModel";
import { useMutation } from "convex/react";
import { useMemo, useState, type FormEvent } from "react";

export const RequestToPlayForm = () => {
  const game = useGame();
  const sessionId = useSessionId();
  const [playerName, setPlayerName] = useState<string>("");
  const joinGame = useMutation(api.mutations.public.game.join);
  const requestToPlay = async (e: FormEvent) => {
    e.preventDefault();
    const result = await joinGame({
      gameId: game._id as Id<"games">,
      playerName,
      sessionId,
    });

    if (!result.success) {
      return;
    }

    if (result.token !== "") {
      document.location = `/game/${game.token}/player/${result.token}`;
    }
  };

  const canJoin = useMemo(() => {
    return game.players.length < 4;
  }, [game.players]);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="border rounded border-cyan-800 text-cyan-700 text-xl font-semibold min-w-[70vw] md:min-w-[50vw]">
        {canJoin ? (
          <form className="p-5 flex flex-col gap-5" onSubmit={requestToPlay}>
            <p>There is already a game ongoing...</p>
            <p>Do you want to join the game?</p>
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
};
