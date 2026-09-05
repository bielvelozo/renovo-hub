export type NomeDoIcone = 'inicio' | 'mes' | 'musicas' | 'sugestoes' | 'perfil'

const TRACOS: Record<NomeDoIcone, string[]> = {
  inicio: ['M3 10.6 12 3.2l9 7.4', 'M5.6 9.4V19.8a1.2 1.2 0 0 0 1.2 1.2H10v-5.6h4V21h3.2a1.2 1.2 0 0 0 1.2-1.2V9.4'],
  mes: ['M4 5.8h16a.9.9 0 0 1 .9.9v13.4a.9.9 0 0 1-.9.9H4a.9.9 0 0 1-.9-.9V6.7a.9.9 0 0 1 .9-.9Z', 'M8 3.1v5', 'M16 3.1v5', 'M3.1 10.7h17.8'],
  musicas: ['M9.2 17.4V6.1l10-2.2v11.3'],
  sugestoes: ['M9.6 18.4h4.8', 'M10.6 21h2.8', 'M12 3.2a6.2 6.2 0 0 0-3.6 11.3c.6.4 1 1.1 1 1.8v.3h5.2v-.3c0-.7.4-1.4 1-1.8A6.2 6.2 0 0 0 12 3.2Z'],
  perfil: ['M12 4.4a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z', 'M4.6 20.6a7.4 7.4 0 0 1 14.8 0'],
}

const CIRCULOS: Partial<Record<NomeDoIcone, [number, number, number][]>> = {
  musicas: [
    [6.7, 17.4, 2.5],
    [16.7, 15.2, 2.5],
  ],
}

export function Icone({ nome }: { nome: NomeDoIcone }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {TRACOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
      {(CIRCULOS[nome] ?? []).map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  )
}
