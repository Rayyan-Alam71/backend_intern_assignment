import { Request, Response, NextFunction } from "express";

// Global error handler middleware
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
}
