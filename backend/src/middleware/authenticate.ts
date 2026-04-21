import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// Extend Request type to include user
export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// Middleware to check if user is logged in
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Attach user to request
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}
