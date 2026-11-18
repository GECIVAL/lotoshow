import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <Link href="/" className="flex items-center">
          <Image 
            src="/logo.png" 
            alt="Grande Jogada" 
            width={240} 
            height={60} 
            className="object-contain"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
          <Link href="#sobre" className="hover:text-[var(--gj-roxo)] transition-colors">SOBRE</Link>
          <Link href="#contato" className="hover:text-[var(--gj-roxo)] transition-colors">ENTRAR EM CONTATO</Link>
          <Link href="#como-jogar" className="hover:text-[var(--gj-roxo)] transition-colors">COMO JOGAR</Link>
          <Link href="#jogos" className="hover:text-[var(--gj-roxo)] transition-colors">JOGOS</Link>
          <Link href="#planos" className="hover:text-[var(--gj-roxo)] transition-colors">PLANOS</Link>
          <Link href="/estatistica" className="hover:text-[var(--gj-roxo)] transition-colors">ESTATÍSTICA</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md transition-colors">
            LOGIN
          </Link>
          <Link href="/cadastro" className="text-sm font-bold text-white bg-[var(--gj-verde)] hover:bg-green-700 px-5 py-2 rounded-md transition-colors">
            CADASTRE-SE
          </Link>
        </div>
      </div>
    </header>
  );
}