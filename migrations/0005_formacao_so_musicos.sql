DELETE FROM formacao_entradas
WHERE funcao_id IN (SELECT id FROM funcoes WHERE naipe <> 'instrumentos');
