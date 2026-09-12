ALTER TABLE sugestoes ADD COLUMN estado TEXT NOT NULL DEFAULT 'aberta';
ALTER TABLE sugestoes ADD COLUMN motivo TEXT NOT NULL DEFAULT '';
ALTER TABLE sugestoes ADD COLUMN decidida_em TEXT;
ALTER TABLE sugestoes ADD COLUMN decidida_por TEXT REFERENCES membros(id) ON DELETE SET NULL;
ALTER TABLE sugestoes ADD COLUMN escala_id TEXT REFERENCES escalas(id) ON DELETE SET NULL;

UPDATE sugestoes SET estado = 'aceita', decidida_em = promovida_em WHERE promovida_em IS NOT NULL;
