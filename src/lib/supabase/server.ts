import dns from 'node:dns'
import net from 'node:net'
import tls from 'node:tls'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

dns.setDefaultResultOrder('ipv4first')
net.setDefaultAutoSelectFamily(false)

try {
  const tlsAny = tls as unknown as {
    getCACertificates?: (type: string) => string[];
    setDefaultCACertificates?: (certs: string[]) => void;
  };
  if (typeof tlsAny.getCACertificates === 'function' && typeof tlsAny.setDefaultCACertificates === 'function') {
    tlsAny.setDefaultCACertificates([
      ...tlsAny.getCACertificates('default'),
      ...tlsAny.getCACertificates('system'),
    ]);
  }
} catch {
  // Ignora caso o ambiente não suporte getCACertificates
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se chamado de um Server Component
          }
        },
      },
    }
  )
}