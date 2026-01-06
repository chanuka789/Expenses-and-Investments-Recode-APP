'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Wallet, Mail, Lock, ArrowRight, TrendingUp, PiggyBank, BarChart3 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      })

      router.push(redirectTo)
      router.refresh()
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

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@financeflow.app',
        password: 'demo123456',
      })

      if (error) {
        toast({
          title: 'Demo login failed',
          description: 'Demo account is not available. Please sign up instead.',
          variant: 'destructive',
        })
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong.',
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
              Take control of your finances
            </h1>
            <p className="text-lg text-white/80">
              Track expenses, manage investments, and achieve your financial goals with our powerful yet simple platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Investment Tracking</h3>
                <p className="text-sm text-white/70">Monitor your portfolio performance</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Smart Budgeting</h3>
                <p className="text-sm text-white/70">Set and track spending limits</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 rounded-lg p-4">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Detailed Analytics</h3>
                <p className="text-sm text-white/70">Understand your spending patterns</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/60">
          Secure, private, and designed for you.
        </p>
      </div>

      {/* Right side - Login form */}
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
                Welcome back
              </CardTitle>
              <CardDescription className="text-center sm:text-left">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="Enter your password"
                      className="pl-10"
                      {...register('password')}
                      error={!!errors.password}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleDemoLogin}
                disabled={isLoading}
              >
                Try Demo Account
              </Button>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
