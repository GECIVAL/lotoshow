"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  calcularSimulacaoLotofacilAction,
  carregarMatrizesLotofacilAction,
  ConcursoOficialLotofacil,
  OpcaoMatrizLotofacil,
  ResultadoSimulacaoLotofacil,
  verCartaoIndividualLotofacilAction,
} from "./actions";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Sorteio criptograficamente imparcial (sem viés matemático de módulo ou pseudo-aleatório),
 * usando Web Crypto API com amostragem por rejeição + embaralhamento Fisher-Yates.
 */
function sortearInteiroImparcial(limiteExclusivo: number): number {
  const maxValido = Math.floor(0x100000000 / limiteExclusivo) * limiteExclusivo;
  const array = new Uint32Array(1);
  let valor = 0;
  do {
    window.crypto.getRandomValues(array);
    valor = array[0];
  } while (valor >= maxValido);
  return valor % limiteExclusivo;
}

function completarDezenasSemVies(
  jaSelecionadas: number[],
  metaQuantidade: number,
  totalUniverso: number
): number[] {
  const atuais = new Set(jaSelecionadas);
  const disponiveis = Array.from({ length: totalUniverso }, (_, i) => i + 1).filter(
    (n) => !atuais.has(n)
  );

  // Embaralhamento Fisher-Yates imparcial
  for (let i = disponiveis.length - 1; i > 0; i--) {
    const j = sortearInteiroImparcial(i + 1);
    [disponiveis[i], disponiveis[j]] = [disponiveis[j], disponiveis[i]];
  }

  let idx = 0;
  while (atuais.size < metaQuantidade && idx < disponiveis.length) {
    atuais.add(disponiveis[idx]);
    idx++;
  }
  return Array.from(atuais);
}

