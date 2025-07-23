import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const createGame = useMutation(api.game.actions.createGame.default);

  const handleCreation = async () => {
    const id = await createGame({ gameName: "Test", playerName: "nannick" });
    console.log("New Game and Player ID", id);
  };
  return (
    <>
      <div>Hello world... </div>
      <button onClick={handleCreation}>Create Game</button>
    </>
  );
}

export default App;
