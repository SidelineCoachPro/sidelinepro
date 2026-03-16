import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-sp-bg flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-sp-orange mb-2">SidelinePro</h1>
        <p className="text-sp-text text-lg font-medium">Welcome to SidelinePro</p>
        <p className="mt-1 text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>
          Signed in as {user?.email}
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="text-sm font-medium text-sp-orange hover:opacity-80 transition-opacity"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
