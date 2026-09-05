CREATE TABLE membros (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  admin INTEGER NOT NULL DEFAULT 0,
  ministro INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL
);

CREATE TABLE funcoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  naipe TEXT NOT NULL CHECK (naipe IN ('vocal', 'instrumentos', 'tecnica')),
  ordem INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE membro_funcoes (
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  funcao_id TEXT NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
  PRIMARY KEY (membro_id, funcao_id)
);

CREATE TABLE formacoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE formacao_entradas (
  formacao_id TEXT NOT NULL REFERENCES formacoes(id) ON DELETE CASCADE,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  funcao_id TEXT NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
  PRIMARY KEY (formacao_id, membro_id, funcao_id)
);

CREATE TABLE escalas (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  rotulo TEXT NOT NULL,
  santa_ceia INTEGER NOT NULL DEFAULT 0,
  cancelada INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL
);

CREATE INDEX escalas_por_data ON escalas(data);

CREATE TABLE equipe_membros (
  escala_id TEXT NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  ministro INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (escala_id, membro_id)
);

CREATE TABLE equipe_funcoes (
  escala_id TEXT NOT NULL,
  membro_id TEXT NOT NULL,
  funcao_id TEXT NOT NULL REFERENCES funcoes(id) ON DELETE CASCADE,
  PRIMARY KEY (escala_id, membro_id, funcao_id),
  FOREIGN KEY (escala_id, membro_id) REFERENCES equipe_membros(escala_id, membro_id) ON DELETE CASCADE
);

CREATE TABLE musicas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL DEFAULT '',
  video_id TEXT NOT NULL UNIQUE,
  spotify_url TEXT,
  legado INTEGER NOT NULL DEFAULT 0,
  tom_conhecido TEXT,
  tom_original TEXT,
  arquivada INTEGER NOT NULL DEFAULT 0,
  revisar INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL
);

CREATE TABLE sugestoes (
  id TEXT PRIMARY KEY,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  musica_id TEXT REFERENCES musicas(id) ON DELETE SET NULL,
  link TEXT,
  titulo TEXT,
  observacao TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  promovida_em TEXT
);

CREATE TABLE apoios (
  sugestao_id TEXT NOT NULL REFERENCES sugestoes(id) ON DELETE CASCADE,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  PRIMARY KEY (sugestao_id, membro_id)
);

CREATE TABLE itens (
  id TEXT PRIMARY KEY,
  escala_id TEXT NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('inteira', 'trecho', 'medley')),
  musica_id TEXT REFERENCES musicas(id),
  tom TEXT,
  inicio TEXT,
  fim TEXT,
  observacao TEXT NOT NULL DEFAULT '',
  ministrado_por TEXT REFERENCES membros(id) ON DELETE SET NULL,
  origem_sugestao_id TEXT REFERENCES sugestoes(id) ON DELETE SET NULL
);

CREATE INDEX itens_por_escala ON itens(escala_id, ordem);

CREATE TABLE trechos (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  musica_id TEXT NOT NULL REFERENCES musicas(id),
  tom TEXT,
  inicio TEXT,
  fim TEXT
);

CREATE INDEX trechos_por_item ON trechos(item_id, ordem);

CREATE TABLE convites (
  token TEXT PRIMARY KEY,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL,
  usado_em TEXT
);

CREATE TABLE sessoes (
  token TEXT PRIMARY KEY,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  dispositivo TEXT,
  criado_em TEXT NOT NULL,
  ultimo_uso TEXT
);

CREATE TABLE push_inscricoes (
  id TEXT PRIMARY KEY,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  criado_em TEXT NOT NULL
);

CREATE TABLE anexos (
  id TEXT PRIMARY KEY,
  musica_id TEXT NOT NULL REFERENCES musicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  mime TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  conteudo BLOB NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL
);

CREATE INDEX anexos_por_musica ON anexos(musica_id, versao);

CREATE TABLE notificacoes (
  id TEXT PRIMARY KEY,
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL DEFAULT '',
  url TEXT,
  escala_id TEXT REFERENCES escalas(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL,
  enviar_apos TEXT NOT NULL,
  enviada_em TEXT
);

CREATE INDEX notificacoes_pendentes ON notificacoes(enviada_em, enviar_apos);
