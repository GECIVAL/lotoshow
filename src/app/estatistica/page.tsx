"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GraficoMapaDezenas, {
  ConcursoGraficoItem,
} from "@/components/GraficoMapaDezenas";
import { carregarGraficoLoteriaAction } from "./actions";

const ABAS_LOTERIAS = [
  { chave: "lotofacil", rotulo: "Lotofácil", cor: "#8E44AD" },
  { chave: "quina", rotulo: "Quina", cor: "#5B1F5F" },
  { chave: "megasena", rotulo: "Mega-Sena", cor: "#00A859" },
  { chave: "lotomania", rotulo: "Lotomania", cor: "#F28C28" },
  { chave: "diadesorte", rotulo: "Dia de Sorte", cor: "#D69E2E" },
  { chave: "duplasena", rotulo: "Dupla Sena", cor: "#C53030" },
  { chave: "timemania", rotulo: "Timemania", cor: "#2F855A" },
  { chave: "maismilionaria", rotulo: "+Milionária", cor: "#2B6CB0" },
];

export default function EstatisticaPage() {
  const [abaAtiva, setAbaAtiva] = useState("quina");
  const [carregando, setCarregando] = useState(true);
  const [concursos, setConcursos] = useState<ConcursoGraficoItem[]>([]);
  const [totalDezenas, setTotalDezenas] = useState(80);
  const [blocoColunas, setBlocoColunas] = useState(10);
  const [qtdJogoPadrao, setQtdJogoPadrao] = useState(15);
  const [nomeLoteria, setNomeLoteria] = useState("Quina");
  const [dezenasEscolhidas, setDezenasEscolhidas] = useState<number[]>([]);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      setDezenasEscolhidas([]);
      const resp = await carregarGraficoLoteriaAction(abaAtiva);
      if (resp.sucesso) {
        setConcursos(resp.concursos);
        setTotalDezenas(resp.config.totalDezenas);
        setBlocoColunas(resp.config.blocoColunas);
        setQtdJogoPadrao(resp.config.qtdJogoPadrao);
        setNomeLoteria(resp.config.nome);
      }
      setCarregando(false);
    }
    buscar();
  }, [abaAtiva]);

  const alternarDezena = (dez: number) => {
    if (dezenasEscolhidas.includes(dez)) {
      setDezenasEscolhidas(dezenasEscolhidas.filter((d) => d !== dez));
    } else {
      if (dezenasEscolhidas.length >= qtdJogoPadrao) return;
      setDezenasEscolhidas([...dezenasEscolhidas, dez]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-grow max-w-[96rem] mx-auto px-3 sm:px-6 py-6 w-full space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--gj-roxo)]">
              Estatística Oficial e Mapa Gráfico (Últimos 300 Concursos)
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Blocos divididos por linhas vermelhas a cada 10 concursos e somatória de saídas em{" "}
              <strong>30</strong> e <strong>100</strong> sorteios.
            </p>
          </div>
        </div>

        {/* Seletor das Loterias Isoladas */}
        <div className="flex flex-wrap gap-2">
          {ABAS_LOTERIAS.map((aba) => (
            <button
              key={aba.chave}
              type="button"
              onClick={() => setAbaAtiva(aba.chave)}
              style={{
                backgroundColor: abaAtiva === aba.chave ? aba.cor : "#FFFFFF",
                color: abaAtiva === aba.chave ? "#FFFFFF" : "#374151",
              }}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold border border-gray-200 shadow-sm transition hover:opacity-90"
            >
              {aba.rotulo}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 text-gray-500 font-bold">
            Carregando mapa dos 300 concursos oficiais de {nomeLoteria}...
          </div>
        ) : (
          <GraficoMapaDezenas
            tituloLoteria={nomeLoteria}
            totalDezenas={totalDezenas}
            blocoColunas={blocoColunas}
            concursosDesc={concursos}
            dezenasSelecionadas={dezenasEscolhidas}
            qtdNecessaria={qtdJogoPadrao}
            onAlternarDezena={alternarDezena}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
