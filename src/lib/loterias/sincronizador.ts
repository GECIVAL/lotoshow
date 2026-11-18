import dns from "node:dns";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { createAdminClient } from "@/lib/supabase/admin";

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

let certsSistema: string[] | undefined;
try {
  if (typeof tls.getCACertificates === "function") {
    certsSistema = [
      ...tls.getCACertificates("default"),
      ...tls.getCACertificates("system"),
    ];
  }
} catch {
  // Ambiente padrão
}

const httpsAgentExterno = new https.Agent({
  keepAlive: true,
  family: 4,
  ...(certsSistema ? { ca: certsSistema } : {}),
});

function buscarJsonHttps<T>(url: string, timeoutMs = 25000): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: httpsAgentExterno,
        family: 4,
        timeout: timeoutMs,
        headers: {
          Accept: "application/json",
          "User-Agent": "GrandeJogada-Sync/1.0",
        },
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          buscarJsonHttps<T>(res.headers.location, timeoutMs)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} ao consultar ${url}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.from(c)));
        res.on("end", () => {
          try {
            const texto = Buffer.concat(chunks).toString("utf8");
            resolve(JSON.parse(texto) as T);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Tempo limite esgotado ao consultar ${url}`));
    });
    req.on("error", reject);
  });
}

export const LIMITE_CONCURSOS_MANTIDOS = 300;

export interface ConfiguracaoTabelaLoteria {
  nomeExibicao: string;
  slugApi: string;
  slugCaixa: string;
  tabelaBanco: string;
}

export const LOTERIAS_SINCRONIZAVEIS: ConfiguracaoTabelaLoteria[] = [
  {
    nomeExibicao: "Lotofácil",
    slugApi: "lotofacil",
    slugCaixa: "lotofacil",
    tabelaBanco: "resultados_lotofacil",
  },
  {
    nomeExibicao: "Mega-Sena",
    slugApi: "megasena",
    slugCaixa: "megasena",
    tabelaBanco: "resultados_megasena",
  },
  {
    nomeExibicao: "Quina",
    slugApi: "quina",
    slugCaixa: "quina",
    tabelaBanco: "resultados_quina",
  },
  {
    nomeExibicao: "Lotomania",
    slugApi: "lotomania",
    slugCaixa: "lotomania",
    tabelaBanco: "resultados_lotomania",
  },
  {
    nomeExibicao: "Dia de Sorte",
    slugApi: "diadesorte",
    slugCaixa: "diadesorte",
    tabelaBanco: "resultados_diadesorte",
  },
  {
    nomeExibicao: "Dupla Sena",
    slugApi: "duplasena",
    slugCaixa: "duplasena",
    tabelaBanco: "resultados_duplasena",
  },
  {
    nomeExibicao: "Timemania",
    slugApi: "timemania",
    slugCaixa: "timemania",
    tabelaBanco: "resultados_timemania",
  },
  {
    nomeExibicao: "+Milionária",
    slugApi: "maismilionaria",
    slugCaixa: "maismilionaria",
    tabelaBanco: "resultados_maismilionaria",
  },
  {
    nomeExibicao: "Super Sete",
    slugApi: "supersete",
    slugCaixa: "supersete",
    tabelaBanco: "resultados_supersete",
  },
];

interface ItemApiComunitaria {
  concurso: number;
  data: string;
  dezenas: string[];
  trevos?: string[];
  timeCoracao?: string | null;
  mesSorte?: string | null;
}

interface ItemApiOficialCaixa {
  numero: number;
  dataApuracao: string;
  listaDezenas: string[];
  listaDezenasSegundoSorteio?: string[] | null;
  trevosSorteados?: string[] | null;
  nomeTimeCoracaoMesSorte?: string | null;
}

function montarRegistroParaTabela(
  tabelaBanco: string,
  item: ItemApiComunitaria
): Record<string, unknown> {
  const nums = (item.dezenas ?? []).map((d) => Number(d));

  if (tabelaBanco === "resultados_duplasena") {
    // Na Dupla Sena, os 6 primeiros pertencem ao 1º sorteio e os 6 seguintes (se vierem juntos) ao 2º sorteio
    const primeiro = nums.slice(0, 6);
    const segundo = nums.length >= 12 ? nums.slice(6, 12) : [];
    return {
      concurso: Number(item.concurso),
      data_sorteio: item.data || "",
      dezenas: primeiro,
      dezenas_sorteio_2: segundo,
      updated_at: new Date().toISOString(),
    };
  }

  const base: Record<string, unknown> = {
    concurso: Number(item.concurso),
    data_sorteio: item.data || "",
    dezenas: nums,
    updated_at: new Date().toISOString(),
  };

  if (tabelaBanco === "resultados_diadesorte") {
    base.mes_sorte = item.mesSorte ?? null;
  } else if (tabelaBanco === "resultados_timemania") {
    base.time_coracao = item.timeCoracao ?? null;
  } else if (tabelaBanco === "resultados_maismilionaria") {
    base.trevos = (item.trevos ?? []).map((t) => Number(t));
  }

  return base;
}

export interface ResumoSincronizacaoLoteria {
  loteria: string;
  tabela: string;
  sucesso: boolean;
  totalNoBanco?: number;
  ultimoConcurso?: number;
  ultimaData?: string;
  erro?: string;
}

/**
 * Sincroniza uma loteria isolada mantendo EXATAMENTE os últimos 300 concursos oficiais.
 * - Se o banco tiver menos de 300 concursos, baixa o histórico completo e guarda os 300 mais recentes.
 * - Se já tiver os 300 concursos, busca o concurso mais recente (com fallback direto na Caixa)
 *   e remove automaticamente qualquer concurso mais antigo além dos 300.
 */
export async function sincronizarLoteriaIsolada(
  cfg: ConfiguracaoTabelaLoteria,
  forcarCargaCompleta = false
): Promise<ResumoSincronizacaoLoteria> {
  const adminSupabase = createAdminClient();

  try {
    const { count, error: erroContagem } = await adminSupabase
      .from(cfg.tabelaBanco)
      .select("concurso", { count: "exact", head: true });

    if (erroContagem) {
      return {
        loteria: cfg.nomeExibicao,
        tabela: cfg.tabelaBanco,
        sucesso: false,
        erro: erroContagem.message,
      };
    }

    const precisaCarga300 =
      forcarCargaCompleta || (count ?? 0) < LIMITE_CONCURSOS_MANTIDOS;

    if (precisaCarga300) {
      // Busca a lista consolidada e recorta estritamente os últimos 300 concursos
      const todos = await buscarJsonHttps<ItemApiComunitaria[]>(
        `https://loteriascaixa-api.herokuapp.com/api/${cfg.slugApi}`,
        35000
      );

      if (!Array.isArray(todos) || todos.length === 0) {
        throw new Error("API não retornou lista de concursos.");
      }

      const ultimos300 = [...todos]
        .filter((x) => x && Number.isInteger(Number(x.concurso)))
        .sort((a, b) => Number(b.concurso) - Number(a.concurso))
        .slice(0, LIMITE_CONCURSOS_MANTIDOS);

      const registros = ultimos300.map((item) =>
        montarRegistroParaTabela(cfg.tabelaBanco, item)
      );

      // Grava em lotes de 150 para rapidez e segurança
      for (let i = 0; i < registros.length; i += 150) {
        const lote = registros.slice(i, i + 150);
        const { error: upsertErr } = await adminSupabase
          .from(cfg.tabelaBanco)
          .upsert(lote, { onConflict: "concurso" });
        if (upsertErr) throw new Error(upsertErr.message);
      }
    } else {
      // Atualização diária rápida (01:00 BRT): busca o último concurso
      let ultimoItem: ItemApiComunitaria | null = null;

      try {
        ultimoItem = await buscarJsonHttps<ItemApiComunitaria>(
          `https://loteriascaixa-api.herokuapp.com/api/${cfg.slugApi}/latest`,
          15000
        );
      } catch {
        // Fallback direto na API oficial da Caixa
        const oficial = await buscarJsonHttps<ItemApiOficialCaixa>(
          `https://servicebus2.caixa.gov.br/portaldeloterias/api/${cfg.slugCaixa}`,
          15000
        );
        const dezenasCombinadas =
          cfg.tabelaBanco === "resultados_duplasena" &&
          oficial.listaDezenasSegundoSorteio
            ? [...oficial.listaDezenas, ...oficial.listaDezenasSegundoSorteio]
            : oficial.listaDezenas;

        ultimoItem = {
          concurso: oficial.numero,
          data: oficial.dataApuracao,
          dezenas: dezenasCombinadas,
          trevos: oficial.trevosSorteados ?? [],
          timeCoracao: oficial.nomeTimeCoracaoMesSorte ?? null,
          mesSorte: oficial.nomeTimeCoracaoMesSorte ?? null,
        };
      }

      if (ultimoItem && ultimoItem.concurso) {
        const reg = montarRegistroParaTabela(cfg.tabelaBanco, ultimoItem);
        const { error: errUpsert } = await adminSupabase
          .from(cfg.tabelaBanco)
          .upsert(reg, { onConflict: "concurso" });
        if (errUpsert) throw new Error(errUpsert.message);
      }
    }

    // PODA AUTOMÁTICA: mantém ESTRITAMENTE os últimos 300 concursos (apaga do 301º para trás)
    const { data: top300 } = await adminSupabase
      .from(cfg.tabelaBanco)
      .select("concurso, data_sorteio")
      .order("concurso", { ascending: false })
      .limit(LIMITE_CONCURSOS_MANTIDOS);

    if (top300 && top300.length === LIMITE_CONCURSOS_MANTIDOS) {
      const menorConcursoMantido = top300[top300.length - 1].concurso;
      await adminSupabase
        .from(cfg.tabelaBanco)
        .delete()
        .lt("concurso", menorConcursoMantido);
    }

    const { count: totalFinal } = await adminSupabase
      .from(cfg.tabelaBanco)
      .select("concurso", { count: "exact", head: true });

    return {
      loteria: cfg.nomeExibicao,
      tabela: cfg.tabelaBanco,
      sucesso: true,
      totalNoBanco: totalFinal ?? top300?.length ?? 0,
      ultimoConcurso: top300?.[0]?.concurso,
      ultimaData: top300?.[0]?.data_sorteio,
    };
  } catch (e: unknown) {
    return {
      loteria: cfg.nomeExibicao,
      tabela: cfg.tabelaBanco,
      sucesso: false,
      erro: e instanceof Error ? e.message : "Falha na sincronização.",
    };
  }
}

