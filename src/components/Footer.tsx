import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#F8F9FA] border-t border-gray-200 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
        <Image
          src="/icone.svg"
          alt="Ícone Grande Jogada"
          width={56}
          height={56}
          className="rounded-xl mb-3 shadow-sm w-14 h-14"
        />

        <p className="font-bold text-[var(--gj-roxo)] mb-0.5 text-base sm:text-lg">
          GRANDE JOGADA
        </p>
        <p className="text-[var(--gj-verde)] font-semibold text-xs sm:text-sm mb-3">
          Sistema Lotérico
        </p>

        <p className="text-gray-500 text-xs sm:text-sm">
          © 2026 Todos os direitos reservados.
        </p>
        <p className="mt-1.5 text-gray-400 text-xs max-w-md">
          Este é um sistema de simulação e análise estatística. Não realizamos apostas.
        </p>
      </div>
    </footer>
  );
}
