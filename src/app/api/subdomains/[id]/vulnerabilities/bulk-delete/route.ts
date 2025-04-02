import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vulnerability from '@/models/Vulnerability';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { vulnerabilityIds } = await request.json();

    // Verify all vulnerabilities belong to this subdomain
    const vulnerabilities = await Vulnerability.find({
      _id: { $in: vulnerabilityIds },
      subdomainId: params.id
    });

    if (vulnerabilities.length !== vulnerabilityIds.length) {
      return NextResponse.json(
        { error: 'Some vulnerabilities do not belong to this subdomain' },
        { status: 400 }
      );
    }

    // Delete the vulnerabilities
    await Vulnerability.deleteMany({
      _id: { $in: vulnerabilityIds },
      subdomainId: params.id
    });

    return NextResponse.json({ message: 'Vulnerabilities deleted successfully' });
  } catch (error) {
    console.error('Error deleting vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to delete vulnerabilities' },
      { status: 500 }
    );
  }
} 