'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Wallet, Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupForm = z.infer<typeof signupSchema>

const features = [
  'Track unlimited transactions',
  'Investment portfolio tracking',
  'Budget management',
  'Detailed analytics & reports',
  'Multi-currency support',
  'Secure & private',
]

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (error) {
        toast({
          title: 'Signup failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      })

      router.push('/login?message=check-email')
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-12 flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FinanceFlow</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Start your financial journey
            </h1>
            <p className="text-lg text-white/80">
              Join thousands of users who have taken control of their finances with FinanceFlow.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-white/90 uppercase tracking-wide">
              What you get:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          Free forever. No credit card required.
        </p>
      </div>

      {/* Right side - Signup form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">FinanceFlow</span>
          </div>

          <Card className="border-0 shadow-xl sm:border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center sm:text-left">
                Create an account
              </CardTitle>
              <CardDescription className="text-center sm:text-left">
                Enter your details to get started
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      {...register('fullName')}
                      error={!!errors.fullName}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...register('email')}
                      error={!!errors.email}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      {...register('password')}
                      error={!!errors.password}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      {...register('confirmPassword')}
                      error={!!errors.confirmPassword}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
