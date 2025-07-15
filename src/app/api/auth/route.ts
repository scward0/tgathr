import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { hashPassword, comparePassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'register') {
      const { name, email, password } = registerSchema.parse(body)
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        )
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      })
      
      // Generate JWT token
      const token = signToken({ userId: user.id, email: user.email })
      
      // Create response with token for localStorage fallback
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        token: token
      })
      
      // Set cookie using headers.append (response.cookies.set creates wrong header)
      const cookieValue = `session-id=${token}; Path=/; Max-Age=604800; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}HttpOnly`
      response.headers.append('Set-Cookie', cookieValue)
      
      return response
    }
    
    if (action === 'login') {
      const { email, password } = loginSchema.parse(body)
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
      
      // Verify password
      const isValid = await comparePassword(password, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
      
      // Generate JWT token
      const token = signToken({ userId: user.id, email: user.email })
      
      // Create response with token for localStorage fallback
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        token: token
      })
      
      // Set cookie using headers.append (response.cookies.set creates wrong header)
      const cookieValue = `session-id=${token}; Path=/; Max-Age=604800; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}HttpOnly`
      response.headers.append('Set-Cookie', cookieValue)
      
      return response
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout
  const response = NextResponse.json({ success: true })
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  
  return response
}