export const DIE_SIDES = [4, 6, 8, 10, 12, 20];

/** Unbiased integer in [1, sides] using rejection sampling over crypto random bytes. */
export function rollDie(sides, randomUint32 = cryptoUint32) {
  if (!DIE_SIDES.includes(sides)) throw new RangeError(`Unsupported die: d${sides}`);
  const limit = Math.floor(0x1_0000_0000 / sides) * sides;
  let value;
  do {
    value = randomUint32();
  } while (value >= limit);
  return (value % sides) + 1;
}

function cryptoUint32() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

/**
 * Roll `count` dice of `sides`, apply a modifier, and optionally advantage/disadvantage
 * (roll the whole set twice, keep the higher/lower total).
 */
export function rollSet({ sides, count = 1, modifier = 0, mode = "normal" }, roller = rollDie) {
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new RangeError("Roll between 1 and 10 dice");
  if (!Number.isInteger(modifier) || Math.abs(modifier) > 20) throw new RangeError("Modifier must be between -20 and 20");
  const once = () => {
    const dice = Array.from({ length: count }, () => roller(sides));
    return { dice, total: dice.reduce((sum, d) => sum + d, 0) + modifier };
  };
  const first = once();
  if (mode === "normal") return { ...first, discarded: null, sides, modifier, mode };
  const second = once();
  const keepFirst = mode === "advantage" ? first.total >= second.total : first.total <= second.total;
  const [kept, discarded] = keepFirst ? [first, second] : [second, first];
  return { ...kept, discarded, sides, modifier, mode };
}

/** Natural max / natural 1 on a single d20 — the moments everybody cheers or groans. */
export function critical(result) {
  if (result.sides !== 20 || result.dice.length !== 1) return null;
  if (result.dice[0] === 20) return "success";
  if (result.dice[0] === 1) return "fail";
  return null;
}

export function notation({ sides, count, modifier, mode }) {
  const mod = modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : "";
  const suffix = mode === "advantage" ? " (adv)" : mode === "disadvantage" ? " (dis)" : "";
  return `${count}d${sides}${mod}${suffix}`;
}

export function duelWinner(a, b) {
  if (a === b) return "draw";
  return a > b ? "p1" : "p2";
}
