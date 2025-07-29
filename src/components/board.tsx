import type { Cell } from "@context/model/cell";
import { BoardCell } from "./boardCell";
import { useGame } from "@context/hooks";

export function Board() {
  const game = useGame();
  return (
    <div className="w-screen flex justify-center p-5">
      <div className="board">
        <div className="board__plate bg-sky-800">
          {game &&
            game.cells.map((cell: Cell) => (
              <BoardCell key={cell._id} cell={cell} />
            ))}
        </div>
      </div>
    </div>
  );
}
