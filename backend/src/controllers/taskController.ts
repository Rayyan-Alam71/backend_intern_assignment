import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/authenticate";

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const user = req.user!;

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
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    const { title, description } = req.body;
    const user = req.user!;

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
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const user = req.user!;

    const task = await prisma.task.findUnique({ where: { id: id as string } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check ownership (only owner or admin can update)
    if (task.userId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await prisma.task.update({
      where: { id: id as string },
      data: { title, description, status },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update task error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await prisma.task.findUnique({ where: { id: id as string } });
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check ownership
    if (task.userId !== user.id && user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await prisma.task.delete({ where: { id: id as string } });

    res.json({ success: true, data: { message: "Task deleted" } });
  } catch (error: any) {
    console.error("Delete task error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
