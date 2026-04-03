"use strict";

const { formatJson } = require("../formatters/json.js");
const { formatCsv } = require("../formatters/csv.js");
const { formatTable } = require("../formatters/table.js");

/**
 * Select the right formatter and print data to stdout.
 * @param {object|Array} data
 * @param {"table"|"json"|"csv"} [format="table"]
 */
async function printResult(data, format = "table") {
  let output;

  switch (format) {
    case "json":
      output = formatJson(data);
      break;
    case "csv":
      output = formatCsv(data);
      break;
    case "table":
    default:
      output = formatTable(data);
      break;
  }

  process.stdout.write(output + "\n");
}

/**
 * Print an error to stderr with actionable hints and set exit code to 1.
 * @param {Error|string} err
 */
function printError(err) {
  const message = err instanceof Error ? err.message : String(err);

  process.stderr.write(`Error: ${message}\n`);

  if (message.includes("not configured") || message.includes("No active server")) {
    process.stderr.write(`Hint: Run "spok-api config add" to configure a server.\n`);
  } else if (message.includes("timed out")) {
    process.stderr.write(`Hint: Check that the Spok host and port are correct and reachable.\n`);
  } else if (message.includes("Failed to connect")) {
    process.stderr.write(`Hint: Verify the server is running. Try --ssl or check --port.\n`);
  }

  process.exitCode = 1;
}

module.exports = { printResult, printError };
