import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/v1/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5000/api/v1/tasks",
        { title: newTitle, description: newDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task created");
      setNewTitle("");
      setNewDescription("");
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

        <form onSubmit={handleCreateTask} className="bg-white p-4 rounded shadow mb-6">
          <h3 className="font-bold mb-4">Create New Task</h3>
          <div className="mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={user?.id || ""}
              userRole={user?.role || ""}
              onUpdate={fetchTasks}
            />
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-gray-500 text-center mt-8">No tasks yet. Create one above!</p>
        )}
      </div>
    </div>
  );
}

function Navbar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Task Manager</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-gray-300">
              {user.name} ({user.role})
            </span>
          )}
          <button
            onClick={onLogout}
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  userRole: string;
  onUpdate: () => void;
}

function TaskCard({ task, currentUserId, userRole, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);

  const canEdit = userRole === "ADMIN" || task.userId === currentUserId;

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `http://localhost:5000/api/v1/tasks/${task.id}`,
        { title, description, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task updated");
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/v1/tasks/${task.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Task deleted");
      onUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-100 p-4 rounded border">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded mb-2"
          placeholder="Description"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        >
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow border">
      <h3 className="font-bold text-lg">{task.title}</h3>
      <p className="text-gray-600 text-sm mb-2">{task.description || "No description"}</p>
      <span className={`inline-block px-2 py-1 rounded text-xs ${
        task.status === "DONE" ? "bg-green-100 text-green-800" :
        task.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
        "bg-gray-100 text-gray-800"
      }`}>
        {task.status}
      </span>
      {canEdit && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
            Edit
          </button>
          <button onClick={handleDelete} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
