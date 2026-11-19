"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface OpcaoMatrizLotofacil {
  id: number;
  nomeComercial: string;
  qtdDezenasEscolhidas: number;
  qtdCartoesGerados: number;
}

export interface ConcursoOficialLotofacil {
  concurso: number;
  data: string;
  dezenas: number[];
}

export interface FaixaPremiacaoResumo {
  pontos: number;
  qtdCartoes: number;
  premioUnitario: number;
  subtotal: number;
}

export interface ResultadoSimulacaoLotofacil {
  sucesso: boolean;
  erro?: string;
  qtdCartoesTotal?: number;
  custoUnitarioCartao?: number;
  valorTotalJogo?: number;
  faixas?: FaixaPremiacaoResumo[];
  totalCartoesPremiados?: number;
  valorBrutoEstimado?: number;
}

const CUSTO_CARTAO_LOTOFACIL = 3.5;

const PREMIOS_ESTIMADOS_LOTOFACIL: Record<number, number> = {
  15: 1700000,
  14: 1800,
  13: 35,
  12: 14,
  11: 7,
};

/**
 * Busca apenas os metadados das matrizes cadastradas para a Lotofácil.
 * NUNCA retorna o campo secreto dados_matriz para o navegador.
 */
export async function carregarMatrizesLotofacilAction(): Promise<{
  sucesso: boolean;
  opcoes: OpcaoMatrizLotofacil[];
  concursosRecentes: ConcursoOficialLotofacil[];
  erro?: string;
}> {
  try {
    const adminSupabase = createAdminClient();

    // Carrega os 300 últimos concursos oficiais da tabela exclusiva da Lotofácil
    const { data: resultadosDb } = await adminSupabase
      .from("resultados_lotofacil")
      .select("concurso, data_sorteio, dezenas")
      .order("concurso", { ascending: false })
      .limit(300);

    const concursosRecentes: ConcursoOficialLotofacil[] = (resultadosDb ?? []).map(
      (r) => ({
        concurso: r.concurso,
        data: r.data_sorteio,
        dezenas: r.dezenas,
      })
    );

    const { data: loteriaData } = await adminSupabase
      .from("loterias")
      .select("id")
      .eq("nome", "Lotofacil")
      .single();

    if (!loteriaData) {
      return { sucesso: true, opcoes: [], concursosRecentes };
    }

    const { data, error } = await adminSupabase
      .from("matrizes")
      .select("id, nome_comercial, qtd_dezenas_escolhidas, qtd_cartoes_gerados")
      .eq("loteria_id", loteriaData.id)
      .order("qtd_dezenas_escolhidas", { ascending: true })
      .order("qtd_cartoes_gerados", { ascending: true });

    if (error) {
      return { sucesso: false, opcoes: [], concursosRecentes, erro: error.message };
    }

    const opcoes: OpcaoMatrizLotofacil[] = (data ?? []).map((item) => ({
      id: item.id,
      nomeComercial: item.nome_comercial,
      qtdDezenasEscolhidas: item.qtd_dezenas_escolhidas,
      qtdCartoesGerados: item.qtd_cartoes_gerados,
    }));

    return {
      sucesso: true,
      opcoes,
      concursosRecentes,
    };
  } catch (e: unknown) {
    return {
      sucesso: false,
      opcoes: [],
      concursosRecentes: [],
      erro: e instanceof Error ? e.message : "Erro ao carregar opções da Lotofácil.",
    };
  }
}

function gerarCartoesPorSubstituicaoDireta(
  dadosMatriz: number[][],
  dezenasUsuario: number[]
): number[][] {
  const dezenasOrdenadas = [...dezenasUsuario].sort((a, b) => a - b);

  // Dicionário de substituição 1 para 1:
  // Linha de cima (1..N) -> Linha de baixo (dezenasOrdenadas do usuário)
  const tabelaDeTroca: Record<number, number> = {};
  dezenasOrdenadas.forEach((dezenaReal, idx) => {
    tabelaDeTroca[idx + 1] = dezenaReal;
  });

  return dadosMatriz.map((linhaFixa) =>
    linhaFixa
      .map((numeroTabelaFixa) => tabelaDeTroca[numeroTabelaFixa])
      .sort((a, b) => a - b)
  );
}

/**
 * Executa o cálculo no servidor e retorna APENAS o resumo de premiação
 * (sem jamais enviar as dezenas dos cartões gerados para visitantes/não assinantes).
 */
