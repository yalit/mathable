import { api } from "@cvx/_generated/api";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { useState, type FormEvent } from "react";

export const CreateGameCard = () => {
  const [playerName, setPlayerName] = useState("");
  const createGame = useSessionMutation(api.mutations.public.game.create);

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
    <div className="flex flex-col gap-5">
      <div className="text-center font-semibold text-xl">Create a new Game</div>
      <form
        className="flex flex-1 flex-col justify-between"
        onSubmit={handleClickOnCreate}
      >
        <div className="flex gap-2 flex-col">
          <label className="font-semibold" htmlFor="player_name">
            Player Name
          </label>
          <input
            className="focus:outline-none font-normal text-lg border-b border-inherit pb-1"
            id="player_name"
            name="player_name"
            placeholder="What's your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="py-3 cursor-pointer font-semibold bg-sky-50/50"
        >
          Create
        </button>
      </form>
    </div>
  );
};
