import type { NextFunction, Request, Response } from "express";

const defaultLocalInternalAccessToken = "muksan-local-dev";

function getConfiguredInternalAccessToken() {
  const configuredToken = process.env.HOMEPAGE_INTERNAL_ACCESS_TOKEN?.trim();

  if (configuredToken) {
    return configuredToken;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return defaultLocalInternalAccessToken;
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
  const expectedToken = getConfiguredInternalAccessToken();

  if (!expectedToken) {
    res.status(503).json({
      message: "내부 접근 토큰이 설정되지 않았습니다."
    });
    return;
  }

  if (readRequestToken(req) !== expectedToken) {
    res.status(401).json({
      message: "내부 접근 권한이 필요합니다."
    });
    return;
  }

  next();
}
