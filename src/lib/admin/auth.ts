import crypto from "crypto";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

const NOME_COOKIE_ADMIN = "grandejogada_admin_token";

/**
 * Obtém a Senha Mestre do .env.local preservando caracteres especiais (#, $, !, etc.)
 */
export function obterSenhaMestre(): string {
  try {
    const envLocalPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const conteudo = fs.readFileSync(envLocalPath, "utf8");
      for (const linhaBruta of conteudo.split(/\r?\n/)) {
        if (linhaBruta.startsWith("SENHA_MESTRE=")) {
          const valor = linhaBruta.slice("SENHA_MESTRE=".length).trim();
          if (valor.length > 0) {
            return valor.replace(/^(['"])([\s\S]*)\1$/, "$2");
          }
        }
      }
    }
  } catch {
    // Segue para process.env
  }

  return process.env.SENHA_MESTRE || "";
}

export function validarSenhaMestreExata(senhaDigitada: string): boolean {
  const senhaEsperada = obterSenhaMestre();
  if (!senhaEsperada) return false;

  const b1 = Buffer.from((senhaDigitada || "").trim(), "utf8");
  const b2 = Buffer.from(senhaEsperada, "utf8");

  if (b1.length !== b2.length) return false;
  return crypto.timingSafeEqual(b1, b2);
}

function gerarAssinaturaAdmin(senhaMestre: string): string {
  return crypto
    .createHmac("sha256", "chave-secreta-grande-jogada-adm")
    .update(`admin-autenticado-master:${senhaMestre}`)
    .digest("hex");
}

export async function verificarSessaoAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(NOME_COOKIE_ADMIN)?.value;
    if (!token) return false;

    const senhaMestre = obterSenhaMestre();
    if (!senhaMestre) return false;

    const assinaturaEsperada = gerarAssinaturaAdmin(senhaMestre);
    const b1 = Buffer.from(token, "utf8");
    const b2 = Buffer.from(assinaturaEsperada, "utf8");

    if (b1.length !== b2.length) return false;
    return crypto.timingSafeEqual(b1, b2);
  } catch {
    return false;
  }
}

export async function criarCookieSessaoAdmin(senhaMestre: string): Promise<boolean> {
  if (!validarSenhaMestreExata(senhaMestre)) return false;

  const token = gerarAssinaturaAdmin(senhaMestre);
  const cookieStore = await cookies();

  cookieStore.set({
    name: NOME_COOKIE_ADMIN,
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 dias de passe livre como Administrador
  });

  return true;
}

export async function removerCookieSessaoAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(NOME_COOKIE_ADMIN);
}
