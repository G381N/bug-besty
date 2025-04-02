import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all user's projects
    const projects = await Project.find({ userId: session.user.id });

    // Delete all associated data
    for (const project of projects) {
      const subdomains = await Subdomain.find({ projectId: project._id });
      
      for (const subdomain of subdomains) {
        await Vulnerability.deleteMany({ subdomainId: subdomain._id });
        await Subdomain.findByIdAndDelete(subdomain._id);
      }
      
      await Project.findByIdAndDelete(project._id);
    }

    // Finally, delete the user
    await User.findByIdAndDelete(session.user.id);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 