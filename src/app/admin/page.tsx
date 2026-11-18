"use client";

import { useState } from "react";
import Link from "next/link";
import {
  desbloquearCofreAction,
  excluirMatrizDoCofreAction,
  salvarMatrizNoCofreAction,
  sincronizar300ConcursosAction,
} from "./actions";

const SQL_CRIAR_TABELAS_300 = `CREATE TABLE IF NOT EXISTS resultados_lotofacil (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_megasena (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_quina (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_lotomania (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_diadesorte (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, mes_sorte VARCHAR(30), updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_duplasena (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, dezenas_sorteio_2 INT[], updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_timemania (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, time_coracao VARCHAR(80), updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_maismilionaria (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, trevos INT[], updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
CREATE TABLE IF NOT EXISTS resultados_supersete (concurso INT PRIMARY KEY, data_sorteio VARCHAR(20) NOT NULL, dezenas INT[] NOT NULL, updated_at TIMESTAMPTZ DEFAULT now() NOT NULL);
ALTER TABLE resultados_lotofacil ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_megasena ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_quina ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_lotomania ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_diadesorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_duplasena ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_timemania ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_maismilionaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_supersete ENABLE ROW LEVEL SECURITY;`;

interface StatusTabela300 {
  loteria: string;
  tabela: string;
  sucesso: boolean;
  totalNoBanco?: number;
  ultimoConcurso?: number;
  ultimaData?: string;
  erro?: string;
}

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

  const [tabelas300Criadas, setTabelas300Criadas] = useState(false);
  const [itensStatus300, setItensStatus300] = useState<StatusTabela300[]>([]);
  const [sincronizando300, setSincronizando300] = useState(false);
  const [sqlCopiado, setSqlCopiado] = useState(false);

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
    if (resp.statusResultados) {
      setTabelas300Criadas(resp.statusResultados.tabelasCriadas);
      setItensStatus300(resp.statusResultados.itens as StatusTabela300[]);
    }
    setDesbloqueado(true);
  };

  const handleSincronizar300 = async () => {
    setSincronizando300(true);
    const resp = await sincronizar300ConcursosAction(senhaMestre);
    setSincronizando300(false);

    if (resp.statusResultados) {
      setTabelas300Criadas(resp.statusResultados.tabelasCriadas);
      setItensStatus300(resp.statusResultados.itens as StatusTabela300[]);
    }
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

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xs font-bold text-[var(--gj-roxo)] hover:underline"
              >
                ← Ver Site (Home)
              </Link>
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
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Matriz Fixa (Cole direto do Excel ou em JSON)
              </label>

              <p className="text-xs text-gray-500 mb-2">
                Cole as linhas direto da sua planilha Excel (um cartão por linha) ou em formato JSON. Os dados vão criptografados direto para o Cofre e não ficam no código-fonte.
              </p>

              <textarea
                rows={7}
                value={matrizTexto}
                onChange={(e) => setMatrizTexto(e.target.value)}
                placeholder="Cole aqui as linhas da sua planilha Excel..."
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
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-bold text-[var(--gj-roxo)]">
                        {nomeLoteria || "Loteria"}
                      </span>{" "}
                      — <span className="font-semibold text-gray-800">{m.nome_comercial}</span>
                      <span className="ml-2 text-gray-500 text-xs font-medium">
                        ({m.qtd_dezenas_escolhidas} dezenas → {m.qtd_cartoes_gerados} cartões)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Deseja remover a matriz "${m.nome_comercial}" do Cofre?`)) return;
                        const resp = await excluirMatrizDoCofreAction({
                          senhaMestre,
                          matrizId: m.id,
                        });
                        if (resp.sucesso && resp.matrizes) {
                          setMatrizesSalvas(resp.matrizes as MatrizResumo[]);
                        }
                      }}
                      className="text-xs font-bold text-red-600 hover:underline shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel de Resultados Oficiais (300 Concursos Isolados por Loteria + Agendador 01:00 BRT) */}
        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Bancos Isolados dos Últimos 300 Concursos Oficiais
              </h2>
              <p className="text-xs text-gray-500">
                Atualização automática agendada todos os dias às{" "}
                <strong>01:00 (Horário de Brasília)</strong>. Cada loteria mantém
                sua própria tabela exclusiva com os 300 sorteios mais recentes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSincronizar300}
              disabled={sincronizando300}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {sincronizando300
                ? "Baixando 300 Concursos de cada Loteria..."
                : "🔄 Carregar / Atualizar 300 Concursos Agora"}
            </button>
          </div>

          {!tabelas300Criadas && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2">
              <p className="text-xs sm:text-sm font-bold text-amber-900">
                ⚠️ Primeiro uso: clique no botão abaixo para copiar o comando de criação das 9 tabelas isoladas, cole no SQL Editor do Supabase e clique em Run. Depois clique em &quot;Carregar / Atualizar 300 Concursos Agora&quot;!
              </p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(SQL_CRIAR_TABELAS_300);
                  setSqlCopiado(true);
                  setTimeout(() => setSqlCopiado(false), 3000);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-md transition"
              >
                {sqlCopiado
                  ? "SQL Copiado! Cole no SQL Editor do Supabase ✓"
                  : "Copiar SQL das 9 Tabelas Isoladas"}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-2 pr-3">Loteria</th>
                  <th className="py-2 pr-3">Tabela Exclusiva</th>
                  <th className="py-2 pr-3">Qtd. no Banco</th>
                  <th className="py-2 pr-3">Último Concurso</th>
                  <th className="py-2">Data do Sorteio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itensStatus300.map((it) => (
                  <tr key={it.tabela}>
                    <td className="py-2 pr-3 font-bold text-gray-800">{it.loteria}</td>
                    <td className="py-2 pr-3 font-mono text-xs text-gray-500">{it.tabela}</td>
                    <td className="py-2 pr-3 font-bold">
                      {it.sucesso ? (
                        <span
                          className={
                            (it.totalNoBanco ?? 0) >= 300
                              ? "text-green-700"
                              : "text-amber-600"
                          }
                        >
                          {it.totalNoBanco ?? 0} / 300
                        </span>
                      ) : (
                        <span className="text-red-600">Tabela pendente</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-semibold text-gray-700">
                      {it.ultimoConcurso ?? "-"}
                    </td>
                    <td className="py-2 text-gray-600">{it.ultimaData ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
