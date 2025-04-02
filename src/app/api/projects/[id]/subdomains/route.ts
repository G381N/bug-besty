import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subdomain from '@/models/Subdomain';
import { ApiError } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const subdomains = await Subdomain.find({ projectId: params.id });
    return NextResponse.json(subdomains);
  } catch {
    const error: ApiError = { 
      error: 'Failed to fetch subdomains',
      status: 500
    };
    return NextResponse.json(error, { status: 500 });
  }
} 