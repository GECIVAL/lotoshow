-- ============================================================================
-- GRANDE JOGADA - TABELAS INDEPENDENTES DOS ÚLTIMOS 300 CONCURSOS POR LOTERIA
-- As loterias NÃO conversam entre si: cada uma possui sua tabela própria.
-- ============================================================================

CREATE TABLE IF NOT EXISTS resultados_lotofacil (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_megasena (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_quina (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_lotomania (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_diadesorte (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  mes_sorte VARCHAR(30),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_duplasena (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  dezenas_sorteio_2 INT[],
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_timemania (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  time_coracao VARCHAR(80),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_maismilionaria (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  trevos INT[],
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS resultados_supersete (
  concurso INT PRIMARY KEY,
  data_sorteio VARCHAR(20) NOT NULL,
  dezenas INT[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilita RLS em todas (bloqueando qualquer alteração vinda do navegador; só o servidor grava)
ALTER TABLE resultados_lotofacil ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_megasena ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_quina ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_lotomania ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_diadesorte ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_duplasena ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_timemania ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_maismilionaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_supersete ENABLE ROW LEVEL SECURITY;
