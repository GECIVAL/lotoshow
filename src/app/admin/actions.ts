"use server";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  consultarStatusTabelas300,
  sincronizarTodasAsLoterias300,
} from "@/lib/loterias/sincronizador";

/**
 * Obtém a Senha Mestre preservando caracteres especiais como # e $ no .env.local
 * (que o parser padrão do dotenv cortaria como comentário/variável sem escape),
 * e em produção usa diretamente process.env.SENHA_MESTRE.
 */
function obterSenhaMestreConfigurada(): string | undefined {
  try {
    const envLocalPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const conteudo = fs.readFileSync(envLocalPath, "utf8");
      for (const linhaBruta of conteudo.split(/\r?\n/)) {
        if (linhaBruta.startsWith("SENHA_MESTRE=")) {
          const valor = linhaBruta.slice("SENHA_MESTRE=".length).trim();
          if (valor.length > 0) {
            return valor.replace(/^(['"])([\s\S]*)\1$/, "$2");
          }
        }
      }
    }
  } catch {
    // Em ambiente serverless sem .env.local físico, segue para process.env
  }

  return process.env.SENHA_MESTRE;
}

function validarSenhaMestre(senhaInformada: string): { ok: boolean; erro?: string } {
  const senhaEsperada = obterSenhaMestreConfigurada();

  if (!senhaEsperada) {
    return {
      ok: false,
      erro: "A variável SENHA_MESTRE ainda não foi definida no arquivo .env.local.",
    };
  }

  const bufferInformada = Buffer.from((senhaInformada || "").trim(), "utf8");
  const bufferEsperada = Buffer.from(senhaEsperada, "utf8");

  if (bufferInformada.length !== bufferEsperada.length) {
    return { ok: false, erro: "Senha Mestre incorreta." };
  }

  const iguais = crypto.timingSafeEqual(bufferInformada, bufferEsperada);
  if (!iguais) {
    return { ok: false, erro: "Senha Mestre incorreta." };
  }

  return { ok: true };
}

export async function desbloquearCofreAction(senhaMestre: string) {
  const validacao = validarSenhaMestre(senhaMestre);
  if (!validacao.ok) {
    return { sucesso: false, erro: validacao.erro };
  }

  try {
    const adminSupabase = createAdminClient();

    // Garante que todas as loterias padrão existam no banco sem acento
    const loteriasPadrao = [
      { nome: "Lotofacil", dezenas_por_jogo: 15 },
      { nome: "MegaSena", dezenas_por_jogo: 6 },
      { nome: "Quina", dezenas_por_jogo: 5 },
      { nome: "Lotomania", dezenas_por_jogo: 50 },
      { nome: "DiaDeSorte", dezenas_por_jogo: 7 },
    ];

    await adminSupabase
      .from("loterias")
      .upsert(loteriasPadrao, { onConflict: "nome" });

    const { data: matrizes, error } = await adminSupabase
      .from("matrizes")
      .select("id, nome_comercial, qtd_dezenas_escolhidas, qtd_cartoes_gerados, created_at, loterias(nome)")
      .order("created_at", { ascending: false });

    if (error) {
      return { sucesso: false, erro: "Erro ao consultar o Cofre: " + error.message };
    }

    const statusResultados = await consultarStatusTabelas300();

    return {
      sucesso: true,
      matrizes: matrizes ?? [],
      statusResultados,
    };
  } catch (e: unknown) {
    const mensagem = e instanceof Error ? e.message : "Erro desconhecido no servidor.";
    return { sucesso: false, erro: mensagem };
  }
}

export interface SalvarMatrizInput {
  senhaMestre: string;
  loteria: string;
  nomeComercial: string;
  qtdDezenasEscolhidas: number;
  qtdCartoesGerados: number;
  dadosMatriz: number[][];
}

export async function salvarMatrizNoCofreAction(input: SalvarMatrizInput) {
  const validacao = validarSenhaMestre(input.senhaMestre);
  if (!validacao.ok) {
    return { sucesso: false, erro: validacao.erro };
  }

  try {
    const adminSupabase = createAdminClient();

    if (
      !Array.isArray(input.dadosMatriz) ||
      input.dadosMatriz.length !== input.qtdCartoesGerados
    ) {
      return {
        sucesso: false,
        erro: `A matriz enviada tem ${input.dadosMatriz?.length ?? 0} linhas, mas foi informado ${input.qtdCartoesGerados} cartões.`,
      };
    }

    const { data: loteriaData, error: loteriaError } = await adminSupabase
      .from("loterias")
      .select("id, dezenas_por_jogo")
      .eq("nome", input.loteria)
      .single();

    if (loteriaError || !loteriaData) {
      return {
        sucesso: false,
        erro: `Loteria "${input.loteria}" não encontrada no banco de dados.`,
      };
    }

    // Valida cada linha da matriz fixa (valores entre 1 e qtdDezenasEscolhidas)
    for (let i = 0; i < input.dadosMatriz.length; i++) {
      const linha = input.dadosMatriz[i];
      if (!Array.isArray(linha) || linha.length === 0) {
        return { sucesso: false, erro: `O cartão ${i + 1} está vazio ou inválido.` };
      }
      for (const numero of linha) {
        if (
          typeof numero !== "number" ||
          !Number.isInteger(numero) ||
          numero < 1 ||
          numero > input.qtdDezenasEscolhidas
        ) {
          return {
            sucesso: false,
            erro: `No cartão ${i + 1}, o valor "${numero}" está fora da faixa permitida (1 até ${input.qtdDezenasEscolhidas}).`,
          };
        }
      }
    }

    const { error: insertError } = await adminSupabase.from("matrizes").insert({
      loteria_id: loteriaData.id,
      nome_comercial: input.nomeComercial.trim(),
      qtd_dezenas_escolhidas: input.qtdDezenasEscolhidas,
      qtd_cartoes_gerados: input.qtdCartoesGerados,
      dados_matriz: input.dadosMatriz,
    });

    if (insertError) {
      return { sucesso: false, erro: "Erro ao salvar no banco: " + insertError.message };
    }

    const { data: matrizesAtualizadas } = await adminSupabase
      .from("matrizes")
      .select("id, nome_comercial, qtd_dezenas_escolhidas, qtd_cartoes_gerados, created_at, loterias(nome)")
      .order("created_at", { ascending: false });

    return {
      sucesso: true,
      mensagem: `Matriz "${input.nomeComercial}" salva com segurança total no Cofre!`,
      matrizes: matrizesAtualizadas ?? [],
    };
  } catch (e: unknown) {
    const mensagem = e instanceof Error ? e.message : "Erro inesperado ao salvar.";
    return { sucesso: false, erro: mensagem };
  }
}

export async function excluirMatrizDoCofreAction(params: {
  senhaMestre: string;
  matrizId: number;
}) {
  const validacao = validarSenhaMestre(params.senhaMestre);
  if (!validacao.ok) {
    return { sucesso: false, erro: validacao.erro };
  }

  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("matrizes")
      .delete()
      .eq("id", params.matrizId);

    if (error) {
      return { sucesso: false, erro: "Erro ao remover matriz: " + error.message };
    }

    const { data: matrizesAtualizadas } = await adminSupabase
      .from("matrizes")
      .select("id, nome_comercial, qtd_dezenas_escolhidas, qtd_cartoes_gerados, created_at, loterias(nome)")
      .order("created_at", { ascending: false });

    return {
      sucesso: true,
      matrizes: matrizesAtualizadas ?? [],
    };
  } catch (e: unknown) {
    return {
      sucesso: false,
      erro: e instanceof Error ? e.message : "Erro inesperado ao remover.",
    };
  }
}

export async function sincronizar300ConcursosAction(senhaMestre: string) {
  const validacao = validarSenhaMestre(senhaMestre);
  if (!validacao.ok) {
    return { sucesso: false, erro: validacao.erro };
  }

  try {
    const relatorio = await sincronizarTodasAsLoterias300(false);
    const statusResultados = await consultarStatusTabelas300();
    return {
      sucesso: true,
      relatorio,
      statusResultados,
    };
  } catch (e: unknown) {
    return {
      sucesso: false,
      erro: e instanceof Error ? e.message : "Erro ao sincronizar concursos.",
    };
  }
}
