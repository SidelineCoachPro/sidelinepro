export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sp-bg flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-[28px] font-bold text-sp-orange tracking-tight">SidelinePro</h1>
        <p className="text-sm mt-2" style={{ color: "rgba(241,245,249,0.45)" }}>
          The complete coaching OS for youth basketball
        </p>
      </div>

      <div
        className="w-full max-w-[360px] rounded-xl p-7"
        style={{
          backgroundColor: "#0E1520",
          border: "1px solid rgba(241,245,249,0.07)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
