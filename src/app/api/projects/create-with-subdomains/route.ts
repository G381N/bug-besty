import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';
import { vulnerabilityTypes } from '@/constants/vulnerabilityTypes';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  let project = null;
  let createdSubdomains = [];

  try {
    await dbConnect();
    
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, subdomains } = body;

    if (!name || !subdomains || !Array.isArray(subdomains)) {
      return NextResponse.json({ 
        error: 'Invalid input', 
        details: 'Name and subdomains array are required' 
      }, { status: 400 });
    }

    // Check if active project exists
    const existingProject = await Project.findOne({ name, status: 'active' });
    
    if (existingProject) {
      const existingSubdomains = await Subdomain.find({ projectId: existingProject._id });
      
      if (existingSubdomains.length > 0) {
        return NextResponse.json({ 
          error: 'Project exists', 
          details: 'An active project with this name already exists' 
        }, { status: 409 });
      }

      await Project.findByIdAndUpdate(existingProject._id, { status: 'archived' });
    }

    // Create new project with userId
    project = await Project.create({
      name,
      mainDomain: name,
      status: 'active',
      userId: session.user.id
    });

    // Process subdomains
    const validSubdomains = subdomains.filter(subdomain => 
      subdomain && subdomain.trim().length > 0
    );

    // Create subdomains and vulnerabilities
    for (const subdomain of validSubdomains) {
      const newSubdomain = await Subdomain.create({
        projectId: project._id,
        name: subdomain.trim(),
        status: 'scanning'
      });

      // Create vulnerabilities
      await Promise.all(vulnerabilityTypes.map(vulnType => 
        Vulnerability.create({
          subdomainId: newSubdomain._id,
          type: vulnType.type,
          severity: vulnType.severity,
          status: 'Not Yet Done'
        })
      ));

      createdSubdomains.push(newSubdomain);
    }

    return NextResponse.json({
      project,
      subdomains: createdSubdomains,
      message: 'Project and subdomains created successfully'
    });

  } catch (error: any) {
    // Cleanup if something went wrong
    if (project) {
      await Project.findByIdAndDelete(project._id);
      
      for (const subdomain of createdSubdomains) {
        await Vulnerability.deleteMany({ subdomainId: subdomain._id });
        await Subdomain.findByIdAndDelete(subdomain._id);
      }
    }

    return NextResponse.json({ 
      error: 'Failed to create project with subdomains',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
} 