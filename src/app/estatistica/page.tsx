"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [abaAtiva, setAbaAtiva] = useState("lotofacil");
  const [carregando, setCarregando] = useState(true);
  const [precisaLogar, setPrecisaLogar] = useState(false);
  const [concursos, setConcursos] = useState<ConcursoGraficoItem[]>([]);
  const [totalDezenas, setTotalDezenas] = useState(25);
  const [blocoColunas, setBlocoColunas] = useState(5);
  const [qtdJogoPadrao, setQtdJogoPadrao] = useState(20);
  const [nomeLoteria, setNomeLoteria] = useState("Lotofácil");
  const [dezenasEscolhidas, setDezenasEscolhidas] = useState<number[]>([]);

  useEffect(() => {
    async function buscar() {
      setCarregando(true);
      setDezenasEscolhidas([]);
      const resp = await carregarGraficoLoteriaAction(abaAtiva);
      if (resp.precisaLogar) {
        setPrecisaLogar(true);
        setCarregando(false);
        return;
      }

      setPrecisaLogar(false);
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

        {precisaLogar ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-purple-200 shadow-md max-w-2xl mx-auto my-6 space-y-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 text-[var(--gj-roxo)] rounded-full flex items-center justify-center mx-auto text-3xl sm:text-4xl shadow-inner">
              🔒
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Área de Estatística Exclusiva para Membros
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
                Para visualizar o <strong>Gráfico Estatístico Oficial</strong> com os últimos <strong>300 concursos</strong>, blocos de 10x10 e somatórias de saídas da <strong>{nomeLoteria}</strong>, você precisa estar conectado em sua conta.
              </p>
              <p className="text-[11px] sm:text-xs text-green-700 font-extrabold mt-1">
                ✓ O cadastro no Grande Jogada é 100% gratuito e libera todas as estatísticas oficiais!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <Link
                href="/login?redirect=/estatistica"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow transition"
              >
                Fazer Login
              </Link>
              <Link
                href="/cadastro?redirect=/estatistica"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[var(--gj-verde)] hover:bg-green-700 text-white font-extrabold text-sm shadow transition"
              >
                Cadastre-se Grátis
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition"
              >
                ← Voltar para a Página Inicial
              </Link>
            </div>
          </div>
        ) : carregando ? (
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
