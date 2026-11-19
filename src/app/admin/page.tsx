"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  desbloquearAbaEspecialAction,
  excluirMatrizDoCofreAction,
  salvarMatrizNoCofreAction,
  sincronizar300ConcursosAction,
  obterMetricasPainelAdminAction,
  encerrarSessaoAdminAction,
} from "./actions";
import { MetricasFluxo } from "@/lib/telemetria/fluxo";

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
  // Controle de Abas do Painel
  const [abaAtiva, setAbaAtiva] = useState<"fluxo" | "especial">("fluxo");

  // Métricas de Fluxo de Usuários
  const [metricas, setMetricas] = useState<MetricasFluxo | null>(null);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);

  // Controle da Aba Especial (Cofre Master)
  const [senhaMestre, setSenhaMestre] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [abaEspecialAberta, setAbaEspecialAberta] = useState(false);
  const [erroLoginEspecial, setErroLoginEspecial] = useState("");
  const [modoAdminAtivo, setModoAdminAtivo] = useState(false);

  // Formulário do Cofre
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

  // Sincronizador
  const [itensStatus300, setItensStatus300] = useState<StatusTabela300[]>([]);
  const [sincronizando300, setSincronizando300] = useState(false);

  // Carrega Métricas de Fluxo na montagem
  useEffect(() => {
    async function carregar() {
      setCarregandoMetricas(true);
      const resp = await obterMetricasPainelAdminAction();
      if (resp.sucesso && resp.metricas) {
        setMetricas(resp.metricas);
        if (resp.isAdmin) {
          setModoAdminAtivo(true);
          setAbaEspecialAberta(true);
        }
      }
      setCarregandoMetricas(false);
    }
    carregar();
  }, []);

  const handleDesbloquearEspecial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErroLoginEspecial("");

    const resp = await desbloquearAbaEspecialAction(senhaMestre);
    setLoading(false);

    if (!resp.sucesso) {
      setErroLoginEspecial(resp.erro || "Senha Mestre incorreta.");
      return;
    }

    setMatrizesSalvas((resp.matrizes as MatrizResumo[]) || []);
    if (resp.statusResultados) {
      setItensStatus300(resp.statusResultados.itens as StatusTabela300[]);
    }
    setAbaEspecialAberta(true);
    setModoAdminAtivo(true);
  };

  const handleEncerrarSessaoAdmin = async () => {
    await encerrarSessaoAdminAction();
    setModoAdminAtivo(false);
    setAbaEspecialAberta(false);
    setSenhaMestre("");
  };

  const handleSincronizar300 = async () => {
    setSincronizando300(true);
    const resp = await sincronizar300ConcursosAction(senhaMestre);
    setSincronizando300(false);

    if (resp.statusResultados) {
      setItensStatus300(resp.statusResultados.itens as StatusTabela300[]);
    }
  };

  const handleSalvarMatriz = async () => {
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
        setMensagem(resp.mensagem || "Matriz salva com sucesso no Cofre!");
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

  const handleExcluirMatriz = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta matriz do cofre?")) return;
    setLoading(true);
    const resp = await excluirMatrizDoCofreAction({ senhaMestre, matrizId: id });
    setLoading(false);
    if (resp.sucesso && resp.matrizes) {
      setMatrizesSalvas(resp.matrizes as MatrizResumo[]);
      setTipoMensagem("sucesso");
      setMensagem("Matriz removida do cofre com sucesso.");
    } else {
      setTipoMensagem("erro");
      setMensagem(resp.erro || "Erro ao excluir matriz.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Cabeçalho do Painel Administrativo */}
      <header className="bg-gray-900 text-white shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="font-black text-lg sm:text-xl tracking-wide flex items-center gap-2">
                Painel Administrativo Master
                {modoAdminAtivo && (
                  <span className="bg-amber-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    👑 ADM Liberado
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-400">
                Monitoramento de fluxo de usuários e controle de segurança
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <Link
              href="/"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition"
            >
              ← Ir para o Site
            </Link>
            {modoAdminAtivo ? (
              <button
                type="button"
                onClick={handleEncerrarSessaoAdmin}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                Bloquear Meu ADM
              </button>
            ) : null}
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-gray-800 pt-2">
          <button
            type="button"
            onClick={() => setAbaAtiva("fluxo")}
            className={`px-4 py-2 text-xs sm:text-sm font-extrabold rounded-t-lg transition flex items-center gap-2 ${
              abaAtiva === "fluxo"
                ? "bg-gray-100 text-gray-900 shadow"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>📊</span> Fluxo de Usuários & Estatísticas
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("especial")}
            className={`px-4 py-2 text-xs sm:text-sm font-extrabold rounded-t-lg transition flex items-center gap-2 ${
              abaAtiva === "especial"
                ? "bg-gray-100 text-gray-900 shadow"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span>{abaEspecialAberta ? "🔓" : "🔒"}</span> ABA ESPECIAL (COFRE MASTER)
            {!abaEspecialAberta && (
              <span className="bg-red-900/60 text-red-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                Requer Senha
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* ========================================================================= */}
        {/* ABA 1: FLUXO DE USUÁRIOS E ESTATÍSTICAS DE ACESSO */}
        {/* ========================================================================= */}
        {abaAtiva === "fluxo" && (
          <div className="space-y-6">
            {/* Banner Informativo */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black tracking-wide">
                  Monitoramento em Tempo Real do Fluxo de Visitantes
                </h2>
                <p className="text-xs text-purple-200 mt-1">
                  Acompanhe quais páginas os usuários estão mais acessando, tipos de dispositivos e crescimento de cadastros.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setCarregandoMetricas(true);
                  const resp = await obterMetricasPainelAdminAction();
                  if (resp.sucesso && resp.metricas) setMetricas(resp.metricas);
                  setCarregandoMetricas(false);
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-lg border border-white/20 transition whitespace-nowrap"
              >
                🔄 Atualizar Métricas
              </button>
            </div>

            {/* 4 Cards de Métricas Principais (KPIs) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Visualizações
                  </span>
                  <span className="text-xl">👁️</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
                  {carregandoMetricas ? "..." : metricas?.totalVisualizacoes ?? 0}
                </div>
                <span className="text-[11px] text-green-600 font-semibold mt-1 inline-block">
                  Acessos registrados nas páginas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Visitantes Únicos
                  </span>
                  <span className="text-xl">👥</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
                  {carregandoMetricas ? "..." : metricas?.totalVisitantesUnicos ?? 0}
                </div>
                <span className="text-[11px] text-gray-500 font-semibold mt-1 inline-block">
                  Sessões estimadas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Usuários Cadastrados
                  </span>
                  <span className="text-xl">📝</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">
                  {carregandoMetricas ? "..." : metricas?.totalUsuariosCadastrados ?? 0}
                </div>
                <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">
                  Contas criadas no banco
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Simulações Totais
                  </span>
                  <span className="text-xl">🎯</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                  {carregandoMetricas ? "..." : metricas?.totalSimulacoes ?? 0}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  Jogos testados no simulador
                </span>
              </div>
            </div>

            {/* Grid 2 Colunas: Páginas Mais Visitadas e Dispositivos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Páginas Mais Acessadas (2 colunas no desktop) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Páginas Mais Visitadas pelos Usuários</span>
                  <span className="text-xs text-gray-400 font-normal">Ranking de Acesso</span>
                </h3>

                {carregandoMetricas ? (
                  <p className="text-xs text-gray-500 py-6 text-center">Carregando fluxo...</p>
                ) : !metricas?.paginasMaisVisitadas?.length ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Nenhum acesso gravado ainda. Navegue pelo site para registrar visitas!
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {metricas.paginasMaisVisitadas.map((item) => (
                      <div key={item.pagina} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-800 font-mono">
                            {item.pagina === "/" ? "/ (Página Inicial)" : item.pagina}
                          </span>
                          <span className="text-gray-500 font-semibold">
                            {item.total} acessos ({item.porcentagem}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-[var(--gj-roxo)] h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, item.porcentagem)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Distribuição por Dispositivo */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider mb-4">
                    Dispositivos dos Usuários
                  </h3>

                  <div className="space-y-4">
                    {metricas?.distribuicaoDispositivos.map((d) => (
                      <div key={d.dispositivo} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                          <span>{d.dispositivo}</span>
                          <span className="text-gray-900">{d.porcentagem}%</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{d.total} acessos</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="bg-blue-50 text-blue-900 text-xs p-3 rounded-xl border border-blue-200">
                    💡 <strong>Dica de Negócio:</strong> Se a maioria dos acessos vier de celulares, o volante 5x5 compacto e a navegação rápida garantem maior conversão de assinantes.
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Últimos Acessos em Tempo Real */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <h3 className="font-black text-sm text-gray-800 uppercase tracking-wider mb-3">
                Histórico Recente de Visitas (Últimos Acessos)
              </h3>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-gray-100 text-gray-700 font-bold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Data e Hora (BRT)</th>
                      <th className="p-2.5">Página Visitada</th>
                      <th className="p-2.5">Dispositivo</th>
                      <th className="p-2.5 rounded-r-lg">Navegador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metricas?.ultimosAcessos?.length ? (
                      metricas.ultimosAcessos.map((v, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 text-gray-600 whitespace-nowrap">
                            {new Date(v.created_at).toLocaleString("pt-BR", {
                              timeZone: "America/Sao_Paulo",
                            })}
                          </td>
                          <td className="p-2.5 font-bold text-gray-800 font-mono">
                            {v.pagina}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.dispositivo === "Mobile"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {v.dispositivo}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-500">{v.navegador}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-gray-400">
                          Nenhum acesso registrado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: ABA ESPECIAL (COFRE MASTER DE MATRIZES E CONFIGURAÇÃO) */}
        {/* ========================================================================= */}
        {abaAtiva === "especial" && (
          <div>
            {!abaEspecialAberta ? (
              /* TELA DE BLOQUEIO DA ABA ESPECIAL (Exige Senha Mestre) */
              <div className="max-w-md mx-auto bg-white rounded-3xl p-8 sm:p-10 border-2 border-red-200 shadow-xl text-center space-y-6 my-10">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                  🔒
                </div>

                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    Aba Especial Ultra-Restrita
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Esta aba contém os algoritmos de fechamento, o <strong>Cofre Master de Matrizes</strong> e a chave de liberação geral.
                  </p>
                  <p className="text-xs font-bold text-red-600 mt-1">
                    Digite a Senha Mestre para abrir a aba especial.
                  </p>
                </div>

                <form onSubmit={handleDesbloquearEspecial} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
                      Senha Mestre do Administrador
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={senhaMestre}
                        onChange={(e) => setSenhaMestre(e.target.value)}
                        placeholder="Digite a Senha Mestre..."
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm transition pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        {mostrarSenha ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                  </div>

                  {erroLoginEspecial && (
                    <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-bold">
                      {erroLoginEspecial}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !senhaMestre}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Verificando..." : "🔓 Abrir Aba Especial"}
                  </button>
                </form>
              </div>
            ) : (
              /* CONTEÚDO LIBERADO DA ABA ESPECIAL */
              <div className="space-y-8">
                {/* Banner de Status do ADM */}
                <div className="bg-amber-400 text-gray-950 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">👑</span>
                    <div>
                      <h3 className="font-black text-sm sm:text-base tracking-wide">
                        Sua Chave Mestre de Administrador Está Ativa!
                      </h3>
                      <p className="text-xs text-gray-800">
                        Seu navegador agora tem <strong>Passe Livre Total</strong>: você pode navegar pela aba de <strong>Estatística</strong> e pela <strong>3ª Tela do Simulador (Ver Jogo)</strong> sem nenhum bloqueio comercial.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href="/simulador/lotofacil"
                      className="bg-gray-900 hover:bg-black text-white font-extrabold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Testar Simulador →
                    </Link>
                    <Link
                      href="/estatistica"
                      className="bg-purple-800 hover:bg-purple-900 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Ver Estatísticas →
                    </Link>
                  </div>
                </div>

                {/* Sincronizador dos 300 Concursos Oficiais */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-800">
                        Status do Banco de Dados — 300 Concursos por Loteria
                      </h3>
                      <p className="text-xs text-gray-500">
                        Atualizado automaticamente todos os dias às 01:00 BRT.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={sincronizando300}
                      onClick={handleSincronizar300}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow disabled:opacity-50"
                    >
                      {sincronizando300 ? "Sincronizando 9 Loterias..." : "🔄 Forçar Sincronização Agora"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                    {itensStatus300.map((st) => (
                      <div
                        key={st.tabela}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1"
                      >
                        <span className="font-extrabold text-gray-800 block">{st.loteria}</span>
                        <div className="text-emerald-700 font-bold text-[11px]">
                          ✓ {st.totalNoBanco ?? 0} no banco
                        </div>
                        {st.ultimoConcurso && (
                          <div className="text-gray-500 text-[10px]">
                            Último: #{st.ultimoConcurso} ({st.ultimaData})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cadastro de Novas Matrizes Fechadas */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
                  <div>
                    <h3 className="text-base font-black text-gray-800">
                      Cadastrar Nova Matriz no Cofre Master
                    </h3>
                    <p className="text-xs text-gray-500">
                      Cole as dezenas dos cartões diretamente de sua planilha Excel ou arquivo de texto.
                    </p>
                  </div>

                  {mensagem && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold border ${
                        tipoMensagem === "sucesso"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}
                    >
                      {mensagem}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Loteria
                      </label>
                      <select
                        value={loteria}
                        onChange={(e) => setLoteria(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold"
                      >
                        <option value="Lotofacil">Lotofácil (15 por cartão)</option>
                        <option value="MegaSena">Mega-Sena (6 por cartão)</option>
                        <option value="Quina">Quina (5 por cartão)</option>
                        <option value="Lotomania">Lotomania (50 por cartão)</option>
                        <option value="DiaDeSorte">Dia de Sorte (7 por cartão)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nome Comercial
                      </label>
                      <input
                        type="text"
                        value={nomeComercial}
                        onChange={(e) => setNomeComercial(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Dezenas Escolhidas
                      </label>
                      <input
                        type="number"
                        value={dezenas}
                        onChange={(e) => setDezenas(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Qtd. Cartões Gerados
                      </label>
                      <input
                        type="number"
                        value={cartoes}
                        onChange={(e) => setCartoes(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700">
                        Dezenas dos Cartões (Cole as linhas da planilha)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ignorarColunaId}
                          onChange={(e) => setIgnorarColunaId(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        Ignorar 1ª coluna (Número do cartão no Excel: 1, 2, 3...)
                      </label>
                    </div>

                    <textarea
                      rows={6}
                      value={matrizTexto}
                      onChange={(e) => setMatrizTexto(e.target.value)}
                      placeholder="Exemplo colado do Excel:&#10;1  1  2  3  4  5  6  7  8  9  10  11  12  13  14  15&#10;2  1  2  3  4  5  6  7  8  9  10  11  12  13  14  16"
                      className="w-full p-3 border border-gray-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading || !matrizTexto}
                    onClick={handleSalvarMatriz}
                    className="bg-[var(--gj-verde)] hover:bg-green-700 text-white font-black text-sm px-6 py-3 rounded-xl transition shadow disabled:opacity-50"
                  >
                    {loading ? "Salvando Matriz no Cofre..." : "💾 Salvar Matriz Fechada no Cofre"}
                  </button>
                </div>

                {/* Tabela de Matrizes Salvas no Cofre */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-base font-black text-gray-800">
                    Matrizes Ativas no Cofre Master
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-gray-100 text-gray-700 font-bold">
                        <tr>
                          <th className="p-2.5">Nome Comercial</th>
                          <th className="p-2.5">Dezenas</th>
                          <th className="p-2.5">Cartões</th>
                          <th className="p-2.5">Data Cadastro</th>
                          <th className="p-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matrizesSalvas.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-bold text-gray-800">{m.nome_comercial}</td>
                            <td className="p-2.5 font-semibold text-purple-700">
                              {m.qtd_dezenas_escolhidas} dezenas
                            </td>
                            <td className="p-2.5 font-semibold text-green-700">
                              {m.qtd_cartoes_gerados} cartões
                            </td>
                            <td className="p-2.5 text-gray-500">
                              {new Date(m.created_at).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleExcluirMatriz(m.id)}
                                className="text-red-600 hover:text-red-800 font-bold text-xs"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
