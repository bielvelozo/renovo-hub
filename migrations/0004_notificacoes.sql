-- Silenciar é por Membro, não por aparelho: o spec diz "silenciar tudo no Perfil".
ALTER TABLE membros ADD COLUMN silenciado INTEGER NOT NULL DEFAULT 0;

-- Quantas mudanças de Repertório a notificação já juntou na janela de agrupamento.
ALTER TABLE notificacoes ADD COLUMN mudancas INTEGER NOT NULL DEFAULT 0;
