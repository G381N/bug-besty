import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vulnerability from '@/models/Vulnerability';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const vulnerabilities = await Vulnerability.find({ 
      subdomainId: params.id 
    }).sort({ severity: -1, type: 1 });
    
    if (!vulnerabilities) {
      return NextResponse.json([]);  // Return empty array if no vulnerabilities found
    }
    
    return NextResponse.json(vulnerabilities);
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerabilities' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const data = await request.json();
    
    const vulnerability = await Vulnerability.create({
      ...data,
      subdomainId: params.id
    });
    
    return NextResponse.json(vulnerability);
  } catch (error) {
    console.error('Error creating vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to create vulnerability' },
      { status: 500 }
    );
  }
} 