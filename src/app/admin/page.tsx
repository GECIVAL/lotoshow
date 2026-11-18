"use client";

import { useState } from "react";
import Link from "next/link";
import {
  desbloquearCofreAction,
  salvarMatrizNoCofreAction,
} from "./actions";

const MATRIZ_EXEMPLO_LOTOFACIL = [
  [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16, 17, 19, 20],
  [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19],
  [1, 2, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19],
  [1, 2, 4, 5, 6, 8, 10, 11, 12, 13, 14, 16, 17, 19, 20],
  [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 1],
  [1, 2, 4, 5, 6, 7, 9, 10, 11, 13, 15, 16, 18, 19, 20],
  [1, 3, 4, 6, 7, 9, 10, 11, 12, 14, 15, 17, 18, 19, 20],
  [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20],
  [1, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 17, 18, 20],
  [1, 3, 4, 5, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20],
  [2, 3, 4, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18, 20],
  [1, 2, 4, 5, 7, 8, 9, 11, 13, 14, 15, 17, 18, 19, 20],
  [2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 17, 19, 20],
  [2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14, 15, 18, 19, 20],
  [2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20],
  [1, 2, 3, 5, 7, 8, 9, 10, 12, 13, 14, 16, 18, 19, 20],
  [2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 15, 17, 18, 19, 20],
  [1, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20],
  [1, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 17, 19, 20],
  [1, 2, 3, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20],
];

interface MatrizResumo {
  id: number;
  nome_comercial: string;
  qtd_dezenas_escolhidas: number;
  qtd_cartoes_gerados: number;
  created_at: string;
  loterias?: { nome: string } | { nome: string }[] | null;
}

/**
 * Aceita tanto JSON [[2,3,...]] quanto linhas copiadas direto do Excel/Bloco de Notas.
 * Se a linha tiver 1 coluna extra na frente (ex.: número do cartão 1..20), permite ignorá-la automaticamente.
 */
function interpretarTextoMatriz(
  texto: string,
  ignorarPrimeiraColuna: boolean
): number[][] {
  const limpo = texto.trim();
  if (!limpo) {
    throw new Error("Cole os dados da matriz antes de salvar.");
  }

  if (limpo.startsWith("[")) {
    const parsed = JSON.parse(limpo);
    if (!Array.isArray(parsed)) {
      throw new Error("Formato JSON inválido.");
    }
    return parsed.map((linha: number[]) =>
      ignorarPrimeiraColuna ? linha.slice(1) : linha
    );
  }

  // Modo Excel / Texto puro: uma linha por cartão, números separados por espaço, tab, vírgula ou ponto e vírgula
  const linhas = limpo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return linhas.map((linha, idx) => {
    const numeros = linha
      .split(/[\s,;|\t]+/)
      .filter(Boolean)
      .map((item) => Number(item));

    if (numeros.some((n) => Number.isNaN(n))) {
      throw new Error(`A linha ${idx + 1} contém texto que não é número.`);
    }

    return ignorarPrimeiraColuna ? numeros.slice(1) : numeros;
  });
}

