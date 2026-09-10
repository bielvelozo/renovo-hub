-- Guarda o que o oEmbed do YouTube respondeu sobre cada vídeo. Sem isto a playlist
-- reconsulta a rede a cada abertura: o cache em memória do Worker quase nunca sobrevive.
CREATE TABLE videos_conferidos (
  video_id TEXT PRIMARY KEY,
  existe INTEGER NOT NULL,
  conferido_em TEXT NOT NULL
);
