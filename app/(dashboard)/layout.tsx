import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from './components/NavBar'
import CommsPanel from './components/CommsPanel'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-sp-bg">
      <NavBar email={user.email ?? ''} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <CommsPanel />
    </div>
  )
}
