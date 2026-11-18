import Image from "next/image";
import { cacheLife } from "next/cache";

export default async function Footer() {
  "use cache";
  cacheLife("days");

  const anoAtual = new Date().getFullYear();

  return (
    <footer className="bg-[#F8F9FA] border-t border-gray-200 mt-20 py-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
        <Image
          src="/icone.svg"
          alt="Ícone Grande Jogada"
          width={60}
          height={60}
          className="rounded-xl mb-4 shadow-sm w-15 h-15"
        />

        <p className="font-bold text-[var(--gj-roxo)] mb-1 text-lg">GRANDE JOGADA</p>
        <p className="text-[var(--gj-verde)] font-semibold text-sm mb-4">Sistema Lotérico</p>

        <p className="text-gray-500 text-sm">© {anoAtual} Todos os direitos reservados.</p>
        <p className="mt-2 text-gray-400 text-xs max-w-md">
          Este é um sistema de simulação e análise estatística. Não realizamos apostas.
        </p>
      </div>
    </footer>
  );
}
