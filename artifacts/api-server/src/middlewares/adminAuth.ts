import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    req.log.error("SESSION_SECRET is not set — cannot verify admin token");
    res.status(500).json({ error: "Configuração de segurança ausente no servidor." });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { role?: string };
    if (payload.role !== "admin") {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Não autorizado" });
  }
}
