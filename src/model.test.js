import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterRows,
  pipelineStats,
  csv,
  seriesFor,
  initialPipelines,
} from "./model.js";
test("environment, state and case-insensitive search combine", () => {
  const rows = filterRows(initialPipelines, {
    env: "staging",
    status: "failed",
    query: "ORDER",
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 88416);
});
test("success rate excludes running jobs and handles empty data", () => {
  assert.equal(
    pipelineStats([
      { status: "success", duration: 60 },
      { status: "failed", duration: 120 },
      { status: "running", duration: 0 },
    ]).rate,
    "50.0",
  );
  assert.equal(pipelineStats([]).average, 0);
});
test("time ranges and environments change chart data", () => {
  assert.equal(seriesFor(7).length, 7);
  assert.equal(seriesFor(30).at(-1).date, "10/31");
  assert.ok(seriesFor(7, "production")[0].success < seriesFor(7)[0].success);
  assert.deepEqual(seriesFor(7), seriesFor(14).slice(-7));
});
test("CSV escapes delimiters, quotes and spreadsheet formulas", () => {
  const output = csv([{ name: "=cmd", title: 'a,"b"\nc' }], ["name", "title"]);
  assert.ok(output.includes('"\'=cmd"'));
  assert.ok(output.includes('"a,""b""\nc"'));
});
