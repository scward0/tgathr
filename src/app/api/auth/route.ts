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
      
      // Set cookie
      cookies().set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: process.env.NODE_ENV === 'production' ? '.tgathr.app' : undefined,
      })
      
      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }
      })
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
      
      // Set cookie
      cookies().set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: process.env.NODE_ENV === 'production' ? '.tgathr.app' : undefined,
      })
      
      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email }
      })
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
  cookies().set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  })
  
  return NextResponse.json({ success: true })
}