export async function calcularSimulacaoLotofacilAction(params: {
  matrizId: number;
  dezenasUsuario: number[];
  dezenasResultado: number[];
}): Promise<ResultadoSimulacaoLotofacil> {
  try {
    // Sanitização e validação estrita anti-injeção
    const idMatrizSeguro = Number(params.matrizId);
    if (!Number.isInteger(idMatrizSeguro) || idMatrizSeguro <= 0) {
      return { sucesso: false, erro: "Identificador de matriz inválido." };
    }

    const adminSupabase = createAdminClient();

    const { data: matriz, error } = await adminSupabase
      .from("matrizes")
      .select("id, qtd_dezenas_escolhidas, qtd_cartoes_gerados, dados_matriz")
      .eq("id", idMatrizSeguro)
      .single();

    if (error || !matriz) {
      return { sucesso: false, erro: "Matriz não encontrada no Cofre." };
    }

    const unicasUsuario = Array.from(new Set(params.dezenasUsuario)).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 25
    );
    if (unicasUsuario.length !== matriz.qtd_dezenas_escolhidas) {
      return {
        sucesso: false,
        erro: `Selecione exatamente ${matriz.qtd_dezenas_escolhidas} dezenas válidas.`,
      };
    }

    const unicasResultado = Array.from(new Set(params.dezenasResultado)).filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= 25
    );
    if (unicasResultado.length !== 15) {
      return {
        sucesso: false,
        erro: "Informe exatamente 15 dezenas válidas para o resultado do sorteio.",
      };
    }

    const dadosMatriz = matriz.dados_matriz as number[][];
    const cartoesGerados = gerarCartoesPorSubstituicaoDireta(
      dadosMatriz,
      unicasUsuario
    );

    const conjuntoSorteado = new Set(unicasResultado);
    const contagemPorPontos: Record<number, number> = {
      15: 0,
      14: 0,
      13: 0,
      12: 0,
      11: 0,
    };

    for (const cartao of cartoesGerados) {
      let acertos = 0;
      for (const dez of cartao) {
        if (conjuntoSorteado.has(dez)) acertos++;
      }
      if (acertos >= 11 && acertos <= 15) {
        contagemPorPontos[acertos]++;
      }
    }

    const faixas: FaixaPremiacaoResumo[] = [15, 14, 13, 12, 11].map((pts) => {
      const qtdCartoes = contagemPorPontos[pts];
      const premioUnitario = PREMIOS_ESTIMADOS_LOTOFACIL[pts];
      return {
        pontos: pts,
        qtdCartoes,
        premioUnitario,
        subtotal: qtdCartoes * premioUnitario,
      };
    });

    const totalCartoesPremiados = faixas.reduce(
      (acc, f) => acc + f.qtdCartoes,
      0
    );
    const valorBrutoEstimado = faixas.reduce((acc, f) => acc + f.subtotal, 0);
    const qtdCartoesTotal = cartoesGerados.length;

    return {
      sucesso: true,
      qtdCartoesTotal,
      custoUnitarioCartao: CUSTO_CARTAO_LOTOFACIL,
      valorTotalJogo: qtdCartoesTotal * CUSTO_CARTAO_LOTOFACIL,
      faixas,
      totalCartoesPremiados,
      valorBrutoEstimado,
    };
  } catch (e: unknown) {
    return {
      sucesso: false,
      erro: e instanceof Error ? e.message : "Erro ao calcular simulação.",
    };
  }
}

/**
 * Entrega SOMENTE UM CARTÃO POR VEZ e EXCLUSIVAMENTE se o usuário estiver
 * logado e com plano de assinatura ativo.
 */
export async function verCartaoIndividualLotofacilAction(params: {
  matrizId: number;
  dezenasUsuario: number[];
  dezenasResultado: number[];
  indiceCartao: number;
}): Promise<{
  autorizado: boolean;
  motivo?: "NAO_LOGADO" | "NAO_ASSINANTE" | "ERRO";
  mensagem?: string;
  numeroCartao?: number;
  totalCartoes?: number;
  dezenasCartao?: number[];
  pontosNoResultado?: number;
}> {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    // Bloqueio: TODOS devem estar logados, inclusive o Administrador
    if (!user) {
      return {
        autorizado: false,
        motivo: "NAO_LOGADO",
        mensagem: "Faça login ou crie sua conta para visualizar os cartões.",
      };
    }

    // Validação estrita via app_metadata (protegido pelo servidor)
    // Administrador também deve ter assinatura ativa para ver cartões de outros usuários
    const assinanteAtivo = Boolean(
      user.app_metadata?.assinante_ativo === true ||
      user.app_metadata?.plano === "vip" ||
      user.app_metadata?.plano === "assinante"
    );

    if (!assinanteAtivo) {
      return {
        autorizado: false,
        motivo: "NAO_ASSINANTE",
        mensagem: "Para liberar a aba VER JOGO com as dezenas dos cartões, contrate um plano ativo.",
      };
    }

    const idMatrizSeguro = Number(params.matrizId);
    if (!Number.isInteger(idMatrizSeguro) || idMatrizSeguro <= 0) {
      return { autorizado: false, motivo: "ERRO", mensagem: "Identificador de matriz inválido." };
    }

    const adminSupabase = createAdminClient();
    const { data: matriz, error } = await adminSupabase
      .from("matrizes")
      .select("id, qtd_dezenas_escolhidas, dados_matriz")
      .eq("id", idMatrizSeguro)
      .single();

    if (error || !matriz) {
      return { autorizado: false, motivo: "ERRO", mensagem: "Matriz não localizada." };
    }

    const dadosMatriz = matriz.dados_matriz as number[][];
    const cartoesGerados = gerarCartoesPorSubstituicaoDireta(
      dadosMatriz,
      params.dezenasUsuario
    );

    const idx = Math.max(0, Math.min(params.indiceCartao, cartoesGerados.length - 1));
    const dezenasCartao = cartoesGerados[idx];

    const conjuntoSorteado = new Set(params.dezenasResultado);
    const pontosNoResultado = dezenasCartao.filter((d) =>
      conjuntoSorteado.has(d)
    ).length;

    return {
      autorizado: true,
      numeroCartao: idx + 1,
      totalCartoes: cartoesGerados.length,
      dezenasCartao,
      pontosNoResultado,
    };
  } catch (e: unknown) {
    return {
      autorizado: false,
      motivo: "ERRO",
      mensagem: e instanceof Error ? e.message : "Erro ao verificar assinatura.",
    };
  }
}
