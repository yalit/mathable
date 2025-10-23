import { create } from "zustand";
import type { Game } from "./model/game";
import { type Player } from "./model/player";
import type { SessionId } from "convex-helpers/server/sessions";

const initialContextGame: Game = {
    _id: "",
    token: "",
    status: "waiting",
    players: [],
    cells: [],
    tiles: [],
    currentTurn: 0,
};

const initialContextPlayer: Player = {
    _id: "",
    name: "",
    token: "",
    current: false,
    tiles: [],
    score: 0,
    owner: false,
    order: 0,
    userId: "",
};

export interface GameContextInterface {
    game: Game;
    player: Player;
    sessionId: SessionId;
    actions: GameContextActions;
}

export interface GameContextActions {
    setGame: (game: Game) => void;
    setPlayer: (player: Player) => void;
    setSessionId: (sessionId: SessionId) => void;
}

export const gameContext = create<GameContextInterface>((set) => ({
    game: initialContextGame,
    player: initialContextPlayer,
    sessionId: "" as SessionId,
    actions: {
        setGame: (game: Game) => set({ game }),
        setPlayer: (player: Player) => set({ player }),
        setSessionId: (sessionId: SessionId) => set({ sessionId }),
    },
}));
