#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");

function loadEnvFile() {
  if (!existsSync(envPath)) {
    return;
  }

  const contents = readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = rawLine.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = rawLine.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = rawLine.slice(separatorIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const item = process.argv.find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : "";
}

function getRequired(name, fallback = "") {
  const cliName = name.toLowerCase().replace(/_/g, "-");
  const value = (getArg(cliName) || process.env[name] || fallback).trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

loadEnvFile();

const baseUrl = (
  getArg("base-url") ||
  getRequired("ADMIN_AUTH_BASE_URL", process.env.STABLE_GEORGIA_BASE_URL || "http://localhost:3000")
)
  .replace(/\/+$/, "");
const loginId = getRequired("ADMIN_LOGIN_ID");
const password = getRequired("ADMIN_PASSWORD");

const response = await fetch(`${baseUrl}/api/admin-auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-return-admin-token": "true",
  },
  body: JSON.stringify({
    loginId,
    password,
    returnToken: true,
  }),
});

const json = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(JSON.stringify({
    status: "error",
    httpStatus: response.status,
    error: json?.error || response.statusText,
    reason: json?.reason || null,
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: "success",
  baseUrl,
  loginId,
  token: json?.result?.token,
  expiresAt: json?.result?.expiresAt,
  account: json?.result?.account,
}, null, 2));
