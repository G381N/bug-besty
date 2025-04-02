import mongoose from 'mongoose';

let cachedConnection = null;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    
    // Add connection options to improve performance and reliability
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };

    mongoose.set("strictQuery", false);
    
    // Log connection string (without password) for debugging
    const sanitizedUri = process.env.MONGODB_URI.replace(
      /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
      'mongodb+srv://$1:****@'
    );
    console.log(`Attempting to connect to: ${sanitizedUri}`);
    
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log("MongoDB connected successfully");
    
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    
    // Additional debugging for specific errors
    if (error.name === "MongooseServerSelectionError") {
      console.error("Could not connect to any MongoDB servers. Please check your connection string and ensure IP whitelist includes 0.0.0.0/0");
    }
    
    throw error;
  }
}

export default connectToDatabase;