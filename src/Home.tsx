import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";

function Home() {
  const [clicked, setClicked] = useState<boolean>();
  const [gameName, setGameName] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const createGame = useMutation(api.game.actions.createGame.default);

  const handleClickOnCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (gameName === "" || playerName === "") {
      return;
    }

    const { gameToken, playerToken } = await createGame({
      gameName,
      playerName,
    });
    if (gameToken && gameToken !== "" && playerToken && playerToken !== "") {
      document.location = `/game/${gameToken}/player/${playerToken}`;
    }
  };

  return (
    <div className="border rounded border-cyan-800 text-cyan-700 text-xl font-semibold min-w-[70vw] md:min-w-[50vw]">
      {clicked ? (
        <form
          className="p-5 flex flex-col gap-5"
          onSubmit={handleClickOnCreate}
        >
          <div className="flex gap-2 flex-col">
            <label htmlFor="game_name">Game Name</label>
            <input
              className="focus:outline-none font-normal text-lg border-b border-inherit pb-1"
              id="game_name"
              name="game_name"
              placeholder="Name your game..."
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
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
  );
}

export default Home;
