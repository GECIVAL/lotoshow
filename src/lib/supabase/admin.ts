import dns from "node:dns";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { createClient } from "@supabase/supabase-js";

// Evita falha "TypeError: fetch failed" no Windows quando a operadora tem rota IPv6 instável
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

// Carrega os certificados raiz confiáveis do próprio Windows (ex.: antivírus local com filtro HTTPS)
let certificadosConfiaveis: string[] | undefined;
try {
  if (typeof tls.getCACertificates === "function") {
    certificadosConfiaveis = [
      ...tls.getCACertificates("default"),
      ...tls.getCACertificates("system"),
    ];
    if (typeof tls.setDefaultCACertificates === "function") {
      tls.setDefaultCACertificates(certificadosConfiaveis);
    }
  }
} catch {
  // Se a versão do Node em outro servidor não suportar, mantém o padrão
}

const ipv4HttpsAgent = new https.Agent({
  keepAlive: true,
  family: 4,
  ...(certificadosConfiaveis ? { ca: certificadosConfiaveis } : {}),
});

/**
 * Fetch resiliente para servidor Windows (força IPv4 via https nativo do Node,
 * evitando timeouts de Happy Eyeballs/IPv6 do undici).
 */
async function fetchServidorResiliente(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  const metodo = init?.method ?? (input instanceof Request ? input.method : "GET");
  const headersObj: Record<string, string> = {};

  if (input instanceof Request) {
    input.headers.forEach((v, k) => {
      headersObj[k] = v;
    });
  }

  if (init?.headers) {
    const h = new Headers(init.headers);
    h.forEach((v, k) => {
      headersObj[k] = v;
    });
  }

  let bodyBuffer: Buffer | undefined;
  if (init?.body != null) {
    if (typeof init.body === "string") {
      bodyBuffer = Buffer.from(init.body, "utf8");
    } else if (Buffer.isBuffer(init.body)) {
      bodyBuffer = init.body;
    } else if (init.body instanceof Uint8Array) {
      bodyBuffer = Buffer.from(init.body);
    } else {
      bodyBuffer = Buffer.from(String(init.body), "utf8");
    }
    if (!headersObj["content-length"] && !headersObj["Content-Length"]) {
      headersObj["Content-Length"] = String(bodyBuffer.byteLength);
    }
  }

  return new Promise<Response>((resolve, reject) => {
    const req = https.request(
      urlStr,
      {
        method: metodo,
        headers: headersObj,
        agent: ipv4HttpsAgent,
        family: 4,
        timeout: 15000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const rawBody = Buffer.concat(chunks);
          const respHeaders = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (Array.isArray(v)) {
              for (const item of v) respHeaders.append(k, item);
            } else if (typeof v === "string") {
              respHeaders.set(k, v);
            }
          }
          const status = res.statusCode ?? 500;
          const bodyParaResponse =
            status === 204 || status === 304 ? null : rawBody;

          resolve(
            new Response(bodyParaResponse, {
              status,
              statusText: res.statusMessage ?? "",
              headers: respHeaders,
            })
          );
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Tempo esgotado ao conectar ao Supabase (IPv4)."));
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

/**
 * Cliente administrativo exclusivo do SERVIDOR.
 * Nunca deve ser importado em componentes "use client".
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Chave SUPABASE_SERVICE_ROLE_KEY ainda não configurada no arquivo .env.local."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetchServidorResiliente,
    },
  });
}
