import type { Doc } from "../_generated/dataModel";

export const hasValue = (cell: Doc<"cells">): boolean => {
  return cell.value !== null || cell.tileId !== null;
};
