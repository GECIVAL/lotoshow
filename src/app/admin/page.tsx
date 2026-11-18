"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const [loteria, setLoteria] = useState("Lotofacil");
  const [nomeComercial, setNomeComercial] = useState("Fechamento Bronze");
  const [dezenas, setDezenas] = useState(20);
  const [cartoes, setCartoes] = useState(20);
  const [matrizJson, setMatrizJson] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  // Função do Raio-X para ver o que tem no banco
  const testarConexao = async () => {
    const { data, error } = await supabase.from('loterias').select('*');
    if (error) {
      alert("Erro ao buscar: " + error.message);
    } else {
      alert("O site encontrou " + data.length + " loterias: " + JSON.stringify(data));
    }
  };

  const handleSalvar = async () => {
    setLoading(true);
    setMensagem("");

    try {
      const parsedMatriz = JSON.parse(matrizJson);

      if (!Array.isArray(parsedMatriz) || parsedMatriz.length !== cartoes) {
        throw new Error(`O JSON deve ser uma lista com exatamente ${cartoes} cartões.`);
      }

      // Busca o ID da loteria exatamente como está no banco
      const { data: loteriaData, error: loteriaError } = await supabase
        .from('loterias')
        .select('id')
        .eq('nome', loteria)
        .single();

      if (loteriaError || !loteriaData) {
        throw new Error("Loteria não encontrada no banco. Verifique se o nome está sem acento.");
      }

      const { error: insertError } = await supabase
        .from('matrizes')
        .insert({
          loteria_id: loteriaData.id,
          nome_comercial: nomeComercial,
          qtd_dezenas_escolhidas: dezenas,
          qtd_cartoes_gerados: cartoes,
          dados_matriz: parsedMatriz
        });

      if (insertError) throw new Error(insertError.message);

      setMensagem(`Matriz "${nomeComercial}" salva com sucesso no banco de dados!`);
      setMatrizJson("");

    } catch (e: any) {
      setMensagem("Erro: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center gap-4 mb-8 border-b pb-4">
          <div className="bg-red-100 text-red-600 p-3 rounded-full text-2xl">🔒</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Painel Master</h1>
            <p className="text-sm text-gray-500">Área restrita para cadastro de matrizes (Cofre).</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Loteria</label>
              <select value={loteria} onChange={(e) => setLoteria(e.target.value)} className="w-full border p-2 rounded">
                <option value="Lotofacil">Lotofácil</option>
                <option value="MegaSena">Mega Sena</option>
                <option value="Quina">Quina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Comercial</label>
              <input type="text" value={nomeComercial} onChange={(e) => setNomeComercial(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Qtd. Dezenas Escolhidas</label>
              <input type="number" value={dezenas} onChange={(e) => setDezenas(Number(e.target.value))} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Qtd. Cartões Gerados</label>
              <input type="number" value={cartoes} onChange={(e) => setCartoes(Number(e.target.value))} className="w-full border p-2 rounded" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Gabarito de Posições (JSON)</label>
            <p className="text-xs text-gray-500 mb-2">Cole a matriz do Excel convertida.</p>
            <textarea 
              rows={6} 
              value={matrizJson}
              onChange={(e) => setMatrizJson(e.target.value)}
              placeholder='[[2,3,5...], [2,3,4...]]'
              className="w-full border p-2 rounded font-mono text-sm"
            />
          </div>

          <button onClick={handleSalvar} disabled={loading} className="w-full bg-[var(--gj-roxo)] text-white font-bold py-3 rounded-lg hover:bg-purple-900 transition disabled:opacity-50">
            {loading ? "Salvando no Cofre..." : "Salvar Matriz no Cofre"}
          </button>

          {/* BOTÃO DO RAIO-X */}
          <button onClick={testarConexao} className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg mt-4">
            Raio-X: Ver Loterias no Banco
          </button>

          {mensagem && (
            <div className={`p-4 rounded-lg font-bold text-center ${mensagem.includes("Erro") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {mensagem}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}