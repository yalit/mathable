import type { Cell } from "@context/model/cell";
import { BoardCell } from "@components/game/boardCell";
import { useGame } from "@context/hooks";
import { Rules } from "@components/global/rules";

export function Board() {
  const game = useGame();
  return (
    <div className="w-screen flex justify-center p-5">
      <div className="board">
        <div className="board__plate bg-sky-800">
          {game.cells.map((cell: Cell) => (
            <BoardCell key={cell._id} cell={cell} />
          ))}
        </div>
      </div>
    </div>
  );
}
