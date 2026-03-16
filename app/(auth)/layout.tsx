export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-500">SidelinePro</h1>
        <p className="text-sm text-gray-500 mt-1">Youth Basketball Coaching Platform</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