export default function AdminPage() {
  const [senhaMestre, setSenhaMestre] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  const [loteria, setLoteria] = useState("Lotofacil");
  const [nomeComercial, setNomeComercial] = useState("Fechamento Lotofácil 20 Dezenas");
  const [dezenas, setDezenas] = useState(20);
  const [cartoes, setCartoes] = useState(20);
  const [matrizTexto, setMatrizTexto] = useState("");
  const [ignorarColunaId, setIgnorarColunaId] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
  const [loading, setLoading] = useState(false);
  const [matrizesSalvas, setMatrizesSalvas] = useState<MatrizResumo[]>([]);

  const handleDesbloquear = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErroLogin("");

    const resp = await desbloquearCofreAction(senhaMestre);
    setLoading(false);

    if (!resp.sucesso) {
      setErroLogin(resp.erro || "Não foi possível abrir o Cofre.");
      return;
    }

    setMatrizesSalvas((resp.matrizes as MatrizResumo[]) || []);
    setDesbloqueado(true);
  };

  const preencherExemploLotofacil = () => {
    setLoteria("Lotofacil");
    setNomeComercial("Fechamento Lotofácil 20 Dezenas");
    setDezenas(20);
    setCartoes(20);
    setIgnorarColunaId(false);
    setMatrizTexto(JSON.stringify(MATRIZ_EXEMPLO_LOTOFACIL));
    setMensagem("");
  };

  const handleSalvar = async () => {
    setLoading(true);
    setMensagem("");

    try {
      const dadosMatriz = interpretarTextoMatriz(matrizTexto, ignorarColunaId);

      const resp = await salvarMatrizNoCofreAction({
        senhaMestre,
        loteria,
        nomeComercial,
        qtdDezenasEscolhidas: dezenas,
        qtdCartoesGerados: cartoes,
        dadosMatriz,
      });

      if (!resp.sucesso) {
        setTipoMensagem("erro");
        setMensagem(resp.erro || "Erro ao salvar.");
      } else {
        setTipoMensagem("sucesso");
        setMensagem(resp.mensagem || "Matriz salva com sucesso!");
        setMatrizTexto("");
        if (resp.matrizes) {
          setMatrizesSalvas(resp.matrizes as MatrizResumo[]);
        }
      }
    } catch (e: unknown) {
      setTipoMensagem("erro");
      setMensagem(e instanceof Error ? e.message : "Formato de matriz inválido.");
    } finally {
      setLoading(false);
    }
  };

  if (!desbloqueado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="mb-4">
            <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-[var(--gj-roxo)]">
              ← Voltar para o site
            </Link>
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-3">
              🔒
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Cofre Master</h1>
            <p className="text-sm text-gray-500 mt-1">
              Área exclusiva protegida por Senha Mestre. Técnicos e usuários comuns não possuem acesso.
            </p>
          </div>

          <form onSubmit={handleDesbloquear} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Senha Mestre
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senhaMestre}
                  onChange={(e) => setSenhaMestre(e.target.value)}
                  required
                  placeholder="Digite sua Senha Mestre"
                  className="w-full px-4 py-2.5 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--gj-roxo)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-[var(--gj-roxo)]"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {erroLogin && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                {erroLogin}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--gj-roxo)] hover:opacity-95 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Destrancar Cofre"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 p-3 rounded-full text-xl">🔓</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Painel Master (Cofre Aberto)</h1>
                <p className="text-xs sm:text-sm text-gray-500">
                  Suas matrizes são gravadas direto pelo servidor com bloqueio total contra leitura externa.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSenhaMestre("");
                setDesbloqueado(false);
              }}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Trancar Cofre e Sair
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Loteria</label>
                <select
                  value={loteria}
                  onChange={(e) => setLoteria(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                >
                  <option value="Lotofacil">Lotofácil</option>
                  <option value="MegaSena">Mega-Sena</option>
                  <option value="Quina">Quina</option>
                  <option value="Lotomania">Lotomania</option>
                  <option value="DiaDeSorte">Dia de Sorte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Comercial</label>
                <input
                  type="text"
                  value={nomeComercial}
                  onChange={(e) => setNomeComercial(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Qtd. Dezenas Escolhidas pelo Usuário
                </label>
                <input
                  type="number"
                  value={dezenas}
                  onChange={(e) => setDezenas(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Qtd. Cartões na Matriz
                </label>
                <input
                  type="number"
                  value={cartoes}
                  onChange={(e) => setCartoes(Number(e.target.value))}
                  className="w-full border border-gray-300 p-2.5 rounded-lg"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-sm font-bold text-gray-700">
                  Matriz Fixa (Cole direto do Excel ou em JSON)
                </label>
                <button
                  type="button"
                  onClick={preencherExemploLotofacil}
                  className="text-xs font-bold text-[var(--gj-roxo)] hover:underline"
                >
                  Preencher com sua Matriz Lotofácil (20 cartões)
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                Você pode colar as linhas direto da sua planilha Excel (um jogo por linha) ou no formato JSON.
              </p>

              <textarea
                rows={7}
                value={matrizTexto}
                onChange={(e) => setMatrizTexto(e.target.value)}
                placeholder="Cole aqui as linhas do Excel ou clique em 'Preencher com sua Matriz Lotofácil' acima..."
                className="w-full border border-gray-300 p-3 rounded-lg font-mono text-sm"
              />

              <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ignorarColunaId}
                  onChange={(e) => setIgnorarColunaId(e.target.checked)}
                  className="rounded"
                />
                A 1ª coluna colada do Excel é apenas o número do cartão (1, 2, 3...) — ignorar automaticamente
              </label>
            </div>

            <button
              type="button"
              onClick={handleSalvar}
              disabled={loading}
              className="w-full bg-[var(--gj-verde)] hover:bg-green-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Gravando no Cofre..." : "Salvar Matriz no Cofre"}
            </button>

            {mensagem && (
              <div
                className={`p-4 rounded-lg font-bold text-center text-sm ${
                  tipoMensagem === "erro"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {mensagem}
              </div>
            )}
          </div>
        </div>

        {/* Lista de matrizes já guardadas no Cofre */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Matrizes Guardadas no Cofre ({matrizesSalvas.length})
          </h2>

          {matrizesSalvas.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nenhuma matriz cadastrada ainda. Use o botão acima para salvar a primeira!
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {matrizesSalvas.map((m) => {
                const nomeLoteria = Array.isArray(m.loterias)
                  ? m.loterias[0]?.nome
                  : m.loterias?.nome;
                return (
                  <div key={m.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-[var(--gj-roxo)]">
                        {nomeLoteria || "Loteria"}
                      </span>{" "}
                      — <span className="font-semibold text-gray-800">{m.nome_comercial}</span>
                    </div>
                    <div className="text-gray-500 text-xs font-medium">
                      {m.qtd_dezenas_escolhidas} dezenas → {m.qtd_cartoes_gerados} cartões
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
