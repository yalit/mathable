import type { Game } from "@context/model/game";
import type { Player } from "@context/model/player";

export const useJoinGame = () => {
  const joinGame = (game: Game, player: Player) => {
    document.location = `/game/${game.token}/player/${player.token}`;
  };

  return { joinGame };
};
