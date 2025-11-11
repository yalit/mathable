import {internal} from "../../_generated/api";
import type {Id} from "../../_generated/dataModel";
import {v} from "convex/values";
import {vSessionId} from "convex-helpers/server/sessions";
import {withSessionInternalMutation} from "../../middleware/sessions";
import {PlayersMutationRepository} from "../../repository/mutations/players.repository.ts";
import {UUID} from "../../domain/models/factory/uuid.factory.ts";
import {createPlayer} from "../../domain/models/factory/player.factory.ts";

export const create = withSessionInternalMutation({
    args: {gameId: v.id("games"), name: v.string(), sessionId: vSessionId},
    handler: async (ctx, {gameId, name}): Promise<Id<"players">> => {
        let userId = ctx.user?._id ?? null;
        if (!ctx.user) {
            userId = await ctx.runMutation(internal.mutations.internal.user.set, {
                name,
                sessionId: ctx.sessionId,
            });
        }
        const player = createPlayer(
            gameId,
            userId!,
            name,
            UUID(),
            false, // current
            0, // score
            false, // owner
            0 // order
        );
        return await PlayersMutationRepository.instance.save(player);
    },
});
