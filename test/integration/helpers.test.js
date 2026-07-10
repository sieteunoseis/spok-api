"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { extractSeq } = require("./helpers.js");

test("extractSeq returns the exact key's value as a string", () => {
  assert.equal(extractSeq({ orgseq: "4365" }, "orgseq"), "4365");
});

test("extractSeq finds the key recursively and coerces numbers to strings", () => {
  assert.equal(extractSeq({ data: { org: { orgseq: 99 } } }, "orgseq"), "99");
});

test("extractSeq does not false-positive on unrelated fields", () => {
  assert.equal(extractSeq({ Valid: "1" }, "orgseq"), null);
});

test("extractSeq returns null for empty or undefined input", () => {
  assert.equal(extractSeq({}, "orgseq"), null);
  assert.equal(extractSeq(undefined, "orgseq"), null);
});

test("extractSeq returns null when no key argument is given", () => {
  assert.equal(extractSeq({ orgseq: "5" }), null);
});
