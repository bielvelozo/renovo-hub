export type NomeDoIcone =
  | 'voltar'
  | 'mais'
  | 'remover'
  | 'arrastar'
  | 'play'
  | 'pausar'
  | 'documento'
  | 'sino'
  | 'sino-cortado'
  | 'calendario'
  | 'musica'
  | 'lampada'
  | 'pessoa'
  | 'casa'
  | 'engrenagem'
  | 'busca'
  | 'limpar'
  | 'seta'
  | 'copiar'
  | 'confirmar'
  | 'atencao'
  | 'whatsapp'
  | 'youtube'
  | 'cifra'
  | 'lista'
  | 'desfazer'
  | 'sol'
  | 'lua'
  | 'sistema'
  | 'coracao'
  | 'sem-conexao'

type Ponto = [number, number]

const RAIOS = ['M12 2v2.5', 'M12 19.5V22', 'M2 12h2.5', 'M19.5 12H22', 'M4.9 4.9l1.8 1.8', 'M17.3 17.3l1.8 1.8', 'M4.9 19.1l1.8-1.8', 'M17.3 6.7l1.8-1.8']

const TRACOS: Record<NomeDoIcone, string[]> = {
  voltar: ['M15 5.5 8.5 12l6.5 6.5'],
  mais: [],
  remover: ['M6 6l12 12', 'M18 6 6 18'],
  arrastar: [],
  play: ['M8 5.2v13.6a.6.6 0 0 0 .9.5l10.4-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5Z'],
  pausar: ['M9.2 5.2v13.6', 'M14.8 5.2v13.6'],
  documento: ['M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3Z', 'M14 3v5h4.5', 'M9 13h6', 'M9 17h6'],
  sino: ['M6 16.5v-5.7a6 6 0 0 1 12 0v5.7l1.6 2.1H4.4L6 16.5Z', 'M10 21a2 2 0 0 0 4 0'],
  'sino-cortado': ['M6 16.5v-5.7a6 6 0 0 1 9.4-4.9', 'M18 12v4.5l1.6 2.1H4.4L6 16.5', 'M10 21a2 2 0 0 0 4 0', 'M4 4l16 16'],
  calendario: ['M4 5.8h16a.9.9 0 0 1 .9.9v13.4a.9.9 0 0 1-.9.9H4a.9.9 0 0 1-.9-.9V6.7a.9.9 0 0 1 .9-.9Z', 'M8 3.1v5', 'M16 3.1v5', 'M3.1 10.7h17.8'],
  musica: ['M9.2 17.4V6.1l10-2.2v11.3'],
  lampada: ['M9.6 18.4h4.8', 'M10.6 21h2.8', 'M12 3.2a6.2 6.2 0 0 0-3.6 11.3c.6.4 1 1.1 1 1.8v.3h5.2v-.3c0-.7.4-1.4 1-1.8A6.2 6.2 0 0 0 12 3.2Z'],
  pessoa: ['M12 4.4a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z', 'M4.6 20.6a7.4 7.4 0 0 1 14.8 0'],
  casa: ['M3 10.6 12 3.2l9 7.4', 'M5.6 9.4V19.8a1.2 1.2 0 0 0 1.2 1.2H10v-5.6h4V21h3.2a1.2 1.2 0 0 0 1.2-1.2V9.4'],
  engrenagem: [engrenagem(), 'M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z'],
  busca: ['M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z', 'M15.3 15.3 20 20'],
  limpar: ['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Z', 'M9.2 9.2l5.6 5.6', 'M14.8 9.2l-5.6 5.6'],
  seta: ['m9 5.5 6.5 6.5L9 18.5'],
  copiar: ['M9.5 9.5h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z', 'M5.5 14.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1'],
  confirmar: ['m5 12.5 4.5 4.5L19 7'],
  atencao: ['M10.7 4.6 2.6 18.4a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.3 4.6a1.5 1.5 0 0 0-2.6 0Z', 'M12 9.5v4.5'],
  whatsapp: ['M4 20.5l1.4-4.2A8.6 8.6 0 1 1 8.6 19L4 20.5Z', 'M9.3 8.7c.3-.7 1-.6 1.3 0l.6 1.3c.1.3 0 .6-.2.8l-.5.6c.6 1.2 1.5 2.1 2.7 2.7l.6-.5c.2-.2.5-.3.8-.2l1.3.6c.6.3.7 1 0 1.3l-.7.5c-.5.3-1.1.4-1.7.2a8.2 8.2 0 0 1-4.9-4.9c-.2-.6-.1-1.2.2-1.7l.5-.7Z'],
  youtube: ['M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5v-7Z', 'M10 9.3v5.4l4.6-2.7L10 9.3Z'],
  cifra: ['M6 5h12', 'M6 10h12', 'M6 15h12', 'M6 20h12', 'M8 5v15', 'M12 5v15', 'M16 5v15'],
  lista: ['M8 6h13', 'M8 12h13', 'M8 18h13'],
  'sem-conexao': ['M3.6 9.4a12.5 12.5 0 0 1 16.8 0', 'M7 13a8 8 0 0 1 10 0', 'M4 4l16 16'],
  desfazer: ['M9 14 4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-4'],
  sol: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z', ...RAIOS],
  lua: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z'],
  sistema: ['M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15V5.5Z', 'M8 21h8', 'M12 16.5V21'],
  coracao: [
    'M12 20.3c-.2 0-.4-.1-.55-.2C9.6 18.6 3.5 13.9 3.5 9.3 3.5 6.4 5.7 4.2 8.5 4.2c1.6 0 3.1.75 4.05 2 .5.65 1.5.65 2 0 .95-1.25 2.45-2 4.05-2 2.8 0 5 2.2 5 5.1 0 4.6-6.1 9.3-8.5 10.8-.15.1-.35.2-.55.2Z',
  ],
}

