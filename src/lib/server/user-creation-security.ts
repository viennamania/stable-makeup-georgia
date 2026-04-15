import type { NextRequest } from "next/server";

import {
  getRequestCountry,
  getRequestIp,
} from "@/lib/server/user-read-security";

const HUMAN_LABEL_PATTERN = /^[\p{L}\p{N}\s().,&'/_-]+$/u;
const HUMAN_DEPOSIT_NAME_PATTERN = /^[\p{L}\p{N}\s()[\].,&'/_@+:#-]+$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const UNICODE_REPLACEMENT_CHARACTER = "\uFFFD";

const normalizeText = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const hasUnsafeText = (value: string): boolean => {
  if (!value) {
    return false;
  }

  return value.includes(UNICODE_REPLACEMENT_CHARACTER) || CONTROL_CHARACTER_PATTERN.test(value);
};

const safelyDecodeUriComponent = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw || !/%[0-9A-Fa-f]{2}/.test(raw)) {
    return raw;
  }

  try {
    return decodeURIComponent(raw.replace(/\+/g, "%20")).trim();
  } catch {
    return raw;
  }
};

export type UserCreationAudit = {
  route: string;
  method: string;
  publicIp: string | null;
  publicCountry: string | null;
  userAgent: string | null;
  referer: string | null;
  origin: string | null;
  requestedAt: string;
};

export const validateNicknameForCreation = (
  nickname: unknown,
  label = "회원 아이디",
): string | null => {
  const safeNickname = normalizeText(nickname);

  if (!safeNickname) {
    return `${label}는 필수입니다.`;
  }

  if (safeNickname.length < 2 || safeNickname.length > 80) {
    return `${label} 길이가 올바르지 않습니다.`;
  }

  if (hasUnsafeText(safeNickname)) {
    return `유효하지 않은 ${label}입니다.`;
  }

  return null;
};

export const validateBuyerRegistrationInput = ({
  nickname,
  userName,
  userBankName,
  userBankAccountNumber,
}: {
  nickname: unknown;
  userName: unknown;
  userBankName: unknown;
  userBankAccountNumber: unknown;
}, {
  requireBankName = true,
}: {
  requireBankName?: boolean;
} = {}): string | null => {
  const nicknameError = validateNicknameForCreation(nickname);
  if (nicknameError) {
    return nicknameError;
  }

  const safeUserName = normalizeText(userName);
  if (!safeUserName) {
    return "예금주명은 필수입니다.";
  }

  if (safeUserName.length < 2 || safeUserName.length > 60) {
    return "예금주명 길이가 올바르지 않습니다.";
  }

  if (hasUnsafeText(safeUserName) || !HUMAN_DEPOSIT_NAME_PATTERN.test(safeUserName)) {
    return "유효하지 않은 예금주명입니다.";
  }

  const safeUserBankName = normalizeText(userBankName);
  if (!safeUserBankName) {
    if (requireBankName) {
      return "은행명은 필수입니다.";
    }
  } else {
    if (safeUserBankName.length < 2 || safeUserBankName.length > 60) {
      return "은행명 길이가 올바르지 않습니다.";
    }

    if (hasUnsafeText(safeUserBankName) || !HUMAN_LABEL_PATTERN.test(safeUserBankName)) {
      return "유효하지 않은 은행명입니다.";
    }
  }

  const bankAccountDigits = String(userBankAccountNumber || "").replace(/[^0-9]/g, "");
  if (bankAccountDigits.length < 1 || bankAccountDigits.length > 30) {
    return "유효하지 않은 계좌번호입니다.";
  }

  return null;
};

export const normalizeBuyerRegistrationInput = ({
  nickname,
  userName,
  userBankName,
  userBankAccountNumber,
}: {
  nickname: unknown;
  userName: unknown;
  userBankName: unknown;
  userBankAccountNumber: unknown;
}) => {
  const normalizedNickname = safelyDecodeUriComponent(nickname);
  const normalizedUserName = safelyDecodeUriComponent(userName);
  const normalizedUserBankName = safelyDecodeUriComponent(userBankName);
  const normalizedUserBankAccountNumber = normalizeText(userBankAccountNumber);

  return {
    nickname: normalizedNickname,
    userName: normalizedUserName,
    userBankName: normalizedUserBankName,
    userBankAccountNumber: normalizedUserBankAccountNumber,
  };
};

export const buildUserCreationAudit = (
  request: NextRequest,
  route: string,
): UserCreationAudit => {
  const requestedAt = new Date().toISOString();

  return {
    route,
    method: request.method || "POST",
    publicIp: getRequestIp(request) || null,
    publicCountry: getRequestCountry(request) || null,
    userAgent: normalizeText(request.headers.get("user-agent")).slice(0, 1000) || null,
    referer: normalizeText(request.headers.get("referer")).slice(0, 1000) || null,
    origin: normalizeText(request.headers.get("origin")).slice(0, 1000) || null,
    requestedAt,
  };
};
