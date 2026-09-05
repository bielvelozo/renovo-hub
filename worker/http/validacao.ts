export function ehData(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  return new Date(valor + 'T12:00:00Z').toISOString().slice(0, 10) === valor
}

export function ehMes(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}$/.test(valor)) return false
  const mes = Number(valor.slice(5))
  return mes >= 1 && mes <= 12
}

export function ehHorario(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{2}:\d{2}$/.test(valor)) return false
  const [hora, minuto] = valor.split(':').map(Number)
  return hora < 24 && minuto < 60
}

export function ehTextoCheio(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0
}

export function ehListaDeTextos(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((item) => typeof item === 'string')
}

export async function corpoJson<T>(requisicao: Request): Promise<T> {
  try {
    return (await requisicao.json()) as T
  } catch {
    return {} as T
  }
}

export function ehMinutagem(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{1,2}:\d{2}$/.test(valor)) return false
  return Number(valor.split(':')[1]) < 60
}
