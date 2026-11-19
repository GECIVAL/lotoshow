"use server";

import { headers } from "next/headers";
import { registrarVisita } from "@/lib/telemetria/fluxo";

export async function registrarAcessoAction(pagina: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    await registrarVisita(pagina, userAgent);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
