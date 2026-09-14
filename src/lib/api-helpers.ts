import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

function withRateLimit(handler: RouteHandler, maxRequests = 60, windowMs = 60000): RouteHandler {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;

    if (!checkRateLimit(key, maxRequests, windowMs)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
        { status: 429 }
      );
    }

    return handler(req);
  };
}

export { withRateLimit };
