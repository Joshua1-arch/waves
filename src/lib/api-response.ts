import { NextResponse } from "next/server";

interface ApiErrorOptions {
  status?: number;
  details?: unknown;
}

export function apiError(message: string, options: ApiErrorOptions = {}) {
  const { status = 400, details } = options;

  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status },
  );
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    init,
  );
}
