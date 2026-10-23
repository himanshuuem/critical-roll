import { test } from "node:test";
import assert from "node:assert/strict";
import { rollDie, rollSet, critical, notation, duelWinner } from "./dice.js";

test("rollDie stays in range over many rolls", () => {
  for (let i = 0; i < 5000; i++) {
    const value = rollDie(20);
    assert.ok(value >= 1 && value <= 20);
  }
});

test("rollDie rejects values that would bias the result", () => {
  const values = [0xffffffff, 41];
  const result = rollDie(6, () => values.shift());
  assert.equal(result, (41 % 6) + 1);
});

test("rollSet sums dice and modifier", () => {
  const fixed = [3, 4];
  const result = rollSet({ sides: 6, count: 2, modifier: 2 }, () => fixed.shift());
  assert.deepEqual(result.dice, [3, 4]);
  assert.equal(result.total, 9);
});

test("advantage keeps the higher set", () => {
  const fixed = [5, 17];
  const result = rollSet({ sides: 20, mode: "advantage" }, () => fixed.shift());
  assert.equal(result.total, 17);
  assert.equal(result.discarded.total, 5);
});

test("critical only applies to single d20", () => {
  assert.equal(critical({ sides: 20, dice: [20] }), "success");
  assert.equal(critical({ sides: 20, dice: [1] }), "fail");
  assert.equal(critical({ sides: 6, dice: [6] }), null);
});

test("notation formats dice expressions", () => {
  assert.equal(notation({ sides: 8, count: 3, modifier: -1, mode: "normal" }), "3d8-1");
  assert.equal(notation({ sides: 20, count: 1, modifier: 0, mode: "advantage" }), "1d20 (adv)");
});

test("duelWinner handles draws", () => {
  assert.equal(duelWinner(4, 4), "draw");
  assert.equal(duelWinner(9, 2), "p1");
});
