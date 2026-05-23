import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "tac-admin-2025";
  if (token === adminPassword) {
    next();
    return;
  }
  res.status(401).json({ error: "Não autorizado" });
}
