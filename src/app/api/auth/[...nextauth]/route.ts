import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Create a cached connection to improve performance
let cachedConnection = null;

// Connect to database outside of handler to improve cold start performance
const dbPromise = connectToDatabase().catch(err => {
  console.error("Failed to establish initial database connection:", err);
});

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
          // Wait for the initial connection if it's still in progress
          if (dbPromise) await dbPromise;
          
          // Don't reconnect - just use the cached connection
          if (!mongoose.connection.readyState) {
            console.log("Connection lost - reconnecting to MongoDB...");
            await connectToDatabase();
          }
          
          console.log(`Searching for user with email: ${credentials.email}`);
          
          // Add timeout for the query
          const queryPromise = User.findOne({ email: credentials.email }).lean().exec();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Database query timeout")), 5000)
          );
          
          // Race the query against a timeout
          const user = await Promise.race([queryPromise, timeoutPromise]);
          
          if (!user) {
            console.log("No user found");
            return null;
          }

          console.log("User found, checking password");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log("Invalid password");
            return null;
          }

          console.log("Authentication successful");
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authentication error:", error.message);
          
          if (error.message === "Database query timeout") {
            console.error("Database query took too long - consider optimizing your database");
          }
          
          return null;
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true", 
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