interface GameCardProps {
  nome: string;
  dezenas: string;
  dias: string;
  cor: string;
  corFundo: string;
  emBreve?: boolean;
}

export default function GameCard({
  nome,
  dezenas,
  dias,
  cor,
  corFundo,
  emBreve = false,
}: GameCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-gray-200 flex flex-col items-center text-center transition-all h-full ${
        emBreve
          ? "opacity-80 hover:opacity-100"
          : "hover:shadow-md hover:border-green-400 hover:-translate-y-0.5 cursor-pointer"
      }`}
    >
      <div className="mb-2">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill={cor}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 8 8.2 9.3 9.3 10.1C7.5 11 6.5 12.9 6.5 15C6.5 17.5 8.5 19.5 11 19.5C12 19.5 13 19.1 13.8 18.5C14.5 19.1 15.5 19.5 16.5 19.5C19 19.5 21 17.5 21 15C21 12.9 20 11 18.2 10.1C19.3 9.3 20 8 20 6.5C20 4 18 2 15.5 2C14.5 2 13.5 2.4 12.8 3C12.1 2.4 11.1 2 10.1 2H12Z" />
          <path
            d="M12 6V18M6 12H18"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className="px-3 py-1 rounded-full text-white font-extrabold text-xs sm:text-sm mb-2 w-full max-w-[160px] truncate"
        style={{ backgroundColor: corFundo }}
      >
        {nome}
      </div>

      <p className="text-gray-700 font-semibold text-xs mb-1.5 leading-snug">
        {dezenas}
      </p>

      <p className="text-gray-400 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase mt-auto">
        {dias}
      </p>
    </div>
  );
}
