#!/usr/bin/env node

import { randomBytes, scrypt as scryptCallback } from "crypto";
import { readFileSync, existsSync } from "fs";
import { MongoClient } from "mongodb";
import { join } from "path";
import { promisify } from "util";

const scryptAsync = promisify(scryptCallback);
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
  const value = (getArg(name.toLowerCase().replace(/_/g, "-")) || process.env[name] || fallback).trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizeRole(value) {
  const role = String(value || "admin").trim().toLowerCase().replace(/-/g, "_");
  if (role === "admin" || role === "superadmin" || role === "store_admin") {
    return role;
  }
  throw new Error("ADMIN_ROLE must be admin, superadmin, or store_admin");
}

function normalizeStorecodes(value, role) {
  const storecodes = String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (storecodes.length > 0) {
    return Array.from(new Set(storecodes));
  }

  if (role === "admin") return ["admin"];
  if (role === "superadmin") return ["superadmin"];
  throw new Error("ADMIN_STORECODES is required for store_admin accounts");
}

async function hashPassword(password) {
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }
  const salt = randomBytes(16).toString("base64url");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$v1$${salt}$${Buffer.from(derived).toString("hex")}`;
}

loadEnvFile();

const mongoUri = getRequired("MONGODB_URI");
const dbName = (process.env.MONGODB_DB_NAME || "georgia").trim() || "georgia";
const loginId = getRequired("ADMIN_LOGIN_ID").toLowerCase();
const password = getRequired("ADMIN_PASSWORD");
const displayName = (getArg("display-name") || process.env.ADMIN_DISPLAY_NAME || loginId).trim() || loginId;
const role = normalizeRole(getArg("role") || process.env.ADMIN_ROLE || "admin");
const storecodes = normalizeStorecodes(
  getArg("storecodes") || getArg("store-codes") || process.env.ADMIN_STORECODES,
  role,
);
const updateExisting = process.argv.includes("--update") || process.env.ADMIN_AUTH_UPDATE_EXISTING === "true";

const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const collection = client.db(dbName).collection("adminPasswordAccounts");
  await collection.createIndex({ loginId: 1 }, { unique: true, name: "uniq_admin_password_login_id" });
  await collection.createIndex({ status: 1, updatedAt: -1 }, { name: "idx_admin_password_status_updated" });

  const existing = await collection.findOne({ loginId });
  if (existing && !updateExisting) {
    throw new Error(`Admin password account already exists for ${loginId}. Re-run with --update to reset it.`);
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);
  const document = {
    loginId,
    displayName,
    passwordHash,
    role,
    storecodes,
    status: "active",
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: existing?.lastLoginAt || null,
    passwordUpdatedAt: now,
    updatedAt: now,
  };

  await collection.updateOne(
    { loginId },
    {
      $set: document,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log(JSON.stringify({
    status: "success",
    loginId,
    role,
    storecodes,
    updatedExisting: Boolean(existing),
  }, null, 2));
} finally {
  await client.close();
}
