export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#16A34A] rounded-xl mb-4">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SureBetFlow</h1>
          <p className="text-gray-500 text-sm mt-1">Gerenciador de Apostas Seguras</p>
        </div>
        {children}
      </div>
    </div>
  )
}
