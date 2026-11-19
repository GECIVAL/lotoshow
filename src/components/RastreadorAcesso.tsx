"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { registrarAcessoAction } from "@/app/actions/telemetria";

export default function RastreadorAcesso() {
  const pathname = usePathname();
  const ultimaPaginaRef = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== ultimaPaginaRef.current) {
      ultimaPaginaRef.current = pathname;
      // Registra silenciosamente a visualização de página
      registrarAcessoAction(pathname).catch(() => {});
    }
  }, [pathname]);

  return null;
}
