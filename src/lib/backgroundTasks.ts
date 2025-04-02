import { createClient } from "@vercel/kv";
import { v4 as uuidv4 } from "uuid";

// Initialize Vercel KV storage client
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Task status constants
export const TASK_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

export interface Task {
  id: string;
  type: string;
  status: string;
  data: any;
  result?: any;
  error?: string;
  progress?: number;
  createdAt: number;
  updatedAt: number;
}

// Create a new task
export async function createTask(type: string, data: any): Promise<Task> {
  const task: Task = {
    id: uuidv4(),
    type,
    status: TASK_STATUS.PENDING,
    data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: 0,
  };

  await kv.set(`task:${task.id}`, JSON.stringify(task));
  // Add to processing queue
  await kv.lpush("task_queue", task.id);
  
  return task;
}

// Update a task's status and optional data
export async function updateTask(
  taskId: string, 
  status: string, 
  updates: Partial<Task> = {}
): Promise<Task> {
  const taskStr = await kv.get(`task:${taskId}`);
  if (!taskStr) throw new Error(`Task ${taskId} not found`);
  
  const task = JSON.parse(taskStr as string) as Task;
  const updatedTask = {
    ...task,
    ...updates,
    status,
    updatedAt: Date.now(),
  };
  
  await kv.set(`task:${taskId}`, JSON.stringify(updatedTask));
  return updatedTask;
}

// Get a task by ID
export async function getTask(taskId: string): Promise<Task | null> {
  const taskStr = await kv.get(`task:${taskId}`);
  if (!taskStr) return null;
  return JSON.parse(taskStr as string) as Task;
}

// Update progress of a task
export async function updateTaskProgress(
  taskId: string, 
  progress: number, 
  partialResults?: any
): Promise<Task> {
  const updates: Partial<Task> = { progress };
  if (partialResults) {
    updates.result = partialResults;
  }
  return updateTask(taskId, TASK_STATUS.PROCESSING, updates);
} 