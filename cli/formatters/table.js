"use strict";

const Table = require("cli-table3");

function toDisplayString(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function unwrap(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1 && data[keys[0]] && typeof data[keys[0]] === "object" && !Array.isArray(data[keys[0]])) {
      return data[keys[0]];
    }
  }
  return data;
}

function formatTable(data) {
  let display = data;
  if (display && typeof display === "object" && !Array.isArray(display) && display.data) {
    display = display.data;
  }
  display = unwrap(display);

  if (Array.isArray(display) && display.length === 0) {
    return "No results found";
  }

  if (Array.isArray(display)) {
    const items = display.map(unwrap);
    const keys = Object.keys(items[0]);
    const table = new Table({ head: keys });

    for (const row of items) {
      table.push(keys.map((k) => toDisplayString(row[k])));
    }

    const footer = new Table();
    footer.push([{ colSpan: keys.length, content: `${items.length} results found` }]);

    return table.toString() + "\n" + footer.toString();
  }

  const table = new Table();
  for (const [key, val] of Object.entries(display)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      for (const [subKey, subVal] of Object.entries(val)) {
        table.push({ [subKey]: toDisplayString(subVal) });
      }
    } else {
      table.push({ [key]: toDisplayString(val) });
    }
  }
  return table.toString();
}

module.exports = { formatTable };
