-- Tarefas do guia que o Membro já fez, pelo tutorial ou fazendo de verdade.
CREATE TABLE guia_feitas (
  membro_id TEXT NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  tarefa TEXT NOT NULL,
  feita_em TEXT NOT NULL,
  PRIMARY KEY (membro_id, tarefa)
);

ALTER TABLE membros ADD COLUMN guia_escondido INTEGER NOT NULL DEFAULT 0;
