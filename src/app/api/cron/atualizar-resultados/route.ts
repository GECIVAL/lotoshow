import { NextResponse, type NextRequest } from "next/server";
import { sincronizarTodasAsLoterias300 } from "@/lib/loterias/sincronizador";

/**
 * Rota automática acionada diariamente às 01:00 (Horário de Brasília / 04:00 UTC).
 * Mantém cada tabela isolada de loteria rigorosamente com os últimos 300 concursos oficiais.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const segredoCron = process.env.CRON_SECRET || process.env.SENHA_MESTRE;

  if (!segredoCron || authHeader !== `Bearer ${segredoCron}`) {
    return NextResponse.json(
      { ok: false, erro: "Acesso não autorizado ao agendador." },
      { status: 401 }
    );
  }

  const relatorio = await sincronizarTodasAsLoterias300(false);

  return NextResponse.json({
    ok: true,
    executadoEmBrasilia: new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    }),
    relatorio,
  });
}
