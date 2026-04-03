"use strict";

const Table = require("cli-table3");

function toDisplayString(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

/**
 * Unwrap single-key wrapper objects.
 * e.g. { listing: { lid: "1", name: "Smith" } } → { lid: "1", name: "Smith" }
 * Also unwraps nested arrays: { building: [...] } → [...]
 */
function unwrap(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1) {
      const inner = data[keys[0]];
      if (inner && typeof inner === "object") return inner;
    }
  }
  return data;
}

/**
 * Flatten an object for table display — promotes nested object values
 * to top-level with dot-notation keys, but only one level deep.
 * Nested objects/arrays beyond that get JSON-stringified and truncated.
 */
function flattenForTable(obj) {
  const flat = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      // Promote child keys (one level)
      for (const [subKey, subVal] of Object.entries(val)) {
        flat[subKey] = toDisplayString(subVal);
      }
    } else if (Array.isArray(val)) {
      flat[key] = truncate(JSON.stringify(val), 60);
    } else {
      flat[key] = val === null || val === undefined ? "" : String(val);
    }
  }
  return flat;
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

function formatTable(data) {
  let display = data;

  // Unwrap { data: ... } wrapper
  if (display && typeof display === "object" && !Array.isArray(display) && display.data) {
    display = display.data;
  }
  display = unwrap(display);

  if (Array.isArray(display) && display.length === 0) {
    return "No results found";
  }

  // Array of objects — horizontal table
  if (Array.isArray(display)) {
    // Flatten nested objects for cleaner table display
    const items = display.map((item) => {
      const unwrapped = unwrap(item);
      if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
        return flattenForTable(unwrapped);
      }
      return unwrapped;
    });

    const keys = Object.keys(items[0]);
    const table = new Table({ head: keys });

    for (const row of items) {
      table.push(keys.map((k) => {
        const v = row[k];
        return v === null || v === undefined ? "" : String(v);
      }));
    }

    const footer = new Table();
    footer.push([{ colSpan: keys.length, content: `${items.length} results found` }]);

    return table.toString() + "\n" + footer.toString();
  }

  // Single object — vertical key-value table
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
