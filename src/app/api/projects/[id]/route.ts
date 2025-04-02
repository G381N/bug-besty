import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Verify project exists
    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found' 
      }, { status: 404 });
    }

    // Delete in sequence to maintain data integrity
    const subdomains = await Subdomain.find({ projectId: params.id });
    
    for (const subdomain of subdomains) {
      // Delete vulnerabilities first
      await Vulnerability.deleteMany({ subdomainId: subdomain._id });
      // Then delete the subdomain
      await Subdomain.findByIdAndDelete(subdomain._id);
    }

    // Finally delete the project
    await Project.findByIdAndDelete(params.id);

    return NextResponse.json({ 
      message: 'Project and all associated data deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ 
      error: 'Failed to delete project and associated data',
      details: error.message 
    }, { status: 500 });
  }
} 