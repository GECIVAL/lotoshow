"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface ConcursoGraficoItem {
  concurso: number;
  data: string;
  dezenas: number[];
}

interface GraficoMapaDezenasProps {
  tituloLoteria: string;
  totalDezenas: number; // ex.: 25 (Lotofácil), 60 (Mega), 80 (Quina), 100 (Lotomania)
  blocoColunas?: number; // padrão 10 (linhas vermelhas grossas a cada 10 dezenas; na Lotofácil pode alternar 5 ou 10)
  concursosDesc: ConcursoGraficoItem[]; // Ordenados do mais recente (índice 0) para o mais antigo (até 300)
  dezenasSelecionadas: number[];
  qtdNecessaria: number;
  onAlternarDezena: (dezena: number) => void;
  onIrParaProximoPasso?: () => void;
}

export default function GraficoMapaDezenas({
  tituloLoteria,
  totalDezenas,
  blocoColunas = 10,
  concursosDesc,
  dezenasSelecionadas,
  qtdNecessaria,
  onAlternarDezena,
  onIrParaProximoPasso,
}: GraficoMapaDezenasProps) {
  const [qtdLinhasVisiveis, setQtdLinhasVisiveis] = useState<30 | 50 | 100 | 300>(30);
  const [mostrarListaSorteados, setMostrarListaSorteados] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Somatória exata nos últimos 30 e últimos 100 concursos oficiais
  const { soma30, soma100 } = useMemo(() => {
    const s30: Record<number, number> = {};
    const s100: Record<number, number> = {};
    for (let n = 1; n <= totalDezenas; n++) {
      s30[n] = 0;
      s100[n] = 0;
    }

    const fatia30 = concursosDesc.slice(0, 30);
    for (const c of fatia30) {
      for (const d of c.dezenas) {
        const idx = d === 0 && totalDezenas === 100 ? 100 : d;
        if (s30[idx] !== undefined) s30[idx]++;
      }
    }

    const fatia100 = concursosDesc.slice(0, 100);
    for (const c of fatia100) {
      for (const d of c.dezenas) {
        const idx = d === 0 && totalDezenas === 100 ? 100 : d;
        if (s100[idx] !== undefined) s100[idx]++;
      }
    }

    return { soma30: s30, soma100: s100 };
  }, [concursosDesc, totalDezenas]);

  // Ordem cronológica crescente (mais antigo em cima -> mais recente = linha "1" lá embaixo, colado na régua amarela)
  const linhasCronologicas = useMemo(() => {
    const recorte = concursosDesc.slice(0, qtdLinhasVisiveis);
    return [...recorte].reverse().map((item, idx, arr) => ({
      ...item,
      ordemReversa: arr.length - idx, // ... 9, 8, 7, ..., 2, 1 (1 = último concurso)
      conjunto: new Set(
        item.dezenas.map((d) => (d === 0 && totalDezenas === 100 ? 100 : d))
      ),
    }));
  }, [concursosDesc, qtdLinhasVisiveis, totalDezenas]);

  // Ao abrir ou trocar o filtro de linhas, rola automaticamente para o final (onde está o concurso 1 mais recente e a régua amarela)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [qtdLinhasVisiveis, concursosDesc.length]);

  const selecionadasSet = useMemo(
    () => new Set(dezenasSelecionadas),
    [dezenasSelecionadas]
  );

  const todasDezenas = useMemo(
    () => Array.from({ length: totalDezenas }, (_, i) => i + 1),
    [totalDezenas]
  );

  const maxDezenasPorSorteio = useMemo(() => {
    if (concursosDesc.length === 0) return 15;
    return concursosDesc[0].dezenas.length;
  }, [concursosDesc]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
      {/* Barra de Topo do Gráfico */}
      <div className="bg-gray-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base tracking-wide">
            📊 Gráfico Estatístico Oficial — {tituloLoteria}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-300">
            Clique nos números da <strong>faixa amarela</strong> (ou na linha verde do seu jogo) para selecionar suas dezenas!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setMostrarListaSorteados(!mostrarListaSorteados)}
            className="px-2.5 py-1 rounded font-bold bg-sky-700 hover:bg-sky-600 text-white transition mr-2"
          >
            {mostrarListaSorteados ? "Focar só no Mapa Azul" : "Mostrar Dezenas Sorteadas"}
          </button>
          <span className="text-gray-300 font-semibold mr-1">Exibir:</span>
          {([30, 50, 100, 300] as const).map((qtd) => (
            <button
              key={qtd}
              type="button"
              onClick={() => setQtdLinhasVisiveis(qtd)}
              className={`px-2.5 py-1 rounded font-bold transition ${
                qtdLinhasVisiveis === qtd
                  ? "bg-amber-400 text-gray-900"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              {qtd} conc.
            </button>
          ))}
        </div>
      </div>

      {/* Legenda de Orientação Rápida */}
      <div className="bg-gray-100 border-b border-gray-300 px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-700">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-3 h-3 rounded bg-[#BAFFC9] border border-green-500 inline-block" />
          Linha Verde: Seu Jogo Selecionado
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-3 h-3 rounded bg-[#FFFF00] border border-yellow-500 inline-block" />
          Faixa Amarela: Dezenas Clicáveis
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="px-1 py-0.2 rounded bg-[#F8CBAD] border border-orange-400 text-[10px] font-black text-gray-900 inline-block">30</span>
          Linha 30: Saídas nos últimos 30 concursos
        </span>
        <span className="flex items-center gap-1.5 font-bold">
          <span className="px-1 py-0.2 rounded bg-[#F8CBAD] border border-orange-400 text-[10px] font-black text-gray-900 inline-block">100</span>
          Linha 100: Saídas nos últimos 100 concursos
        </span>
      </div>

      {/* Área Rolável da Planilha Gráfica */}
      <div
        ref={scrollContainerRef}
        className="overflow-auto max-h-[520px] border-b border-gray-300"
      >
        <table className="border-collapse text-[11px] leading-none select-none min-w-max">
          <tbody>
            {linhasCronologicas.map((linha) => {
              // Linha vermelha horizontal a cada 10 concursos contando de baixo para cima (ex.: acima do 10, 20, 30...)
              const bordaTopoBloco10 =
                linha.ordemReversa % 10 === 0
                  ? "border-t-[3px] border-t-red-600"
                  : "border-t border-t-gray-200";

              const dezenasOrdenadasSorteio = [...linha.dezenas].sort(
                (a, b) => a - b
              );

              return (
                <tr key={linha.concurso} className={`hover:bg-blue-50/40 ${bordaTopoBloco10}`}>
                  {/* CONC. fixo à esquerda */}
                  <td className="sticky left-0 z-10 bg-white w-[54px] min-w-[54px] max-w-[54px] px-1 py-1 font-bold text-gray-800 border-r border-gray-300 text-right">
                    {linha.concurso}
                  </td>

                  {/* DATA fixa logo ao lado de CONC */}
                  <td className="sticky left-[54px] z-10 bg-white w-[78px] min-w-[78px] max-w-[78px] px-1 py-1 text-gray-600 border-r border-gray-300 text-center whitespace-nowrap">
                    {linha.data}
                  </td>

                  {/* Números Sorteados em colunas compactas 1-para-1 */}
                  {mostrarListaSorteados &&
                    Array.from({ length: maxDezenasPorSorteio }, (_, idx) => (
                      <td
                        key={idx}
                        className="w-[24px] min-w-[24px] max-w-[24px] px-0 py-1 text-center font-mono text-gray-700 border-r border-gray-200"
                      >
                        {dezenasOrdenadasSorteio[idx] !== undefined
                          ? dezenasOrdenadasSorteio[idx]
                          : ""}
                      </td>
                    ))}

                  {/* Coluna Cinza Regressiva (... 9, 8, 7 ... 2, 1) com Linha Vermelha Grossa */}
                  <td className="bg-gray-300 text-gray-800 font-bold w-[32px] min-w-[32px] max-w-[32px] px-1 py-1 text-center border-l border-gray-400 border-r-[3px] border-r-red-600">
                    {linha.ordemReversa}
                  </td>

                  {/* Mapa Azul de Dezenas (1..totalDezenas) com Linhas Vermelhas Grossas a cada bloco de 10 */}
                  {todasDezenas.map((dez) => {
                    const saiu = linha.conjunto.has(dez);
                    const fimDeBloco = dez % blocoColunas === 0;
                    return (
                      <td
                        key={dez}
                        onClick={() => onAlternarDezena(dez)}
                        title={`Concurso ${linha.concurso} — Dezena ${String(dez).padStart(2, "0")} (clique para marcar/desmarcar)`}
                        className={`w-[24px] min-w-[24px] max-w-[24px] h-[20px] cursor-pointer transition-colors ${
                          saiu ? "bg-[#00AEEF]" : "bg-white hover:bg-amber-50"
                        } ${
                          fimDeBloco
                            ? "border-r-[3px] border-r-red-600"
                            : "border-r border-r-gray-300"
                        }`}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* RODAPÉ CONGELADO (Linha do Jogador + Régua Amarela Clicável + Somatória 30 e 100) */}
          <tfoot className="sticky bottom-0 z-20 shadow-[0_-3px_8px_rgba(0,0,0,0.12)]">
            {/* Faixa Verde de Marcação do Jogo do Usuário (Linha 0) */}
            <tr className="border-t-[3px] border-t-gray-600 bg-[#BAFFC9]">
              {/* CONC fixo na linha verde */}
              <td className="sticky left-0 z-30 bg-[#BAFFC9] w-[54px] min-w-[54px] max-w-[54px] text-green-950 font-extrabold px-1 py-1.5 text-center border-r border-green-300">
                JOGO
              </td>
              {/* DATA fixa na linha verde com contador selecionadas */}
              <td className="sticky left-[54px] z-30 bg-[#BAFFC9] w-[78px] min-w-[78px] max-w-[78px] text-green-950 font-extrabold px-1 py-1.5 text-center border-r border-green-400 whitespace-nowrap">
                {dezenasSelecionadas.length}/{qtdNecessaria}
              </td>
              {/* Colunas vazias correspondentes aos números sorteados (mantendo a grade 1-para-1 exata) */}
              {mostrarListaSorteados &&
                Array.from({ length: maxDezenasPorSorteio }, (_, idx) => (
                  <td
                    key={idx}
                    className="w-[24px] min-w-[24px] max-w-[24px] bg-[#BAFFC9] border-r border-green-300/40"
                  />
                ))}
              {/* Célula regressiva 0 com linha vermelha grossa */}
              <td className="bg-gray-200 text-gray-800 font-extrabold w-[32px] min-w-[32px] max-w-[32px] text-center px-1 py-1.5 border-r-[3px] border-r-red-600">
                0
              </td>
              {/* Dezenas do Jogo marcadas com checkmark verde */}
              {todasDezenas.map((dez) => {
                const escolhida = selecionadasSet.has(dez);
                const fimDeBloco = dez % blocoColunas === 0;
                return (
                  <td
                    key={dez}
                    onClick={() => onAlternarDezena(dez)}
                    className={`w-[24px] min-w-[24px] max-w-[24px] h-[24px] text-center font-extrabold cursor-pointer transition ${
                      escolhida
                        ? "bg-[#28A745] text-white"
                        : "bg-white hover:bg-green-100 text-transparent"
                    } ${
                      fimDeBloco
                        ? "border-r-[3px] border-r-red-600"
                        : "border-r border-r-gray-300"
                    }`}
                  >
                    ✓
                  </td>
                );
              })}
            </tr>

            {/* Régua Amarela dos Números (Clicável!) */}
            <tr className="border-t-[3px] border-t-red-600 border-b-[3px] border-b-red-600 bg-white">
              {/* CONC fixo na régua amarela */}
              <td className="sticky left-0 z-30 bg-[#92D050] text-gray-900 font-extrabold w-[54px] min-w-[54px] max-w-[54px] px-1 py-1.5 text-center border-r border-gray-400">
                CONC.
              </td>
              {/* DATA fixa na régua amarela */}
              <td className="sticky left-[54px] z-30 bg-[#92D050] text-gray-900 font-extrabold w-[78px] min-w-[78px] max-w-[78px] px-1 py-1.5 text-center border-r border-gray-400">
                DATA
              </td>
              {/* Cabeçalho dos sorteados em vermelho (1..15) */}
              {mostrarListaSorteados &&
                Array.from({ length: maxDezenasPorSorteio }, (_, idx) => (
                  <td
                    key={idx}
                    className="w-[24px] min-w-[24px] max-w-[24px] bg-[#FF3300] text-white font-extrabold px-0 py-1.5 text-center border-r border-red-800"
                  >
                    {idx + 1}
                  </td>
                ))}
              {/* Célula vazia antes da linha vermelha */}
              <td className="bg-white w-[32px] min-w-[32px] max-w-[32px] border-r-[3px] border-r-red-600" />

              {/* Números da régua amarela (clicáveis para selecionar/desmarcar) */}
              {todasDezenas.map((dez) => {
                const escolhida = selecionadasSet.has(dez);
                const fimDeBloco = dez % blocoColunas === 0;
                return (
                  <td
                    key={dez}
                    onClick={() => onAlternarDezena(dez)}
                    className={`w-[24px] min-w-[24px] max-w-[24px] py-1.5 text-center font-extrabold cursor-pointer transition ${
                      escolhida
                        ? "bg-[#5B1F5F] text-white ring-2 ring-inset ring-green-400"
                        : "bg-[#FFFF00] text-gray-900 hover:bg-amber-300"
                    } ${
                      fimDeBloco
                        ? "border-r-[3px] border-r-red-600"
                        : "border-r border-r-gray-500"
                    }`}
                  >
                    {dez === 100 ? "00" : dez}
                  </td>
                );
              })}
            </tr>

            {/* Linha Somatória 30 Concursos (Correspondência 1-para-1 exata, SEM textos atravessados) */}
            <tr className="border-b border-gray-400 bg-[#FBE5D6]">
              {/* CONC fixo na linha 30 */}
              <td className="sticky left-0 z-30 bg-[#F8CBAD] text-gray-900 font-black w-[54px] min-w-[54px] max-w-[54px] px-1 py-1 text-center border-r border-gray-300">
                30
              </td>
              {/* DATA fixa na linha 30 */}
              <td className="sticky left-[54px] z-30 bg-[#F8CBAD] text-gray-800 font-extrabold w-[78px] min-w-[78px] max-w-[78px] px-1 py-1 text-center border-r border-gray-300 text-[10px] whitespace-nowrap">
                CONCURSOS
              </td>
              {/* Células correspondentes aos números sorteados */}
              {mostrarListaSorteados &&
                Array.from({ length: maxDezenasPorSorteio }, (_, idx) => (
                  <td
                    key={idx}
                    className="w-[24px] min-w-[24px] max-w-[24px] bg-[#FBE5D6] border-r border-orange-200"
                  />
                ))}
              {/* Rótulo 30 na coluna regressiva antes da linha vermelha grossa (IDÊNTICO à planilha) */}
              <td className="bg-[#F8CBAD] text-gray-900 font-black text-center w-[32px] min-w-[32px] max-w-[32px] px-1 py-1 border-r-[3px] border-r-red-600">
                30
              </td>
              {/* Somatória das Dezenas nos 30 Concursos (perfeitamente alinhada sob cada dezena) */}
              {todasDezenas.map((dez) => {
                const fimDeBloco = dez % blocoColunas === 0;
                return (
                  <td
                    key={dez}
                    onClick={() => onAlternarDezena(dez)}
                    title={`Dezena ${dez} saiu ${soma30[dez]} vezes nos últimos 30 concursos`}
                    className={`w-[24px] min-w-[24px] max-w-[24px] text-center font-bold text-gray-900 py-1 cursor-pointer hover:bg-amber-200 ${
                      fimDeBloco
                        ? "border-r-[3px] border-r-red-600"
                        : "border-r border-r-gray-400"
                    }`}
                  >
                    {soma30[dez]}
                  </td>
                );
              })}
            </tr>

            {/* Linha Somatória 100 Concursos (Correspondência 1-para-1 exata, SEM textos atravessados) */}
            <tr className="bg-[#FBE5D6]">
              {/* CONC fixo na linha 100 */}
              <td className="sticky left-0 z-30 bg-[#F8CBAD] text-gray-900 font-black w-[54px] min-w-[54px] max-w-[54px] px-1 py-1 text-center border-r border-gray-300">
                100
              </td>
              {/* DATA fixa na linha 100 */}
              <td className="sticky left-[54px] z-30 bg-[#F8CBAD] text-gray-800 font-extrabold w-[78px] min-w-[78px] max-w-[78px] px-1 py-1 text-center border-r border-gray-300 text-[10px] whitespace-nowrap">
                CONCURSOS
              </td>
              {/* Células correspondentes aos números sorteados */}
              {mostrarListaSorteados &&
                Array.from({ length: maxDezenasPorSorteio }, (_, idx) => (
                  <td
                    key={idx}
                    className="w-[24px] min-w-[24px] max-w-[24px] bg-[#FBE5D6] border-r border-orange-200"
                  />
                ))}
              {/* Rótulo 100 na coluna regressiva antes da linha vermelha grossa (IDÊNTICO à planilha) */}
              <td className="bg-[#F8CBAD] text-gray-900 font-black text-center w-[32px] min-w-[32px] max-w-[32px] px-1 py-1 border-r-[3px] border-r-red-600">
                100
              </td>
              {/* Somatória das Dezenas nos 100 Concursos (perfeitamente alinhada sob cada dezena) */}
              {todasDezenas.map((dez) => {
                const fimDeBloco = dez % blocoColunas === 0;
                return (
                  <td
                    key={dez}
                    onClick={() => onAlternarDezena(dez)}
                    title={`Dezena ${dez} saiu ${soma100[dez]} vezes nos últimos 100 concursos`}
                    className={`w-[24px] min-w-[24px] max-w-[24px] text-center font-bold text-gray-900 py-1 cursor-pointer hover:bg-amber-200 ${
                      fimDeBloco
                        ? "border-r-[3px] border-r-red-600"
                        : "border-r border-r-gray-400"
                    }`}
                  >
                    {soma100[dez]}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Barra Inferior de Ação Rápida das Dezenas Selecionadas */}
      <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-gray-700 mr-1">
            Selecionadas ({dezenasSelecionadas.length}/{qtdNecessaria}):
          </span>
          {dezenasSelecionadas.length === 0 ? (
            <span className="text-xs text-gray-400">
              Toque nos números amarelos do gráfico acima para montar seu jogo.
            </span>
          ) : (
            [...dezenasSelecionadas]
              .sort((a, b) => a - b)
              .map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onAlternarDezena(d)}
                  className="bg-[var(--gj-roxo)] text-white font-bold text-[11px] px-2 py-0.5 rounded hover:bg-red-600 transition"
                  title="Clique para remover"
                >
                  {String(d).padStart(2, "0")}
                </button>
              ))
          )}
        </div>

        {onIrParaProximoPasso && (
          <button
            type="button"
            disabled={dezenasSelecionadas.length !== qtdNecessaria}
            onClick={onIrParaProximoPasso}
            className="bg-[var(--gj-verde)] hover:bg-green-700 text-white font-extrabold text-xs sm:text-sm px-5 py-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Usar Dezenas e Ir para 2ª Tela →
          </button>
        )}
      </div>
    </div>
  );
}
