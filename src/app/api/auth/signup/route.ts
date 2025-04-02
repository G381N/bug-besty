import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    // Connect to database first
    console.log('Attempting database connection...');
    await dbConnect();
    console.log('Database connected successfully');

    // Parse request body
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Processing signup request for:', email);

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    try {
      // Check for existing user
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        console.log('User already exists with email:', email);
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      console.log('User created successfully:', user._id);

      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // Handle MongoDB duplicate key error
      if (dbError instanceof Error && 'code' in dbError && dbError.code === 11000) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }

      throw dbError;
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    // Ensure error has a message property
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { 
        error: 'Failed to create account',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
