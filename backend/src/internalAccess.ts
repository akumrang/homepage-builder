import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const defaultLocalInternalAccessToken = "muksan-local-dev";
export const minimumProductionInternalAccessTokenLength = 32;

interface InternalAccessConfigurationStatus {
  ok: boolean;
  message?: string;
  token: string | null;
  usingDefaultLocalToken: boolean;
}

export function getInternalAccessConfigurationStatus(): InternalAccessConfigurationStatus {
  const configuredToken = process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (configuredToken) {
    if (isProduction && configuredToken === defaultLocalInternalAccessToken) {
      return {
        ok: false,
        message: "운영 환경에서는 로컬 개발 기본 내부 접근 키를 사용할 수 없습니다.",
        token: null,
        usingDefaultLocalToken: false
      };
    }

    if (isProduction && configuredToken.length < minimumProductionInternalAccessTokenLength) {
      return {
        ok: false,
        message: `운영 내부 접근 키는 ${minimumProductionInternalAccessTokenLength}자 이상이어야 합니다.`,
        token: null,
        usingDefaultLocalToken: false
      };
    }

    return {
      ok: true,
      token: configuredToken,
      usingDefaultLocalToken: false
    };
  }

  if (isProduction) {
    return {
      ok: false,
      message: "운영 환경에서는 내부 접근 키가 반드시 필요합니다.",
      token: null,
      usingDefaultLocalToken: false
    };
  }

  return {
    ok: true,
    token: defaultLocalInternalAccessToken,
    usingDefaultLocalToken: true
  };
}

function tokensMatch(actualToken: string, expectedToken: string): boolean {
  const actualTokenBuffer = Buffer.from(actualToken);
  const expectedTokenBuffer = Buffer.from(expectedToken);

  return (
    actualTokenBuffer.length === expectedTokenBuffer.length &&
    timingSafeEqual(actualTokenBuffer, expectedTokenBuffer)
  );
}

function readRequestToken(req: Request) {
  const authorization = req.get("authorization") ?? "";
  const bearerPrefix = "Bearer ";

  if (authorization.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  return req.get("x-internal-access-token")?.trim() ?? "";
}

export function requireInternalAccess(req: Request, res: Response, next: NextFunction) {
  const internalAccessConfiguration = getInternalAccessConfigurationStatus();

  if (!internalAccessConfiguration.ok || !internalAccessConfiguration.token) {
    res.status(503).json({
      message: "내부 접근 토큰 설정을 확인해 주세요."
    });
    return;
  }

  if (!tokensMatch(readRequestToken(req), internalAccessConfiguration.token)) {
    res.status(401).json({
      message: "내부 접근 권한이 필요합니다."
    });
    return;
  }

  next();
}
