"use strict";
const { test } = require("node:test");

// -- Task 19: Paging family, param-wired only (NO LIVE CALLS) ----------------
// SendMessage, SubmitMessage, SendGroupPage, SendPageWithAlert, and
// SendToSmartAlert all dispatch a real page/message/alert to real recipients
// when they succeed against the lab server. Per the Global Constraints for
// this task set, these 5 RPCs are wired (CLI + library) from amcomapi.xml
// params only and are NEVER executed here — not even once, not with dummy
// data, and never under SPOK_LAB=1. Each entry below documents the exact
// params (verbatim <parameter name> from amcomapi.xml) that WOULD be sent,
// for reference only; the test body never runs.

test.skip("SendMessage: store a message for a messaging ID", () => {
  // intentionally never executed — would dispatch a real page
  // params (amcomapi.xml <procedure name="SendMessage">):
  //   mid                 — destination messaging ID
  //   message_text        — text to store for the messaging id
  //   send_to_covering_id — whether to store for the covering id or the original id
});

test.skip("SubmitMessage: submit a message/page from a requester to a subject", () => {
  // intentionally never executed — would dispatch a real page
  // params (amcomapi.xml <procedure name="SubmitMessage">):
  //   rmid        — requester messaging ID (nullable="false")
  //   smid        — subject messaging ID (nullable="true")
  //   paged_text  — text to send (nullable="false")
  //   priority    — page priority (nullable="false")
});

test.skip("SendGroupPage: send a page to a Message Group", () => {
  // intentionally never executed — would dispatch a real page
  // params (amcomapi.xml <procedure name="SendGroupPage">):
  //   group_id   — destination message group ID
  //   paged_text — text to send to pager
  //   priority   — page priority
});

test.skip("SendPageWithAlert: send a page with an alert to a messaging ID", () => {
  // intentionally never executed — would dispatch a real page
  // params (amcomapi.xml <procedure name="SendPageWithAlert">):
  //   mid        — destination messaging ID (nullable="false")
  //   paged_text — text to send to pager (nullable="false")
  //   priority   — page priority (nullable="false")
});

test.skip("SendToSmartAlert: send a message to all current Smart Alert users", () => {
  // intentionally never executed — would dispatch a real page
  // params (amcomapi.xml <procedure name="SendToSmartAlert">):
  //   mt  — message type supported by Smart Alert
  //   msg — text to send to Smart Alert
});
