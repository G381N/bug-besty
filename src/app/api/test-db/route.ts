import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log("Testing database connection...");
    
    // Test if we can connect to MongoDB
    const conn = await connectToDatabase();
    
    // Get list of collections to verify connection is working
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      collections: collectionNames,
      mongoVersion: mongoose.version
    });
  } catch (error) {
    console.error("Database test failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      errorType: error.name,
      stack: error.stack
    }, { status: 500 });
  }
} 