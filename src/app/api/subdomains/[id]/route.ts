import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const subdomain = await Subdomain.findById(params.id);
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(subdomain);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subdomain' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    // Delete all vulnerabilities associated with this subdomain
    await Vulnerability.deleteMany({ subdomainId: params.id });
    
    // Delete the subdomain
    const subdomain = await Subdomain.findByIdAndDelete(params.id);
    
    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Subdomain deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete subdomain' },
      { status: 500 }
    );
  }
} 