export default function LotofacilPage() {
  const [tela, setTela] = useState<1 | 2 | 3>(1);
  const [ajudaAberta, setAjudaAberta] = useState(false);

  const [opcoesMatriz, setOpcoesMatriz] = useState<OpcaoMatrizLotofacil[]>([]);
  const [matrizAtual, setMatrizAtual] = useState<OpcaoMatrizLotofacil | null>(null);
  const [concursosBanco, setConcursosBanco] = useState<ConcursoOficialLotofacil[]>([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);

  const [dezenasEscolhidas, setDezenasEscolhidas] = useState<number[]>([]);
  const [dezenasResultado, setDezenasResultado] = useState<number[]>([]);

  const [calculando, setCalculando] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(2);
  const [erroAviso, setErroAviso] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResultadoSimulacaoLotofacil | null>(null);

  // Estado da 3ª Tela (VER JOGO - 1 cartão por vez)
  const [indiceCartao, setIndiceCartao] = useState(0);
  const [carregandoCartao, setCarregandoCartao] = useState(false);
  const [cartaoAutorizado, setCartaoAutorizado] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState<string | null>(null);
  const [dezenasCartaoAtual, setDezenasCartaoAtual] = useState<number[]>([]);
  const [pontosCartaoAtual, setPontosCartaoAtual] = useState<number>(0);
  const [copiadoAviso, setCopiadoAviso] = useState(false);

  useEffect(() => {
    async function init() {
      setCarregandoOpcoes(true);
      const resp = await carregarMatrizesLotofacilAction();
      if (resp.sucesso) {
        if (resp.opcoes.length > 0) {
          setOpcoesMatriz(resp.opcoes);
          setMatrizAtual(resp.opcoes[0]);
        }
        if (resp.concursosRecentes.length > 0) {
          setConcursosBanco(resp.concursosRecentes);
        }
      }
      setCarregandoOpcoes(false);
    }
    init();
  }, []);

  const qtdNecessaria = matrizAtual?.qtdDezenasEscolhidas ?? 20;
  const qtdCartoesMatriz = matrizAtual?.qtdCartoesGerados ?? 20;
  const dezenasOrdenadas = [...dezenasEscolhidas].sort((a, b) => a - b);
  const resultadoOrdenado = [...dezenasResultado].sort((a, b) => a - b);

  const alternarDezenaUsuario = (num: number) => {
    setErroAviso(null);
    setResumo(null);
    if (dezenasEscolhidas.includes(num)) {
      setDezenasEscolhidas(dezenasEscolhidas.filter((d) => d !== num));
    } else {
      if (dezenasEscolhidas.length >= qtdNecessaria) return;
      setDezenasEscolhidas([...dezenasEscolhidas, num]);
    }
  };

  const completarJogoUsuario = () => {
    setErroAviso(null);
    setResumo(null);
    setDezenasEscolhidas(
      completarDezenasSemVies(dezenasEscolhidas, qtdNecessaria, 25)
    );
  };

  const alternarDezenaResultado = (num: number) => {
    setErroAviso(null);
    setResumo(null);
    if (dezenasResultado.includes(num)) {
      setDezenasResultado(dezenasResultado.filter((d) => d !== num));
    } else {
      if (dezenasResultado.length >= 15) return;
      setDezenasResultado([...dezenasResultado, num]);
    }
  };

  const completarResultadoSorteio = () => {
    setErroAviso(null);
    setResumo(null);
    setDezenasResultado(completarDezenasSemVies(dezenasResultado, 15, 25));
  };

  const handleCalcularResultado = async () => {
    if (!matrizAtual) {
      setErroAviso("Nenhuma matriz da Lotofácil cadastrada no Cofre Master.");
      return;
    }
    if (dezenasEscolhidas.length !== qtdNecessaria) {
      setErroAviso(`Selecione todas as ${qtdNecessaria} dezenas na 1ª Tela.`);
      return;
    }
    if (dezenasResultado.length !== 15) {
      setErroAviso("Selecione ou complete as 15 dezenas do resultado para calcular.");
      return;
    }

    setErroAviso(null);
    setCalculando(true);
    setSegundosRestantes(2);

    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    // Garante obrigatoriamente os 2 segundos de experiência comercial
    const [respostaServidor] = await Promise.all([
      calcularSimulacaoLotofacilAction({
        matrizId: matrizAtual.id,
        dezenasUsuario: dezenasOrdenadas,
        dezenasResultado: resultadoOrdenado,
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    clearInterval(intervalo);
    setCalculando(false);

    if (!respostaServidor.sucesso) {
      setErroAviso(respostaServidor.erro || "Falha ao calcular simulação.");
      return;
    }

    setResumo(respostaServidor);
  };

  const consultarCartaoNoServidor = async (novoIndice: number) => {
    if (!matrizAtual) return;
    setCarregandoCartao(true);
    const resp = await verCartaoIndividualLotofacilAction({
      matrizId: matrizAtual.id,
      dezenasUsuario: dezenasOrdenadas,
      dezenasResultado: resultadoOrdenado,
      indiceCartao: novoIndice,
    });
    setCarregandoCartao(false);

    if (!resp.autorizado) {
      setCartaoAutorizado(false);
      setMotivoBloqueio(
        resp.mensagem || "Assine um plano para desbloquear as dezenas dos cartões."
      );
      setDezenasCartaoAtual([]);
      setPontosCartaoAtual(0);
      return;
    }

    setCartaoAutorizado(true);
    setMotivoBloqueio(null);
    setIndiceCartao((resp.numeroCartao ?? 1) - 1);
    setDezenasCartaoAtual(resp.dezenasCartao ?? []);
    setPontosCartaoAtual(resp.pontosNoResultado ?? 0);
  };

  const irParaTela3 = async () => {
    setTela(3);
    await consultarCartaoNoServidor(0);
  };

  const limparSistemaCompleto = () => {
    setDezenasEscolhidas([]);
    setDezenasResultado([]);
    setResumo(null);
    setErroAviso(null);
    setIndiceCartao(0);
    setDezenasCartaoAtual([]);
    setTela(1);
  };

  const copiarCartaoAtual = async () => {
    if (!cartaoAutorizado || dezenasCartaoAtual.length === 0) return;
    const texto = dezenasCartaoAtual
      .map((n) => String(n).padStart(2, "0"))
      .join(" - ");
    await navigator.clipboard.writeText(
      `Lotofácil - Cartão ${indiceCartao + 1}: ${texto}`
    );
    setCopiadoAviso(true);
    setTimeout(() => setCopiadoAviso(false), 2000);
  };

  const compartilharComAmigo = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Grande Jogada - Sistema Lotérico",
          text: "Teste grátis o simulador inteligente de fechamentos lotéricos!",
          url,
        });
        return;
      } catch {
        // Segue para cópia
      }
    }
    await navigator.clipboard.writeText(url);
    alert("Link do site copiado! Agora é só colar e enviar para seu amigo.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto px-3 sm:px-4 py-6 w-full">
        {/* Cabeçalho da Loteria + Indicador de Telas */}
        <div className="flex flex-col items-center mb-4">
          <div className="bg-[#8E44AD] text-white font-extrabold text-lg sm:text-2xl px-8 py-1.5 rounded-md shadow-sm tracking-wide">
            Lotofácil
          </div>

          <div className="flex items-center gap-2 mt-3 text-xs font-bold">
            <span
              className={`px-3 py-1 rounded-full ${
                tela === 1
                  ? "bg-[var(--gj-roxo)] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              1ª Tela • Dezenas
            </span>
            <span
              className={`px-3 py-1 rounded-full ${
                tela === 2
                  ? "bg-[var(--gj-roxo)] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              2ª Tela • Simular
            </span>
            <span
              className={`px-3 py-1 rounded-full ${
                tela === 3
                  ? "bg-[var(--gj-roxo)] text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              3ª Tela • Ver Jogo
            </span>
          </div>
        </div>

        {/* Barra Verde "Socorro" (Ajuda) */}
        <button
          type="button"
          onClick={() => setAjudaAberta(!ajudaAberta)}
          className="w-full bg-[#28A745] hover:bg-green-700 text-white font-bold py-2.5 rounded-md shadow-sm transition mb-4 text-sm sm:text-base"
        >
          {ajudaAberta ? "Fechar Ajuda ▲" : "Socorro (Como usar esta tela)"}
        </button>

        {ajudaAberta && (
          <div className="bg-green-50 border border-green-200 text-green-900 rounded-lg p-4 mb-5 text-xs sm:text-sm space-y-1">
            {tela === 1 && (
              <p>
                <strong>1ª Tela:</strong> Clique nos números do volante abaixo até completar{" "}
                <strong>{qtdNecessaria} dezenas</strong> (ou clique em{" "}
                <em>Completar Jogo</em> para o sistema preencher). Depois clique em{" "}
                <strong>PRÓXIMO</strong>.
              </p>
            )}
            {tela === 2 && (
              <p>
                <strong>2ª Tela:</strong> Escolha ou clique em <em>Completar Jogo</em> para
                preencher as <strong>15 dezenas do resultado</strong> e clique em{" "}
                <strong>Calcular Resultado</strong> para conferir quantos cartões foram premiados!
              </p>
            )}
            {tela === 3 && (
              <p>
                <strong>3ª Tela (Ver Jogo):</strong> Assinantes ativos visualizam{" "}
                <strong>1 cartão por vez</strong> no volante usando as setas{" "}
                <strong>← / →</strong> para copiar com calma.
              </p>
            )}
          </div>
        )}

        {erroAviso && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs sm:text-sm font-semibold mb-4 text-center">
            {erroAviso}
          </div>
        )}

        {/* =========================================================
            1ª TELA: ESCOLHER DEZENAS + TABELA DE CONCURSOS
        ========================================================= */}
        {tela === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              {/* Seletor de Modalidades cadastradas no Cofre (suporta 1, 3, 4 ou mais modalidades) */}
              {opcoesMatriz.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-gray-500 text-center uppercase tracking-wider mb-2">
                    {opcoesMatriz.length > 1
                      ? "Escolha a Modalidade do Fechamento"
                      : "Modalidade Ativa"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {opcoesMatriz.map((op) => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          setMatrizAtual(op);
                          setDezenasEscolhidas([]);
                          setResumo(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition border ${
                          matrizAtual?.id === op.id
                            ? "bg-[var(--gj-roxo)] text-white border-[var(--gj-roxo)] shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {op.nomeComercial} ({op.qtdDezenasEscolhidas} Dezenas •{" "}
                        {op.qtdCartoesGerados} Cartões)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-bold text-center text-gray-800 mb-4">
                {carregandoOpcoes
                  ? "Carregando configuração..."
                  : `Selecione ${qtdNecessaria} Dezenas`}
              </h2>

              {/* Botões de apoio acima do volante */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5">
                <button
                  type="button"
                  onClick={completarJogoUsuario}
                  className="bg-[#28A745] hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-md transition"
                >
                  Completar Jogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDezenasEscolhidas([]);
                    setResumo(null);
                  }}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs sm:text-sm px-4 py-2 rounded-md transition"
                >
                  Limpar Dezenas
                </button>
              </div>

              {/* Volante 25 dezenas (5x5 ideal no celular e PC) */}
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3 max-w-xs mx-auto mb-5">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                  const marcada = dezenasEscolhidas.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => alternarDezenaUsuario(num)}
                      className={`aspect-square rounded-full font-extrabold text-sm sm:text-base flex items-center justify-center transition-transform select-none shadow-sm ${
                        marcada
                          ? "bg-[#8E44AD] text-white scale-105 ring-2 ring-purple-300"
                          : "bg-[#28A745] text-white opacity-85 hover:opacity-100"
                      }`}
                    >
                      {String(num).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <p className="text-center font-bold text-sm sm:text-base text-gray-700">
                <span className="text-[var(--gj-roxo)]">{dezenasEscolhidas.length}</span> de{" "}
                {qtdNecessaria} Dezenas Selecionadas
              </p>

              {/* Navegação Anterior / Próximo */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs sm:text-sm transition"
                >
                  ← ANTERIOR
                </Link>

                <button
                  type="button"
                  disabled={dezenasEscolhidas.length !== qtdNecessaria}
                  onClick={() => {
                    setErroAviso(null);
                    setTela(2);
                  }}
                  className="px-6 py-2.5 rounded-lg bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold text-xs sm:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  PRÓXIMO →
                </button>
              </div>
            </div>

            {/* Tabela de Concursos (Carregar junto com a 1ª Tela) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 overflow-hidden">
              <h3 className="text-sm font-bold text-gray-700 mb-3">
                Últimos Concursos (Opcional: clique em Carregar para usar como resultado de teste)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#28A745] text-white">
                      <th className="p-2 rounded-tl-md">Ação</th>
                      <th className="p-2">Concurso</th>
                      <th className="p-2">Data</th>
                      <th className="p-2 rounded-tr-md">15 Dezenas Sorteadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {concursosBanco.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-500">
                          {carregandoOpcoes
                            ? "Carregando concursos oficiais..."
                            : "Nenhum concurso carregado."}
                        </td>
                      </tr>
                    ) : (
                      concursosBanco.map((c) => (
                        <tr key={c.concurso} className="hover:bg-gray-50">
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDezenasResultado(c.dezenas);
                                setResumo(null);
                              }}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                            >
                              Carregar
                            </button>
                          </td>
                          <td className="p-2 font-bold text-gray-800">{c.concurso}</td>
                          <td className="p-2 text-gray-600">{c.data}</td>
                          <td className="p-2 font-mono text-gray-700 whitespace-nowrap">
                            {c.dezenas.map((d) => String(d).padStart(2, "0")).join(" - ")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            2ª TELA: DEZENAS ESCOLHIDAS + DIGITE O RESULTADO + RESUMO
        ========================================================= */}
        {tela === 2 && (
          <div className="space-y-5">
            {/* Quadro 1: Duplicidade das Dezenas do Jogo Selecionado */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <div className="bg-[#138496] text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-t-md text-center">
                DEZENAS DO JOGO SELECIONADO ({dezenasOrdenadas.length} DEZENAS)
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-3 bg-gray-50 border border-t-0 border-gray-200 rounded-b-md">
                {dezenasOrdenadas.map((dez) => (
                  <div
                    key={dez}
                    className="bg-[#28A745] text-white font-extrabold text-xs sm:text-sm py-1.5 rounded text-center"
                  >
                    {String(dez).padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            {/* Quadro 2: Digite/Selecione o Resultado + Botão Calcular com Temporizador 2s */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                Digite (ou selecione) o resultado do sorteio
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Marque 15 dezenas abaixo ou clique em <strong>Completar Jogo</strong> para preencher automaticamente.
              </p>

              <div className="flex justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={completarResultadoSorteio}
                  className="bg-[#138496] hover:bg-cyan-800 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-md transition"
                >
                  Completar Jogo (15 Dezenas)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDezenasResultado([]);
                    setResumo(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs sm:text-sm px-3 py-2 rounded-md transition"
                >
                  Limpar
                </button>
              </div>

              {/* Grade compacta para marcar as 15 dezenas do sorteio */}
              <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto mb-4">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                  const marcada = dezenasResultado.includes(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => alternarDezenaResultado(num)}
                      className={`h-10 rounded-full font-bold text-xs sm:text-sm transition ${
                        marcada
                          ? "bg-[#28A745] text-white ring-2 ring-green-300 scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {String(num).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-bold text-gray-600 mb-4">
                Resultado:{" "}
                <span className="text-[#138496]">{dezenasResultado.length} / 15</span> dezenas
              </p>

              <button
                type="button"
                onClick={handleCalcularResultado}
                disabled={calculando || dezenasResultado.length !== 15}
                className="w-full max-w-sm mx-auto bg-[#138496] hover:bg-cyan-800 text-white font-extrabold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                {calculando ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      Calculando e filtrando cartões... ({segundosRestantes}s)
                    </span>
                  </>
                ) : (
                  "Calcular Resultado"
                )}
              </button>
            </div>

            {/* Quadro 3: Resumo dos Cartões Premiados */}
            {resumo && resumo.sucesso && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-center text-gray-800 mb-4">
                  Resumo dos cartões premiados
                </h3>

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs sm:text-sm text-center border-collapse">
                    <thead>
                      <tr className="text-blue-700 border-b border-gray-200">
                        <th className="py-2 px-2">Pontos</th>
                        <th className="py-2 px-2">Cartões Premiados</th>
                        <th className="py-2 px-2">Prêmio Unit. Estimado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white">
                      {resumo.faixas?.map((f) => (
                        <tr key={f.pontos} className="bg-[#28A745] text-white font-bold">
                          <td className="py-2 px-2">{f.pontos} pontos</td>
                          <td className="py-2 px-2">{f.qtdCartoes}</td>
                          <td className="py-2 px-2">{formatarMoeda(f.premioUnitario)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* EM UMA ÚNICA LINHA (conforme anotação do projeto) */}
                <div className="flex flex-nowrap items-center justify-between rounded-lg overflow-hidden font-extrabold text-xs sm:text-base shadow-sm">
                  <div className="bg-[#E67E22] text-gray-900 px-3 sm:px-5 py-3 flex-1 whitespace-nowrap">
                    Cartões Premiados:{" "}
                    <span className="ml-1">{resumo.totalCartoesPremiados ?? 0}</span>
                  </div>
                  <div className="bg-[#82E0AA] text-gray-900 px-3 sm:px-5 py-3 flex-1 text-right whitespace-nowrap">
                    {formatarMoeda(resumo.valorBrutoEstimado ?? 0)} Bruto
                  </div>
                </div>
              </div>
            )}

            {/* Navegação Anterior / Próximo */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setTela(1)}
                className="px-5 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs sm:text-sm transition"
              >
                ← ANTERIOR
              </button>

              <button
                type="button"
                disabled={!resumo?.sucesso}
                onClick={irParaTela3}
                className="px-6 py-2.5 rounded-lg bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold text-xs sm:text-sm transition disabled:opacity-40 disabled:cursor-not-allowed luz-magica"
              >
                VER JOGO (PRÓXIMO →)
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            3ª TELA: VER JOGO (1 CARTÃO POR VEZ) + CUSTO DA APOSTA
        ========================================================= */}
        {tela === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Coluna Esquerda: Volante Individual 1 Cartão por vez */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-500 overflow-hidden flex flex-col">
                <div className="bg-[#138496] text-white p-3 flex items-center justify-between gap-2">
                  <div className="text-xs sm:text-sm font-bold">
                    <p>Cartão</p>
                    <p className="text-base sm:text-lg font-extrabold">
                      {cartaoAutorizado ? `${indiceCartao + 1} / ${qtdCartoesMatriz}` : "🔒"}
                    </p>
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-center">
                    <p>Pontos</p>
                    <p className="text-base sm:text-lg font-extrabold">
                      {cartaoAutorizado ? pontosCartaoAtual : "-"}
                    </p>
                  </div>

                  {!cartaoAutorizado ? (
                    <Link
                      href="/login"
                      className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-extrabold text-[11px] sm:text-xs px-3 py-2 rounded-md text-center leading-tight"
                    >
                      Assine um plano para
                      <br />
                      liberar VER JOGO
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={copiarCartaoAtual}
                      className="bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold text-xs px-3 py-2 rounded-md transition"
                    >
                      {copiadoAviso ? "Copiado! ✓" : "Copiar Cartão"}
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-6 flex-grow flex flex-col justify-center">
                  {/* Se NÃO for assinante, exibe o Paywall sem enviar nenhum número ao navegador */}
                  {!cartaoAutorizado ? (
                    <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl p-5 text-center space-y-3 my-2">
                      <div className="text-3xl">🔒</div>
                      <h3 className="font-extrabold text-gray-800 text-base">
                        Visualização Exclusiva para Assinantes
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {motivoBloqueio ||
                          "Para visualizar as dezenas de cada cartão gerado pelo fechamento, contrate um plano ativo."}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                        <Link
                          href="/login"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg"
                        >
                          Já sou Assinante (Login)
                        </Link>
                        <Link
                          href="/cadastro"
                          className="bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg"
                        >
                          Contratar Plano VIP
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-5 gap-2 max-w-[260px] mx-auto mb-5">
                        {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => {
                          const pertenceAoCartao = dezenasCartaoAtual.includes(num);
                          return (
                            <div
                              key={num}
                              className={`aspect-square rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center ${
                                pertenceAoCartao
                                  ? "bg-[#28A745] text-white shadow ring-2 ring-green-300"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {String(num).padStart(2, "0")}
                            </div>
                          );
                        })}
                      </div>

                      {/* Navegação de 1 cartão por vez (< Anterior | Próximo >) */}
                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          disabled={carregandoCartao || indiceCartao <= 0}
                          onClick={() => consultarCartaoNoServidor(indiceCartao - 1)}
                          className="px-4 py-2 border-2 border-gray-700 rounded font-extrabold text-sm disabled:opacity-30 hover:bg-gray-100"
                        >
                          ←
                        </button>
                        <span className="text-xs font-bold text-gray-600">
                          {carregandoCartao
                            ? "Carregando..."
                            : `Cartão ${indiceCartao + 1} de ${qtdCartoesMatriz}`}
                        </span>
                        <button
                          type="button"
                          disabled={
                            carregandoCartao || indiceCartao >= qtdCartoesMatriz - 1
                          }
                          onClick={() => consultarCartaoNoServidor(indiceCartao + 1)}
                          className="px-4 py-2 border-2 border-gray-700 rounded font-extrabold text-sm disabled:opacity-30 hover:bg-gray-100"
                        >
                          →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Total de Cartões e Valor Total do Jogo */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                      <span>Total de Cartões</span>
                      <span>Valor Unitário</span>
                    </div>
                    <div className="bg-[#7CFC00] text-gray-900 font-extrabold px-4 py-2.5 rounded flex justify-between text-sm sm:text-base">
                      <span>{resumo?.qtdCartoesTotal ?? qtdCartoesMatriz}</span>
                      <span>{formatarMoeda(resumo?.custoUnitarioCartao ?? 3.5)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-1">
                      Valor Total do Jogo (na Lotérica)
                    </p>
                    <div className="bg-[#7CFC00] text-gray-900 font-extrabold px-4 py-2.5 rounded text-sm sm:text-base">
                      {formatarMoeda(resumo?.valorTotalJogo ?? qtdCartoesMatriz * 3.5)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setTela(2)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-md text-xs sm:text-sm transition"
                  >
                    ← ANTERIOR (Voltar para Resumo)
                  </button>

                  <button
                    type="button"
                    onClick={limparSistemaCompleto}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-md text-xs sm:text-sm transition"
                  >
                    Limpar o Sistema
                  </button>

                  <button
                    type="button"
                    onClick={compartilharComAmigo}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md text-xs sm:text-sm transition"
                  >
                    Indique para um amigo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
