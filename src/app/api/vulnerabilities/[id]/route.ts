import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vulnerability from '@/models/Vulnerability';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const data = await request.json();
    
    const vulnerability = await Vulnerability.findByIdAndUpdate(
      params.id,
      { $set: { 
          ...(data.status && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes })
        } 
      },
      { new: true }
    );
    
    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(vulnerability);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update vulnerability' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const vulnerability = await Vulnerability.findById(params.id);
    
    if (!vulnerability) {
      return NextResponse.json(
        { error: 'Vulnerability not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vulnerability);
  } catch (error) {
    console.error('Error fetching vulnerability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vulnerability' },
      { status: 500 }
    );
  }
} 