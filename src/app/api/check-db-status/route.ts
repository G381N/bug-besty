import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { handleApiError } from "../error-handler";

// This lightweight endpoint helps verify MongoDB connection
export async function GET() {
  try {
    await connectToDatabase();
    
    return NextResponse.json({ 
      status: "ok", 
      message: "Database connection is working",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleApiError(error);
  }
} 