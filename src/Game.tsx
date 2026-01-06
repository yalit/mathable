import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Board } from "@components/game/board";
import { GameStatusBar } from "@components/game/gameStatusBar";
import { PlayerPlayArea } from "@components/game/playerPlayArea";
import { useGame, useLoaded } from "@context/hooks";
import { StartGameModal } from "@components/game/startGameModal";
import { EndGameModal } from "@components/game/endGameModal";

export default function Game() {
  const isLoaded = useLoaded();
  const game = useGame();

  return (
    <>
      {isLoaded ? (
        <DndProvider backend={HTML5Backend}>
          <div className="flex flex-col min-h-[600px] max-h-screen overflow-hidden">
            <GameStatusBar />
            <div className="flex-1 flex flex-col overflow-auto">
              <PlayerPlayArea />
              <Board />
            </div>
          </div>
          {game.status === "waiting" && <StartGameModal />}
          {game.status === "ended" && <EndGameModal />}
        </DndProvider>
      ) : (
        <div>Loading...</div>
      )}
    </>
  );
}
