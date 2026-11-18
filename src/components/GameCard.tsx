interface GameCardProps {
  nome: string;
  dezenas: string;
  cartoes: string;
  dias: string;
  cor: string;
  corFundo: string;
}

export default function GameCard({ nome, dezenas, cartoes, dias, cor, corFundo }: GameCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow cursor-pointer">
      <div className="mb-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill={cor} xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 8 8.2 9.3 9.3 10.1C7.5 11 6.5 12.9 6.5 15C6.5 17.5 8.5 19.5 11 19.5C12 19.5 13 19.1 13.8 18.5C14.5 19.1 15.5 19.5 16.5 19.5C19 19.5 21 17.5 21 15C21 12.9 20 11 18.2 10.1C19.3 9.3 20 8 20 6.5C20 4 18 2 15.5 2C14.5 2 13.5 2.4 12.8 3C12.1 2.4 11.1 2 10.1 2H12Z" />
          <path d="M12 6V18M6 12H18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      
      <div className={`px-6 py-1.5 rounded-full text-white font-bold text-sm mb-3 w-full max-w-[150px]`} style={{ backgroundColor: corFundo }}>
        {nome}
      </div>
      
      <p className="text-gray-700 font-semibold text-sm mb-1">{dezenas}</p>
      <p className="text-gray-700 font-semibold text-sm mb-4">{cartoes}</p>
      <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mt-auto">{dias}</p>
    </div>
  );
}