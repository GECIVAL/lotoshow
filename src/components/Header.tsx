"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.svg"
            alt="Grande Jogada - Sistema Lotérico"
            width={220}
            height={50}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Menu Desktop (telas grandes) */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-bold text-gray-600">
          <Link href="/#sobre" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">SOBRE</Link>
          <Link href="/#contato" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">ENTRAR EM CONTATO</Link>
          <Link href="/#como-jogar" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">COMO JOGAR</Link>
          <Link href="/#jogos" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">JOGOS</Link>
          <Link href="/#planos" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">PLANOS</Link>
          <Link href="/dashboard" className="hover:text-[var(--gj-roxo)] transition-colors whitespace-nowrap">ESTATÍSTICA</Link>
        </nav>

        {/* Botões de Ação + Botão Menu Mobile/Tablet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            LOGIN
          </Link>
          <Link
            href="/cadastro"
            className="text-xs sm:text-sm font-bold text-white bg-[var(--gj-verde)] hover:bg-green-700 px-4 py-2 rounded-md transition-colors whitespace-nowrap"
          >
            CADASTRE-SE
          </Link>

          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu de navegação"
            className="xl:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuAberto ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu recolhível para telas médias e celulares */}
      {menuAberto && (
        <nav className="xl:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-gray-600 shadow-inner">
          <Link href="/#sobre" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">SOBRE</Link>
          <Link href="/#contato" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">ENTRAR EM CONTATO</Link>
          <Link href="/#como-jogar" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">COMO JOGAR</Link>
          <Link href="/#jogos" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">JOGOS</Link>
          <Link href="/#planos" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">PLANOS</Link>
          <Link href="/dashboard" onClick={() => setMenuAberto(false)} className="hover:text-[var(--gj-roxo)]">ESTATÍSTICA</Link>
        </nav>
      )}
    </header>
  );
}
