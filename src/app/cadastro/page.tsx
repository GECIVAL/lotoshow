'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nome,
        },
      },
    })

    if (signUpError) {
      setError('Erro ao criar conta: ' + signUpError.message)
      setLoading(false)
      return
    }

    setMessage('Conta criada com sucesso! Redirecionando...')
    const redirectDestino =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect')
        : null

    setTimeout(() => {
      if (redirectDestino) {
        router.push(`/login?redirect=${encodeURIComponent(redirectDestino)}`)
      } else {
        router.push('/login')
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-4">
          <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-[var(--gj-roxo)]">
            ← Voltar para a página inicial
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--gj-roxo)]">Criar Conta Grátis</h1>
          <p className="text-gray-500 text-sm mt-2">
            Cadastre-se gratuitamente para liberar a aba de <strong>Estatística</strong>.
          </p>
        </div>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--gj-roxo)] focus:border-transparent outline-none transition"
              placeholder="Ex.: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--gj-roxo)] focus:border-transparent outline-none transition"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--gj-roxo)] focus:border-transparent outline-none transition"
                placeholder="Mínimo de 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                tabIndex={-1}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--gj-roxo)] transition"
              >
                {mostrarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
            <div className="relative">
              <input
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--gj-roxo)] focus:border-transparent outline-none transition"
                placeholder="Repita a senha"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                tabIndex={-1}
                aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--gj-roxo)] transition"
              >
                {mostrarConfirmar ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-200 font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Cadastrar Grátis'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[var(--gj-roxo)] font-bold hover:underline">
            Faça Login
          </Link>
        </div>
      </div>
    </div>
  )
}
