export function validateEnv() {
  if (!process.env.MONGODB_URI) {
    console.error('⚠️ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.error('⚠️ NEXTAUTH_SECRET is not defined in .env');
    process.exit(1);
  }

  if (!process.env.NEXTAUTH_URL) {
    console.warn('⚠️ NEXTAUTH_URL is not defined in .env, using default http://localhost:3000');
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
  }

  console.log('✅ Environment variables validated');
} 