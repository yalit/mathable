import {useSessionMutation} from "convex-helpers/react/sessions";
import {api} from "@cvx/_generated/api";
import type {Infer} from "convex/values";
import type {createGameReturn} from "@cvx/controllers/game/mutations.ts";

type CreateGameResponse = Infer<typeof createGameReturn>;

export function useCreateGame(): (playerName: string) => Promise<CreateGameResponse> {
    const createGame = useSessionMutation(api.controllers.game.mutations.create);

    return async (playerName: string): Promise<CreateGameResponse> => {
        return await createGame({playerName});
    }
}