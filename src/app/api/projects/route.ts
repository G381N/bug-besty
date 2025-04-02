import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createTask } from "@/lib/backgroundTasks";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const projects = await Project.find({ 
      userId: session.user.id,
      status: 'active' 
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, targetDomain, enumerationMethod } = await req.json();

    if (!name || !targetDomain) {
      return NextResponse.json(
        { error: "Name and target domain are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Create project in database
    const project = await Project.create({
      name,
      targetDomain,
      owner: session.user.id,
      status: "initializing", // New status to indicate enumeration in progress
    });

    // If auto enumeration is selected, create a background task
    if (enumerationMethod === "auto") {
      const task = await createTask("subdomain_enumeration", {
        projectId: project._id.toString(),
        targetDomain,
      });
      
      // Store task ID in project
      project.enumerationTaskId = task.id;
      await project.save();
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        targetDomain: project.targetDomain,
        status: project.status,
        enumerationTaskId: project.enumerationTaskId || null,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
} 