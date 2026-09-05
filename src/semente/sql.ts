export type Cru = { cru: string }

export type Valor = string | number | boolean | null | Cru

export function cru(sql: string): Cru {
  return { cru: sql }
}

export function valorSql(valor: Valor): string {
  if (valor === null) return 'NULL'
  if (typeof valor === 'boolean') return valor ? '1' : '0'
  if (typeof valor === 'number') return String(valor)
  if (typeof valor === 'object') return valor.cru
  return "'" + valor.replace(/'/g, "''") + "'"
}

export function inserirOuIgnorar(tabela: string, linha: Record<string, Valor>): string {
  const colunas = Object.keys(linha)
  const valores = colunas.map((coluna) => valorSql(linha[coluna]))
  return `INSERT OR IGNORE INTO ${tabela} (${colunas.join(', ')}) VALUES (${valores.join(', ')});`
}

export function idDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
