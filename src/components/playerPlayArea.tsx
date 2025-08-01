import type { Tile } from "@context/model/tile";
import { PlayTile } from "./playTile";
import { usePlayer } from "@context/hooks";

export function PlayerPlayArea() {
  const player = usePlayer();

  return (
    <div className="grid grid-cols-3">
      <div></div>
      <div className="flex justify-center items-center gap-2">
        {player.tiles.map((t: Tile) => (
          <PlayTile key={t._id} tile={t} tileClass="p-2 min-w-[50px] text-lg" />
        ))}
      </div>
      <div>{false && <button onClick={console.log}>Reset</button>}</div>
    </div>
  );
}
