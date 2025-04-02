import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

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

export async function POST(request: Request) {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Connected successfully');

    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received project data:', data);

    // Add userId to the project data
    const projectData = {
      ...data,
      userId: session.user.id
    };

    const project = await Project.create(projectData);
    console.log('Created project in database:', project);
    
    // Verify the project was created
    const savedProject = await Project.findById(project._id);
    console.log('Verified project in database:', savedProject);

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ 
      error: 'Failed to create project', 
      details: error.message 
    }, { status: 500 });
  }
} 