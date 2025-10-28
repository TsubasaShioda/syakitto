import NextAuth from 'next-auth'
import LineProvider from 'next-auth/providers/line'
import { supabase } from '@/lib/supabase'

const handler = NextAuth({
  providers: [
    LineProvider({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
      authorization: {
        params: { scope: "profile openid" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('[NextAuth Callback] JWT User:', user);
      console.log('[NextAuth Callback] JWT User ID:', user?.id);
      if (account?.provider === 'line' && user) {
        token.id = user.id; // Add Supabase user ID to the JWT token
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth Callback] Session Token:', token);
      console.log('[NextAuth Callback] Session Token ID:', token?.id);
      if (token?.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
        };
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'line') {
        const { data, error } = await supabase
          .from('users')
          .upsert(
            {
              line_user_id: profile?.sub,
              display_name: profile?.name,
            },
            { onConflict: 'line_user_id' }
          )
          .select()

        if (error) {
          console.error('Error upserting user to Supabase:', error)
          return false
        }
        if (data && data.length > 0) {
          user.id = data[0].id // Store Supabase user ID in NextAuth user object
          return true;
        }
      }
      return true // If not a line provider, or no data, still allow sign in
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
