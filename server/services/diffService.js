import { diffLines } from "diff";

export const generateDiff = (oldText, newText) => {
  // Use diffLines so we see line-by-line changes (better for websites)
  const diff = diffLines(oldText || "", newText || "");
  
  return diff
    .filter(part => part.added || part.removed)
    .map(part => {
      const prefix = part.added ? "[ADDED]: " : "[REMOVED]: ";
      return prefix + part.value.trim();
    })
    .join("\n")
    .substring(0, 2000); // Prevent the diff from getting too massive
};