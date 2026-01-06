import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="text-2xl font-bold mt-4">Page not found</h2>
        <p className="text-muted-foreground mt-2">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
