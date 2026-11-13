// Run with:  npm test   (Node 22+). Pure-function tests for lib/security.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { clampText, csvCell, extFor, isStoragePath, isUuid, pickSafeMessage, safeNext, sniffFileKind } from "./security.ts";

const UID = "0b9f3c1e-5a7d-4c1f-9a3e-1d2c3b4a5f60";
const FID = "7f6e5d4c-3b2a-4190-8f7e-6d5c4b3a2910";

test("safeNext keeps in-site paths", () => {
  assert.equal(safeNext("/help/new"), "/help/new");
  assert.equal(safeNext("/placements?x=1#top"), "/placements?x=1#top");
});

test("safeNext rejects anything that can leave the site", () => {
  for (const bad of ["//evil.com", "/\\evil.com", "\\\\evil.com", "https://evil.com", "javascript:alert(1)", "/\t/evil.com", "/%0d%0aSet-Cookie:x", "evil.com", "", "/a\u0000b", "/" + "a".repeat(400)]) {
    assert.equal(safeNext(bad), "/profile", JSON.stringify(bad));
  }
  assert.equal(safeNext(null), "/profile");
  assert.equal(safeNext("//x", "/home"), "/home");
});

test("isUuid needs a FULL uuid (a prefix match once allowed query-string injection)", () => {
  assert.ok(isUuid(UID));
  assert.ok(!isUuid("0b9f3c1e-5a7d-&or=(role.eq.admin)"));
  assert.ok(!isUuid(UID + "&select=*"));
  assert.ok(!isUuid(`${UID}\n`));
  assert.ok(!isUuid(null));
});

test("storage paths must be <uuid>/<uuid>.<ext>", () => {
  assert.ok(isStoragePath(`${UID}/${FID}.jpg`));
  assert.ok(isStoragePath(`${UID}/${FID}.pdf`));
  for (const bad of [`${UID}/../${UID}/${FID}.jpg`, `${UID}/${FID}.php.jpg`, `${UID}/${FID}`, `${UID}/x.jpg`, `../${FID}.jpg`, `${UID}/${FID}.JPG`, `${UID}/${FID}.jpg?x=1`, `demo/${UID}/${FID}.jpg`, `/${UID}/${FID}.jpg`]) {
    assert.ok(!isStoragePath(bad), bad);
  }
});

const blob = (...bytes: number[]) => new Blob([new Uint8Array([...bytes, ...new Array(16).fill(0)])]);
test("sniffFileKind recognises real files by content", async () => {
  assert.equal(await sniffFileKind(blob(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(await sniffFileKind(blob(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(await sniffFileKind(blob(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31)), "application/pdf");
  assert.equal(await sniffFileKind(new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])])), "image/webp");
});
test("sniffFileKind rejects look-alikes", async () => {
  assert.equal(await sniffFileKind(new Blob(["<svg onload=alert(1)></svg>"])), null);
  assert.equal(await sniffFileKind(new Blob(["<?php system($_GET[0]); ?>"])), null);
  assert.equal(await sniffFileKind(new Blob(["MZ\u0090\u0000"])), null);
  assert.equal(await sniffFileKind(new Blob([])), null);
  assert.equal(await sniffFileKind(new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20])])), null); // RIFF/AVI
});
test("extension comes from the real type", () => {
  assert.equal(extFor("image/jpeg"), "jpg");
  assert.equal(extFor("application/pdf"), "pdf");
});

test("pickSafeMessage only passes deliberate messages from our own database functions", () => {
  assert.equal(pickSafeMessage({ code: "P0001", message: "account suspended" }), "account suspended");
  assert.equal(pickSafeMessage({ code: "P0001", message: "You are doing that too often. Please wait a little and try again." }), "You are doing that too often. Please wait a little and try again.");
  assert.equal(pickSafeMessage({ code: "23505", message: 'duplicate key value violates unique constraint "students_email_key"' }), null);
  assert.equal(pickSafeMessage({ code: "42P01", message: 'relation "public.secret" does not exist' }), null);
  assert.equal(pickSafeMessage({ code: "P0001", message: "<img src=x onerror=alert(1)>" }), null);
  assert.equal(pickSafeMessage({ code: "P0001", message: "x".repeat(300) }), null);
  assert.equal(pickSafeMessage(null), null);
  assert.equal(pickSafeMessage("oops"), null);
});

test("csvCell neutralises spreadsheet formulas", () => {
  assert.equal(csvCell("=HYPERLINK(\"http://evil\")"), "\"'=HYPERLINK(\"\"http://evil\"\")\"");
  assert.equal(csvCell("+1+1"), "'+1+1");
  assert.equal(csvCell("-2"), "'-2");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.ok(csvCell("\t=1").startsWith("'"));
  assert.ok(csvCell("\r=1").startsWith("\"'") || csvCell("\r=1").startsWith("'"));
  assert.equal(csvCell(null), "");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell("plain"), "plain");
});

test("clampText strips NULs and limits length", () => {
  assert.equal(clampText("  hi\u0000there  ", 5), "hithe");
});
