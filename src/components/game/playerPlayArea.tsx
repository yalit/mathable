import type { Tile } from "@context/model/tile";
import { PlayTile } from "@components/game/playTile";
import { usePlayer } from "@context/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

export function PlayerPlayArea() {
  const player = usePlayer();

  return (
    <div className="w-screen flex justify-center px-5 py-2">
      <div className="flex items-center justify-center gap-3">
        {/* Title on the left */}
        <div className="flex items-center gap-2 text-gray-700 font-semibold whitespace-nowrap">
          <span>Your Tiles</span>
          <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
        </div>

        {/* Tiles Container */}
        <div className="flex items-center gap-2">
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
    </div>
  );
}
