import type { Tile } from "@context/model/tile";
import { PlayTile } from "@components/game/playTile";
import { usePlayer } from "@context/hooks";

export function PlayerPlayArea() {
  const player = usePlayer();

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-200 pb-2">
        Your Tiles
      </h3>
      <div className="flex flex-col items-center gap-3">
        {player.tiles.length > 0 ? (
          player.tiles.map((t: Tile) => (
            <div
              key={t.id}
              className="transform transition-transform hover:scale-105"
            >
              <PlayTile tile={t} tileClass="p-2 text-lg player_tile" />
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic text-sm">No tiles in hand</div>
        )}
      </div>
    </div>
  );
}
