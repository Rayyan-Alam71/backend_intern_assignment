import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";
const app = express();

import * as dotenv from "dotenv"
dotenv.config()


// Middleware
app.use(cors());
app.use(express.json());

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
const JWT_EXPIRES_IN = "7d";

// Helper: get token from header
function getTokenFromHeader(req: express.Request) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return "";
}

// Helper: verify JWT and get user
async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });
    return user;
  } catch {
    return null;
  }
}

// ==================== AUTH ROUTES ====================

// POST /auth/register
app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /auth/login
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /auth/me
app.get("/api/v1/auth/me", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Get me error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== TASK ROUTES ====================

// GET /tasks
app.get("/api/v1/tasks", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Admin sees all tasks, user sees only their own
    const where = user.role === "ADMIN" ? {} : { userId: user.id };
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error("Get tasks error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /tasks
app.post("/api/v1/tasks", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || "",
        userId: user.id,
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /tasks/:id
app.put("/api/v1/tasks/:id", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const { id } = req.params;
    const { title, description, status } = req.body;

    // Find task
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check ownership (only owner or admin can update)
    if (task.userId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Update
    const updated = await prisma.task.update({
      where: { id },
      data: { title, description, status },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update task error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /tasks/:id
app.delete("/api/v1/tasks/:id", async (req, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const { id } = req.params;

    // Find task
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check ownership
    if (task.userId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Delete
    await prisma.task.delete({ where: { id } });

    res.json({ success: true, data: { message: "Task deleted" } });
  } catch (error: any) {
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
