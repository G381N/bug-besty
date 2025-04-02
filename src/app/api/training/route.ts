import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TrainingContent from '@/models/TrainingContent';

export async function GET() {
  try {
    await dbConnect();
    const content = await TrainingContent.find({}).sort({ createdAt: -1 });
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch training content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    const content = await TrainingContent.create(data);
    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create training content' }, { status: 500 });
  }
} 