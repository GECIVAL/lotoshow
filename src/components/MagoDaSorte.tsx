"use client";

import { useEffect } from "react";

interface MagoDaSorteProps {
  texto: string;
  posicao?: "topo" | "baixo" | "centro";
  falar?: boolean;
}

export default function MagoDaSorte({ texto, posicao = "baixo", falar = false }: MagoDaSorteProps) {
  
  useEffect(() => {
    if (falar && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = "pt-BR";
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [texto, falar]);

  // No celular, a posição "baixo" vira uma barra fixa na parte inferior.
  // No PC (md:), ele volta a ser um balão flutuante no canto.
    const posicaoClasses = {
    topo: "top-4 left-1/2 -translate-x-1/2 w-11/12 md:w-auto",
    baixo: "!bottom-4 left-4 right-4 md:!bottom-8 md:left-auto md:right-8 md:w-auto",
    centro: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-auto",
  };

  return (
    <div className={`fixed z-50 flex items-end gap-2 animate-bounce-short ${posicaoClasses[posicao]}`}>
      
      {/* Avatar do Mago (Fica à esquerda no celular e à direita no PC) */}
      <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-[#2D1B4E] rounded-full flex items-center justify-center border-4 border-[var(--gj-laranja)] shadow-[0_0_15px_rgba(242,140,40,0.5)]">
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="p-1">
          <path d="M12 2L4 10H20L12 2Z" fill="#F28C28" />
          <circle cx="12" cy="14" r="6" fill="#FDE047" />
          <path d="M6 14C6 18 9 22 12 22C15 22 18 18 18 14C18 12 16 10 12 10C8 10 6 12 6 14Z" fill="#E5E7EB" />
          <circle cx="10" cy="13" r="1" fill="#1F2937" />
          <circle cx="14" cy="13" r="1" fill="#1F2937" />
        </svg>
      </div>

      {/* Balão de Fala */}
      <div className="bg-[#2D1B4E] text-white p-3 md:p-4 rounded-2xl rounded-bl-none shadow-2xl border-2 border-[var(--gj-laranja)] flex-grow md:flex-grow-0 md:max-w-xs">
        <p className="text-xs md:text-sm font-medium leading-relaxed">
          <span className="text-[var(--gj-laranja)] font-bold">🧙‍♂️ Mago:</span> <br/>
          {texto}
        </p>
      </div>

    </div>
  );
}