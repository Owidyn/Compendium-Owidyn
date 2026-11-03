/** Pure rules shared by the deck UI and its regression checks. */
export function influxLevel(classLevel, spellLevel) {
  if (spellLevel < 1) return spellLevel;
  const maximum = classLevel >= 15 ? 5 : classLevel >= 11 ? 4 : classLevel >= 7 ? 3 : classLevel >= 3 ? 2 : 1;
  return spellLevel < maximum ? maximum : spellLevel;
}

export function isConsecutiveDraw(indices) {
  const sorted = [...indices].sort((a, b) => a - b);
  return sorted.length >= 2 && sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
}

export function cantripCount(level) {
  return level >= 10 ? 5 : level >= 4 ? 4 : level > 0 ? 3 : 0;
}
