import NextAuth from "next-auth"
import LineProvider from "next-auth/providers/line"

const authOptions = {
  providers: [
    LineProvider({
      clientId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
