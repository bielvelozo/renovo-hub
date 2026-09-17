CREATE TABLE anexos_novo (
  id TEXT PRIMARY KEY,
  musica_id TEXT REFERENCES musicas(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES itens(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  mime TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  conteudo BLOB NOT NULL,
  letra TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  CHECK ((musica_id IS NULL) <> (item_id IS NULL))
);
INSERT INTO anexos_novo (id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em)
  SELECT id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em FROM anexos;
DROP TABLE anexos;
ALTER TABLE anexos_novo RENAME TO anexos;
CREATE INDEX anexos_por_musica ON anexos(musica_id, versao);
CREATE INDEX anexos_por_item ON anexos(item_id, versao);
