import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TrainingContent from '@/models/TrainingContent';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const content = await TrainingContent.findById(params.id);
    
    if (!content) {
      return NextResponse.json({ error: 'Training content not found' }, { status: 404 });
    }
    
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch training content' }, { status: 500 });
  }
} 