export async function sincronizarTodasAsLoterias300(
  forcarCargaCompleta = false
): Promise<ResumoSincronizacaoLoteria[]> {
  const resultados: ResumoSincronizacaoLoteria[] = [];
  for (const cfg of LOTERIAS_SINCRONIZAVEIS) {
    const res = await sincronizarLoteriaIsolada(cfg, forcarCargaCompleta);
    resultados.push(res);
  }
  return resultados;
}

export async function consultarStatusTabelas300(): Promise<{
  tabelasCriadas: boolean;
  itens: ResumoSincronizacaoLoteria[];
}> {
  const adminSupabase = createAdminClient();
  const itens: ResumoSincronizacaoLoteria[] = [];
  let algumaNaoExiste = false;

  for (const cfg of LOTERIAS_SINCRONIZAVEIS) {
    const { data, count, error } = await adminSupabase
      .from(cfg.tabelaBanco)
      .select("concurso, data_sorteio", { count: "exact" })
      .order("concurso", { ascending: false })
      .limit(1);

    if (error) {
      if (
        error.message.includes("does not exist") ||
        error.message.includes("schema cache") ||
        error.code === "42P01" ||
        error.code === "PGRST205"
      ) {
        algumaNaoExiste = true;
      }
      itens.push({
        loteria: cfg.nomeExibicao,
        tabela: cfg.tabelaBanco,
        sucesso: false,
        erro: error.message,
      });
    } else {
      itens.push({
        loteria: cfg.nomeExibicao,
        tabela: cfg.tabelaBanco,
        sucesso: true,
        totalNoBanco: count ?? 0,
        ultimoConcurso: data?.[0]?.concurso,
        ultimaData: data?.[0]?.data_sorteio,
      });
    }
  }

  return {
    tabelasCriadas: !algumaNaoExiste,
    itens,
  };
}