const PONTOS: Partial<Record<NomeDoIcone, Ponto[]>> = {
  mais: [
    [5, 12],
    [12, 12],
    [19, 12],
  ],
  arrastar: [
    [9, 6],
    [15, 6],
    [9, 12],
    [15, 12],
    [9, 18],
    [15, 18],
  ],
  musica: [
    [6.7, 17.4],
    [16.7, 15.2],
  ],
  atencao: [[12, 17.2]],
  'sem-conexao': [[12, 17.4]],
  cifra: [[12, 7.5]],
  lista: [
    [4, 6],
    [4, 12],
    [4, 18],
  ],
}

const RAIO_DO_PONTO: Partial<Record<NomeDoIcone, number>> = { musica: 2.5, atencao: 0.9, cifra: 1.4 }

function engrenagem(): string {
  const dentes = 8
  const externo = 10
  const interno = 7.6
  const passo = Math.PI / dentes
  const pontos: string[] = []
  for (let i = 0; i < dentes * 2; i++) {
    const raio = i % 2 === 0 ? externo : interno
    for (const desvio of [-0.4, 0.4]) {
      const angulo = i * passo + desvio * passo
      pontos.push(`${(12 + raio * Math.cos(angulo)).toFixed(2)} ${(12 + raio * Math.sin(angulo)).toFixed(2)}`)
    }
  }
  return `M${pontos.join('L')}Z`
}

export function Icone({ nome }: { nome: NomeDoIcone }) {
  const pontos = PONTOS[nome] ?? []
  const raio = RAIO_DO_PONTO[nome] ?? 1.1
  const pontoCheio = nome !== 'musica'

  return (
    <svg
      className="icone"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRACOS[nome].map((d) => (
        <path key={d} d={d} />
      ))}
      {pontos.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={raio} fill={pontoCheio ? 'currentColor' : 'none'} stroke={pontoCheio ? 'none' : undefined} />
      ))}
    </svg>
  )
}
