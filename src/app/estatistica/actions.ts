"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TABELAS_PERMITIDAS: Record<
  string,
  { tabela: string; totalDezenas: number; blocoColunas: number; qtdJogoPadrao: number; nome: string }
> = {
  lotofacil: {
    nome: "Lotofácil",
    tabela: "resultados_lotofacil",
    totalDezenas: 25,
    blocoColunas: 5,
    qtdJogoPadrao: 20,
  },
  megasena: {
    nome: "Mega-Sena",
    tabela: "resultados_megasena",
    totalDezenas: 60,
    blocoColunas: 10,
    qtdJogoPadrao: 15,
  },
  quina: {
    nome: "Quina",
    tabela: "resultados_quina",
    totalDezenas: 80,
    blocoColunas: 10,
    qtdJogoPadrao: 15,
  },
  lotomania: {
    nome: "Lotomania",
    tabela: "resultados_lotomania",
    totalDezenas: 100,
    blocoColunas: 10,
    qtdJogoPadrao: 70,
  },
  diadesorte: {
    nome: "Dia de Sorte",
    tabela: "resultados_diadesorte",
    totalDezenas: 31,
    blocoColunas: 10,
    qtdJogoPadrao: 15,
  },
  duplasena: {
    nome: "Dupla Sena",
    tabela: "resultados_duplasena",
    totalDezenas: 50,
    blocoColunas: 10,
    qtdJogoPadrao: 15,
  },
  timemania: {
    nome: "Timemania",
    tabela: "resultados_timemania",
    totalDezenas: 80,
    blocoColunas: 10,
    qtdJogoPadrao: 15,
  },
  maismilionaria: {
    nome: "+Milionária",
    tabela: "resultados_maismilionaria",
    totalDezenas: 50,
    blocoColunas: 10,
    qtdJogoPadrao: 12,
  },
};

export async function carregarGraficoLoteriaAction(chaveLoteria: string) {
  const cfg = TABELAS_PERMITIDAS[chaveLoteria] ?? TABELAS_PERMITIDAS.lotofacil;

  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    // Bloqueio de segurança: Usuário DEVE estar logado para visualizar o gráfico oficial
    if (!user) {
      return {
        sucesso: false,
        logado: false,
        precisaLogar: true,
        config: cfg,
        concursos: [],
        erro: "Você precisa estar conectado em sua conta para visualizar as estatísticas e mapas gráficos oficiais dos últimos 300 concursos.",
      };
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from(cfg.tabela)
      .select("concurso, data_sorteio, dezenas")
      .order("concurso", { ascending: false })
      .limit(300);

    if (error) {
      return {
        sucesso: false,
        logado: true,
        precisaLogar: false,
        config: cfg,
        concursos: [],
        erro: error.message,
      };
    }

    return {
      sucesso: true,
      logado: true,
      precisaLogar: false,
      config: cfg,
      concursos: (data ?? []).map((r) => ({
        concurso: r.concurso as number,
        data: r.data_sorteio as string,
        dezenas: r.dezenas as number[],
      })),
    };
  } catch (e: unknown) {
    return {
      sucesso: false,
      logado: false,
      precisaLogar: true,
      config: cfg,
      concursos: [],
      erro: e instanceof Error ? e.message : "Erro ao carregar gráfico.",
    };
  }
}
