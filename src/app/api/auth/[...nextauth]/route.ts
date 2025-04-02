import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Create a cached connection to improve performance
let cachedConnection = null;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          // More robust connection handling
          if (!cachedConnection) {
            console.log("Establishing MongoDB connection...");
            try {
              cachedConnection = await connectToDatabase();
              console.log("MongoDB connection established successfully");
            } catch (connError) {
              console.error("MongoDB connection failed:", connError.message);
              // Throw a clear error that will show in logs
              throw new Error(`MongoDB connection failed: ${connError.message}`);
            }
          }
          
          console.log(`Attempting to find user with email: ${credentials.email}`);
          
          // Ensure User model is properly initialized
          if (!mongoose.models.User && User) {
            console.log("Initializing User model");
          }
          
          // Direct query without timeout to see if that's causing issues
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log("No user found with provided email");
            return null;
          }

          console.log("User found, validating password");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("Password validation failed");
            return null;
          }

          console.log("Authentication successful");
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          console.error("Error stack:", error.stack);
          
          // Specific error handling
          if (error.message && error.message.includes("IP address is not allowed")) {
            console.error("MongoDB Atlas IP whitelist error - please add Vercel's IP to MongoDB Atlas Network Access");
          }
          
          if (error.name === "MongooseServerSelectionError") {
            console.error("Could not connect to MongoDB server. Please check your connection string and network settings.");
          }
          
          return null;
        }
      },
    }),
  ],
  debug: true, // Enable debug mode for development
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true", // Custom error page
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 