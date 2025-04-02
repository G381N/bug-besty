import { NextResponse } from "next/server";
import { updateTask, getTask, TASK_STATUS, updateTaskProgress } from "@/lib/backgroundTasks";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Subdomain from "@/models/Subdomain";
import { enumerateSubdomains } from "@/lib/enumeration";

// This endpoint is called by a cron job to process tasks
export async function POST(req: Request) {
  try {
    const { authorization } = req.headers;
    const token = process.env.CRON_SECRET;
    
    // Verify the request is authorized
    if (authorization !== `Bearer ${token}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }
    
    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    if (task.status !== TASK_STATUS.PENDING && task.status !== TASK_STATUS.PROCESSING) {
      return NextResponse.json({ 
        error: `Task is ${task.status}, cannot process` 
      }, { status: 400 });
    }
    
    // Mark as processing
    await updateTask(taskId, TASK_STATUS.PROCESSING);
    
    // Connect to database
    await connectToDatabase();
    
    // Process based on task type
    if (task.type === "subdomain_enumeration") {
      // Get project details
      const project = await Project.findById(task.data.projectId);
      if (!project) {
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: "Project not found"
        });
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      
      // Process enumeration in chunks
      const targetDomain = task.data.targetDomain;
      const chunkSize = 50; // Process 50 subdomains at a time
      const totalApis = 15; // Total number of enumeration APIs
      
      try {
        // Retrieve existing progress if available
        let progress = task.progress || 0;
        let processedApis = Math.floor(progress * totalApis / 100);
        let allSubdomains = task.result?.subdomains || [];
        
        // Start enumeration from the last processed API
        const { subdomains, completedApis } = await enumerateSubdomains(
          targetDomain, 
          processedApis, 
          chunkSize
        );
        
        // Combine with existing results and deduplicate
        allSubdomains = [...new Set([...allSubdomains, ...subdomains])];
        
        // Calculate new progress
        const newProgress = Math.min(100, Math.floor((completedApis / totalApis) * 100));
        
        // Store partial results
        await updateTaskProgress(taskId, newProgress, {
          subdomains: allSubdomains,
          completedApis
        });
        
        // If completed all APIs, save results to database
        if (completedApis >= totalApis) {
          // Save subdomains to database
          const subdomainDocs = await Promise.all(
            allSubdomains.map(hostname => 
              Subdomain.findOneAndUpdate(
                { hostname, project: project._id },
                { 
                  hostname,
                  project: project._id,
                  discoveryMethod: "auto_enumeration", 
                  status: "active"
                },
                { upsert: true, new: true }
              )
            )
          );
          
          // Update project status
          project.status = "active";
          project.subdomainsCount = allSubdomains.length;
          await project.save();
          
          // Mark task as completed
          await updateTask(taskId, TASK_STATUS.COMPLETED, {
            result: {
              subdomains: allSubdomains,
              count: allSubdomains.length
            }
          });
          
          return NextResponse.json({
            success: true,
            message: "Enumeration completed",
            subdomainsCount: allSubdomains.length
          });
        }
        
        // Return partial progress
        return NextResponse.json({
          success: true,
          message: "Partial enumeration processed",
          progress: newProgress,
          subdomainsCount: allSubdomains.length
        });
        
      } catch (error) {
        console.error("Enumeration error:", error);
        await updateTask(taskId, TASK_STATUS.FAILED, {
          error: error.message
        });
        return NextResponse.json({ 
          error: "Enumeration failed", 
          details: error.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      error: "Unknown task type" 
    }, { status: 400 });
    
  } catch (error) {
    console.error("Task processing error:", error);
    return NextResponse.json({ 
      error: "Failed to process task" 
    }, { status: 500 });
  }
} 