"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MagoDaSorte from "@/components/MagoDaSorte";
import Link from "next/link";

export default function LotofacilPage() {
  const [etapa, setEtapa] = useState<"matriz" | "volante" | "resultado">("matriz");
  const [matrizSelecionada, setMatrizSelecionada] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header />

      {/* O Mago aparece na tela dependendo da etapa */}
      {etapa === "matriz" && (
        <MagoDaSorte 
          texto="Olá, jovem! Para começar a sua jornada na Lotofácil, escolha uma das estratégias abaixo." 
          posicao="baixo"
          falar={true} 
        />
      )}
      {etapa === "volante" && (
        <MagoDaSorte 
          texto="Agora, clique nas 18 dezenas que você deseja jogar. O sistema conta para você!" 
          posicao="baixo"
          falar={true} 
        />
      )}
      {etapa === "resultado" && (
        <MagoDaSorte 
          texto="Muito bem! Veja o resultado da sua simulação. Clique no botão verde para ver os cartões." 
          posicao="baixo"
          falar={true} 
        />
      )}

      <main className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full mt-10">
        <div className="mb-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-[var(--gj-roxo)]">← Voltar para Home</Link>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--gj-roxo)] mb-2">Simulador Lotofácil</h1>
          <p className="text-gray-600">Faça sua simulação e descubra o poder dos nossos fechamentos.</p>
        </div>

        {/* ETAPA 1: ESCOLHER A MATRIZ */}
        {etapa === "matriz" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center">Escolha sua Estratégia</h2>
            <div className="space-y-4">
              {[
                { nome: "Fechamento Bronze", dezenas: 18, cartoes: 21 },
                { nome: "Fechamento Prata", dezenas: 19, cartoes: 35 },
                { nome: "Fechamento Ouro", dezenas: 20, cartoes: 50 },
              ].map((matriz, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[var(--gj-verde)] transition-colors cursor-pointer" onClick={() => { setMatrizSelecionada(matriz.nome); setEtapa("volante"); }}>
                  <div>
                    <p className="font-bold text-gray-800">{matriz.nome}</p>
                    <p className="text-sm text-gray-500">{matriz.dezenas} dezenas | {matriz.cartoes} cartões</p>
                  </div>
                  {/* BOTÃO PISCANTE - LUZ VERDE */}
                  <button className="bg-[var(--gj-roxo)] text-white px-6 py-3 rounded-md font-bold text-sm luz-magica transition-transform hover:scale-110">
  Selecionar
</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 2: O VOLANTE */}
        {etapa === "volante" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[var(--gj-roxo)]">{matrizSelecionada}</h2>
              <button onClick={() => setEtapa("matriz")} className="text-sm text-gray-500 hover:underline">Trocar Matriz</button>
            </div>
            
            <div className="text-center mb-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-blue-800 font-medium">Selecione as dezenas no volante abaixo</p>
              <p className="text-blue-600 font-bold text-lg">0 / 18 selecionadas</p>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 mb-8 px-2 md:px-0">
              {Array.from({ length: 25 }, (_, i) => (
                <button key={i} className="aspect-square flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-green-100 transition-colors">
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-[var(--gj-verde)] text-white font-bold py-3 rounded-lg opacity-50 cursor-not-allowed">
                Confirmar Seleção (Falta 18)
              </button>
              <button onClick={() => setEtapa("resultado")} className="flex-1 bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition-colors">
                Simular (Fake p/ teste)
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: RESULTADO E PAYWALL */}
        {etapa === "resultado" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-[var(--gj-roxo)] mb-6">Resultado da Simulação</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-8">
              <p className="text-green-800 text-lg mb-2">Excelente! No teste de 10 sorteios você obteve:</p>
              <p className="text-3xl font-extrabold text-[var(--gj-verde)]">15 Cartões Premiados</p>
              <p className="text-gray-600 mt-2">Valor estimado total: <strong>R$ 120,00</strong></p>
            </div>

            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--gj-verde)] rounded-xl bg-gray-50">
              <p className="text-gray-600 mb-4 text-center">Para ver os números dos seus cartões, clique no botão abaixo.</p>
              
              <button className="bg-[var(--gj-verde)] text-white text-xl font-extrabold px-12 py-4 rounded-full luz-magica transition-transform hover:scale-110">
  👉 VER JOGOS 👈
</button>
              
              <p className="text-sm text-gray-400 mt-6 flex items-center gap-1">
                🔒 Página exclusiva para membros.
              </p>
            </div>
          </div>
        )}

      </main>

{/* Espaçador para o Mago no celular */}
      <div className="h-32 md:h-0 w-full"></div>

{/* Espaçador para o Mago no celular */}
      <div className="h-40 md:h-0 w-full block"></div>

      <Footer />
    </div>
  );
}