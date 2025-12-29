import { v, type Validator } from "convex/values";

export type ReturnResult = "success" | "error";

/**
 * Create a Convex validator for API return types with success/error union
 *
 * @param dataValidator - The validator for the success case data
 * @returns A union validator for {status: "success", data: T} | {status: "error", data: string}
 *
 * @example
 * const myReturn = APIReturn(v.object({ id: v.string(), name: v.string() }));
 * // Type: {status: "success", data: {id: string, name: string}} | {status: "error", data: string}
 */
export const APIReturn = <T extends Validator<any, any, any>>(dataValidator: T) => {
    return v.union(
        v.object({
            status: v.literal("success"),
            data: dataValidator
        }),
        v.object({
            status: v.literal("error"),
            data: v.string()
        })
    );
};