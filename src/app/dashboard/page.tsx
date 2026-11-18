import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verifica no servidor se o usuário está logado
  const { data: { user } } = await supabase.auth.getUser()

  // Se não estiver logado, expulsa ele de volta para o login (Segurança)
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--gj-roxo)] mb-2">Área de Membros</h1>
        <p className="text-gray-600 mb-8">Bem-vindo, {user.email}!</p>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold mb-4">Meus Jogos e Estatísticas</h2>
          <p className="text-gray-500">Aqui ficará o simulador de matrizes e o histórico.</p>
          <button className="mt-4 bg-[var(--gj-verde)] text-white px-6 py-2 rounded-lg font-bold">
            Novo Simulado
          </button>
        </div>
      </div>
    </div>
  )
}