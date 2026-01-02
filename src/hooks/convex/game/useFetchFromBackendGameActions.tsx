import { useConvex } from "convex/react";
import { api } from "@cvx/_generated/api";
import type { Game as ConvexGame } from "@cvx/domain/models/Game.ts";
import type { Cell as ConvexCell } from "@cvx/domain/models/Cell.ts";
import type { Tile as ConvexTile } from "@cvx/domain/models/Tile.ts";
import type { Player as ConvexPlayer } from "@cvx/domain/models/Player.ts";
import { type Game, gameSchema } from "@context/model/game.ts";
import { type Tile, tileSchema } from "@context/model/tile.ts";
import { type Player, playerSchema } from "@context/model/player.ts";
import { type Cell, cellSchema } from "@context/model/cell.ts";

type ReturnGameFunctions = {
  toGame: (convexGame: ConvexGame) => Promise<Game>;
  toGames: (convexGames: ConvexGame[]) => Promise<Game[]>;
};

export function useFetchFromBackendGameActions(): ReturnGameFunctions {
  const convex = useConvex();

  const toGames = async (convexGames: ConvexGame[]): Promise<Game[]> => {
    return Promise.all(convexGames.map(async (g) => await toGame(g)));
  };

  const toGame = async (convexGame: ConvexGame): Promise<Game> => {
    const gameId = convexGame.id;
    const convexCells: ConvexCell[] = await convex.query(
      api.controllers.cell.queries.getForGame,
      { gameId: gameId },
    );
    const convexTiles: ConvexTile[] = await convex.query(
      api.controllers.tile.queries.getForGame,
      { gameId: gameId },
    );
    const convexPlayers: ConvexPlayer[] = await convex.query(
      api.controllers.player.queries.getForGame,
      { gameId: gameId },
    );

    const getTiles = (convexTiles: ConvexTile[]): Tile[] => {
      return convexTiles.map((convexTile: ConvexTile) =>
        tileSchema.parse(convexTile),
      );
    };

    const getPlayers = (
      convexPlayers: ConvexPlayer[],
      convexTiles: ConvexTile[],
    ): Player[] => {
      return convexPlayers.map((convexPlayer: ConvexPlayer) =>
        playerSchema.parse({
          ...convexPlayer,
          tiles: convexTiles.filter(
            (convexTile: ConvexTile) =>
              convexTile.playerId === convexPlayer.id &&
              convexTile.location === "in_hand",
          ),
        }),
      );
    };

    const getCells = (
      convexCells: ConvexCell[],
      convexTiles: ConvexTile[],
    ): Cell[] => {
      return convexCells.map((convexCell: ConvexCell): Cell => {
        const cellTiles: ConvexTile[] = convexTiles.filter(
          (convexTile) => convexTile.cellId === convexCell.id,
        );
        const cellTile: Tile | null =
          cellTiles.length > 0 ? tileSchema.parse(cellTiles[0]) : null;
        return cellSchema.parse({ ...convexCell, tile: cellTile });
      });
    };
    console.log("GAME players", convexPlayers, convexTiles);

    return gameSchema.parse({
      ...convexGame,
      tiles: getTiles(convexTiles),
      cells: getCells(convexCells, convexTiles),
      players: getPlayers(convexPlayers, convexTiles),
    });
  };

  return { toGame, toGames };
}
