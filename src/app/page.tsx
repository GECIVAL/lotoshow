import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameCard from "@/components/GameCard";
import Link from "next/link";

const MODALIDADES = [
  {
    rota: "/simulador/lotofacil",
    nome: "LOTOFÁCIL",
    dezenas: "20 Dezenas • 20 Cartões",
    dias: "SEG À SÁB",
    cor: "#8E44AD",
    corFundo: "#8E44AD",
    emBreve: false,
  },
  {
    rota: "/simulador/megasena",
    nome: "MEGA-SENA",
    dezenas: "15 Dezenas • 30 Cartões",
    dias: "TER - QUI - SÁB",
    cor: "#00A859",
    corFundo: "#00A859",
    emBreve: true,
  },
  {
    rota: "/simulador/quina",
    nome: "QUINA",
    dezenas: "15 Dezenas • 30 Cartões",
    dias: "SEG À SÁB",
    cor: "#5B1F5F",
    corFundo: "#5B1F5F",
    emBreve: true,
  },
  {
    rota: "/simulador/lotomania",
    nome: "LOTOMANIA",
    dezenas: "70 Dezenas • 35 Cartões",
    dias: "SEG - QUA - SEX",
    cor: "#F28C28",
    corFundo: "#F28C28",
    emBreve: true,
  },
  {
    rota: "/simulador/diadesorte",
    nome: "DIA DE SORTE",
    dezenas: "15 Dezenas • 21 Cartões",
    dias: "TER - QUI - SÁB",
    cor: "#B7791F",
    corFundo: "#D69E2E",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "DUPLA SENA",
    dezenas: "Fechamento Especial",
    dias: "SEG - QUA - SEX",
    cor: "#C53030",
    corFundo: "#C53030",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "TIMEMANIA",
    dezenas: "Fechamento Especial",
    dias: "TER - QUI - SÁB",
    cor: "#2F855A",
    corFundo: "#2F855A",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "+MILIONÁRIA",
    dezenas: "Fechamento Especial",
    dias: "QUA - SÁB",
    cor: "#2B6CB0",
    corFundo: "#2B6CB0",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "SUPER SETE",
    dezenas: "Fechamento Especial",
    dias: "SEG - QUA - SEX",
    cor: "#68D391",
    corFundo: "#38A169",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "LOTECA",
    dezenas: "Fechamento Especial",
    dias: "FIM DE SEMANA",
    cor: "#E53E3E",
    corFundo: "#E53E3E",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "ZOOLÓGICO",
    dezenas: "25 Grupos • Simulador",
    dias: "TODOS OS DIAS",
    cor: "#D97706",
    corFundo: "#D97706",
    emBreve: true,
  },
  {
    rota: "/#jogos",
    nome: "BOLÕES",
    dezenas: "Cotas em Grupo",
    dias: "ESPECIAIS",
    cor: "#5B1F5F",
    corFundo: "#44337A",
    emBreve: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-grow">
        {/* Banner de Instrução */}
        <div className="max-w-7xl mx-auto px-4 mt-5">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg flex items-center gap-3 text-blue-900 text-xs sm:text-sm font-medium shadow-sm">
            <div className="bg-blue-600 text-white px-2.5 py-1.5 rounded-md font-bold shrink-0">
              1º
            </div>
            <p>
              Faça seu cadastro para liberar a aba{" "}
              <strong>ESTATÍSTICA (GRÁTIS)</strong>. Se já estiver cadastrado,
              entre com seu <strong>LOGIN</strong>.
            </p>
          </div>
        </div>

        {/* Grade Compacta com 12 Modalidades (10 Loterias + Zoológico + Bolões) */}
        <section id="jogos" className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-600 text-white px-2.5 py-1.5 rounded-md font-bold shrink-0 text-xs sm:text-sm">
              2º
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              Selecione um dos jogos para simular e verificar o Sistema
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {MODALIDADES.map((jogo) => (
              <Link key={jogo.nome} href={jogo.rota} className="block h-full">
                <GameCard
                  nome={jogo.nome}
                  dezenas={jogo.dezenas}
                  dias={jogo.dias}
                  cor={jogo.cor}
                  corFundo={jogo.corFundo}
                  emBreve={jogo.emBreve}
                />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
