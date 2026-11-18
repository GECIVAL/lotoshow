export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Agendador interno para servidores contínuos: dispara sempre às 01:00 (Horário de Brasília)
    const g = globalThis as unknown as { __gjCronIniciado?: boolean };
    if (g.__gjCronIniciado) return;
    g.__gjCronIniciado = true;

    let ultimaDataExecutada = "";

    setInterval(async () => {
      try {
        const agoraBrasilia = new Date(
          new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
        );
        const hora = agoraBrasilia.getHours();
        const minuto = agoraBrasilia.getMinutes();
        const chaveDia = `${agoraBrasilia.getFullYear()}-${agoraBrasilia.getMonth() + 1}-${agoraBrasilia.getDate()}`;

        if (hora === 1 && minuto === 0 && ultimaDataExecutada !== chaveDia) {
          ultimaDataExecutada = chaveDia;
          const { sincronizarTodasAsLoterias300 } = await import(
            "@/lib/loterias/sincronizador"
          );
          await sincronizarTodasAsLoterias300(false);
        }
      } catch {
        // Silencioso para nunca interromper o servidor principal
      }
    }, 45000);
  }
}
