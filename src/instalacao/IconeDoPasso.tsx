import type { IconeDoPasso as Nome } from './plataforma'

const TRACOS: Record<Nome, string[]> = {
  compartilhar: ['M12 3.5v11', 'M8.4 7.1 12 3.5l3.6 3.6', 'M7.5 10.5H5.8v9.1a.9.9 0 0 0 .9.9h10.6a.9.9 0 0 0 .9-.9v-9.1h-1.7'],
  adicionar: ['M5.5 3.6h13a1.9 1.9 0 0 1 1.9 1.9v13a1.9 1.9 0 0 1-1.9 1.9h-13a1.9 1.9 0 0 1-1.9-1.9v-13a1.9 1.9 0 0 1 1.9-1.9Z', 'M12 8.2v7.6', 'M8.2 12h7.6'],
  menu: [],
  instalar: ['M12 3.8v10.4', 'M8.2 10.6 12 14.4l3.8-3.8', 'M4.8 17.4v1.9a.9.9 0 0 0 .9.9h12.6a.9.9 0 0 0 .9-.9v-1.9'],
}

const CIRCULOS: Partial<Record<Nome, [number, number, number][]>> = {
  menu: [
    [12, 5.4, 1.7],
    [12, 12, 1.7],
    [12, 18.6, 1.7],
  ],
}

export function IconeDoPasso({ nome }: { nome: Nome }) {
  return (
    <svg className="icone-do-passo" viewBox="0 0 24 24" aria-hidden="true">
      {TRACOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
      {(CIRCULOS[nome] ?? []).map(([cx, cy, r]) => (
        <circle key={cy} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  )
}
