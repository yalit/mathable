import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Board } from "@components/board";
import { GameStatusBar } from "@components/gameStatusBar";

export default function Game() {
  return (
    <DndProvider backend={HTML5Backend}>
      <GameStatusBar />
      <Board />
    </DndProvider>
  );
}
