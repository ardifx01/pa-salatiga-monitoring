import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connection from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const db = await connection;
          const [rows] = await db.execute(
            'SELECT * FROM admin_users WHERE username = ?',
            [credentials.username]
          );
          
          const users = rows as any[];
          const user = users[0];

          if (user && await bcrypt.compare(credentials.password, user.password)) {
            return {
              id: user.id.toString(),
              username: user.username,
              email: user.email,
              name: user.full_name
            };
          }
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};