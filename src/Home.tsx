import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import {
  useSessionMutation,
  useSessionQuery,
} from "convex-helpers/react/sessions";

function Home() {
  const [clicked, setClicked] = useState<boolean>();
  const [playerName, setPlayerName] = useState<string>("");
  const createGame = useSessionMutation(api.mutations.public.game.create);
  const sessionGames = useSessionQuery(api.queries.game.getForSession);

  const handleClickOnCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (playerName === "") {
      return;
    }

    const { gameToken, playerToken } = await createGame({
      playerName,
    });
    if (gameToken && gameToken !== "" && playerToken && playerToken !== "") {
      document.location = `/game/${gameToken}/player/${playerToken}`;
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="border rounded border-cyan-800 text-cyan-700 text-xl font-semibold min-w-[70vw] md:min-w-[50vw]">
        {clicked ? (
          <form
            className="p-5 flex flex-col gap-5"
            onSubmit={handleClickOnCreate}
          >
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
                Create
              </button>
            </div>
          </form>
        ) : (
          <button
            className="p-5 cursor-pointer flex justify-center w-full"
            onClick={() => setClicked(true)}
          >
            Create new game
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
