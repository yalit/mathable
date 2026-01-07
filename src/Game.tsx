import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Board } from "@components/game/board";
import { GameStatusBar } from "@components/game/gameStatusBar";
import { PlayerPlayArea } from "@components/game/playerPlayArea";
import { PlayersPanel } from "@components/game/playersPanel";
import { useGame, useLoaded } from "@context/hooks";
import { StartGameModal } from "@components/game/startGameModal";
import { EndGameModal } from "@components/game/endGameModal";
import { useState } from "react";

export default function Game() {
  const isLoaded = useLoaded();
  const game = useGame();
  const [isPlayersPanelCollapsed, setIsPlayersPanelCollapsed] = useState(false);

  return (
    <>
      {isLoaded ? (
        <DndProvider backend={HTML5Backend}>
          <div className="flex flex-col overflow-hidden">
            <GameStatusBar />
            <div className="flex-1 flex overflow-auto">
              {/* Left sidebar - Player tiles */}
              <div className="border-r-2 border-gray-200 bg-white overflow-auto">
                <PlayerPlayArea />
              </div>

              {/* Center - Board */}
              <div className="flex-1 flex justify-center items-start overflow-auto">
                <Board />
              </div>

              {/* Right sidebar - Players list */}
              <div className="relative">
                <div
                  className={`border-l-2 border-gray-200 h-full bg-white transition-all duration-300 ${
                    isPlayersPanelCollapsed ? "w-0 border-0" : ""
                  }`}
                >
                  <PlayersPanel
                    isCollapsed={isPlayersPanelCollapsed}
                    onToggle={() =>
                      setIsPlayersPanelCollapsed(!isPlayersPanelCollapsed)
                    }
                  />
                </div>
              </div>
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
