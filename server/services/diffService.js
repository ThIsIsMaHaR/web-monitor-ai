import { diffWords } from "diff";

export const generateDiff = (oldText, newText) => {
  const diff = diffWords(oldText || "", newText);
  return diff
    .filter(part => part.added || part.removed)
    .map(part => part.value)
    .join(" ");
};