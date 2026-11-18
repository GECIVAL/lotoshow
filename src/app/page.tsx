import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameCard from "@/components/GameCard";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      <main className="flex-grow">
        {/* Banner de Instrução */}
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-center gap-4 text-blue-800 text-sm font-medium shadow-sm">
            <div className="bg-blue-600 text-white p-2 rounded-md font-bold">1º</div>
            <p>Faça seu cadastro para poder liberar a aba <strong>ESTATÍSTICA (GRÁTIS)</strong> se já estiver cadastrado, entre com o seu LOGIN para entrar no sistema.</p>
          </div>
        </div>

        {/* Seção Principal de Jogos */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
             <div className="bg-blue-600 text-white p-2 rounded-md font-bold">2º</div>
             <h2 className="text-xl font-bold text-gray-800">Selecione um dos jogos para poder jogar e verificar o Sistema</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/simulador/lotomania">
              <GameCard nome="LOTOMANIA" dezenas="70 Dezenas e 35 Cartões" cartoes="" dias="SEGUNDA - QUARTA - SEXTA" cor="#F28C28" corFundo="#F28C28" />
            </Link>
            
            <Link href="/simulador/quina">
              <GameCard nome="QUINA" dezenas="15 Dezenas e 30 Cartões" cartoes="" dias="SEGUNDA À SÁBADO" cor="#5B1F5F" corFundo="#8E44AD" />
            </Link>

            <Link href="/simulador/megasena">
              <GameCard nome="MEGASENA" dezenas="15 Dezenas e 30 Cartões" cartoes="" dias="QUARTA - SÁBADO" cor="#00A859" corFundo="#00A859" />
            </Link>

            <Link href="/simulador/diadesorte">
              <GameCard nome="DIA DE SORTE" dezenas="15 Dezenas e 21 Cartões" cartoes="" dias="TERÇA - QUINTA - SÁBADO" cor="#00A859" corFundo="#00A859" />
            </Link>

            <Link href="/simulador/lotofacil">
              <GameCard nome="LOTOFACIL" dezenas="20 Dezenas e 20 Cartões" cartoes="" dias="SEGUNDA À SÁBADO" cor="#8E44AD" corFundo="#8E44AD" />
            </Link>

            <Link href="/simulador/boloes">
              <GameCard nome="BOLÕES" dezenas="EM DESENVOLVIMENTO" cartoes="" dias="EM BREVE" cor="#5B1F5F" corFundo="#5B1F5F" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}