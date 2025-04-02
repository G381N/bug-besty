import mongoose from 'mongoose';
import { validateEnv } from '@/utils/validateEnv';

let cachedConnection = null;

export async function connectToDatabase() {
  // First validate environment variables
  if (!validateEnv()) {
    throw new Error("Environment validation failed - check server logs");
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    console.log("Connecting to MongoDB from Vercel environment...");
    
    // Print environment info for debugging
    console.log(`Node environment: ${process.env.NODE_ENV}`);
    console.log(`Vercel environment: ${process.env.VERCEL_ENV || 'not set'}`);
    
    // Add connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 10000, // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      // Disable strict SSL validation temporarily if needed
      // ssl: true,
      // sslValidate: false,
    };

    mongoose.set("strictQuery", false);
    
    // Direct connection without regex sanitization to avoid any issues
    console.log(`Using MongoDB URI from environment variables`);
    
    // Connect with explicit URI from environment
    const mongoUri = process.env.MONGODB_URI;
    const connection = await mongoose.connect(mongoUri, options);
    console.log("MongoDB connected successfully");
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    
    if (error.name === "MongooseServerSelectionError") {
      console.error("CRITICAL: IP whitelist issue - You MUST add 0.0.0.0/0 to MongoDB Atlas Network Access settings");
      console.error("Please visit MongoDB Atlas dashboard and update Network Access settings immediately");
    }
    
    throw error;
  }
}

export default connectToDatabase;