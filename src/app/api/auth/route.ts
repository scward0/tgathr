// import { NextResponse } from 'next/server'
// import { cookies } from 'next/headers'

// const PASSWORD = 'alltogather'

// export async function POST(request: Request) {
//   const { password } = await request.json()

//   if (password === PASSWORD) {
//     // Set a cookie to remember the authentication
//     cookies().set('auth', 'true', {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 60 * 60 * 24 * 7, // 1 week
//     })

//     return NextResponse.json({ success: true })
//   }

//   return NextResponse.json(
//     { error: 'Invalid password' },
//     { status: 401 }
//   )
// }

// Auth temporarily disabled
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Auth temporarily disabled' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Auth temporarily disabled' }, { status: 404 });
}
