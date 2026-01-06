import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const user = {
    email: session.user.email,
    full_name: profile?.full_name || session.user.user_metadata?.full_name,
    avatar_url: profile?.avatar_url,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="md:pl-64">
        <Header user={user} />
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  )
}
