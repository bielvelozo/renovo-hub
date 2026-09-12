import { describe, expect, it } from 'vitest'
import { limparTitulo } from './titulo'

const CASOS: { nome: string; titulo: string; canal: string; limpo: { titulo: string; artista: string } }[] = [
  {
    nome: 'reconhece o canal dentro de uma parte maior e a usa como artista',
    titulo: 'GABRIELA ROCHA FEAT. ELEVATION WORSHIP - VIDA AOS SEPULCROS (CLIPE OFICIAL)',
    canal: 'Gabriela Rocha',
    limpo: { titulo: 'VIDA AOS SEPULCROS', artista: 'GABRIELA ROCHA FEAT. ELEVATION WORSHIP' },
  },
  {
    nome: 'trata «@handle», «convida» e «Ministério» como marca de artista',
    titulo: 'Paulo Cesar Baruk, @MarsenaOficial - Clamo Jesus (I Speak Jesus)',
    canal: 'Baruk TV e mais 3',
    limpo: { titulo: 'Clamo Jesus (I Speak Jesus)', artista: 'Paulo Cesar Baruk, @MarsenaOficial' },
  },
  {
    nome: 'põe o Ministério como artista mesmo quando vem antes do hífen',
    titulo: 'Ministério Pedras Vivas - Pai nosso (Our father)',
    canal: 'Pedras Vivas',
    limpo: { titulo: 'Pai nosso (Our father)', artista: 'Ministério Pedras Vivas' },
  },
  {
    nome: 'tira legendas, DVD e um parêntese que ficou aberto',
    titulo: 'Irmão Lázaro - Eu Te Amo Tanto (DVD Eu Te Amo Tanto',
    canal: 'Irmão Lázaro',
    limpo: { titulo: 'Eu Te Amo Tanto', artista: 'Irmão Lázaro' },
  },
  {
    nome: 'não descarta um pedaço com hífen só porque menciona o canal',
    titulo: 'Ser Mudado (Lyric) - Alessandro Vilas Boas // O Fogo Nunca Dorme (EP)',
    canal: 'Alessandro Vilas Boas',
    limpo: { titulo: 'Ser Mudado', artista: 'Alessandro Vilas Boas' },
  },
  {
    nome: 'com três partes, ignora a que é descrição de gravação',
    titulo: 'Lugar da Habitação - Os Bravos feat. Alessandro Vilas Boas - Ao Vivo na Conferência JesusCopy 2024',
    canal: 'JesusCopy Music',
    limpo: { titulo: 'Lugar da Habitação', artista: 'Os Bravos feat. Alessandro Vilas Boas' },
  },
  {
    nome: 'descarta o pedaço que é só «Ministração Ao Vivo»',
    titulo: 'Felipe Rodrigues - Oh Quão Lindo Esse Nome é | Ministração Ao Vivo',
    canal: 'Felipe Rodrigues',
    limpo: { titulo: 'Oh Quão Lindo Esse Nome é', artista: 'Felipe Rodrigues' },
  },
  {
    nome: 'corta no separador de canal e separa artista pelo hífen',
    titulo: '1 Coríntios 15 (Esse Corpo É Uma Semente) - Eric & Evellyn Emerick | TELOS (Ao Vivo)',
    canal: 'TELOS',
    limpo: { titulo: '1 Coríntios 15 (Esse Corpo É Uma Semente)', artista: 'Eric & Evellyn Emerick' },
  },
  {
    nome: 'tira o parêntese de clipe oficial e usa o canal como artista',
    titulo: 'Algo Bem Maior (Clipe Oficial) • DROPS',
    canal: 'DROPS',
    limpo: { titulo: 'Algo Bem Maior', artista: 'DROPS' },
  },
  {
    nome: 'ignora um pedaço que é só «ao vivo» depois do hífen',
    titulo: 'Grato Sou (I Thank God) - Ao vivo • DROPS',
    canal: 'DROPS',
    limpo: { titulo: 'Grato Sou (I Thank God)', artista: 'DROPS' },
  },
  {
    nome: 'reconhece o canal na segunda metade e tira o sufixo «music» dele também',
    titulo: 'Fez Um Caminho (Ao Vivo) - IIR Music',
    canal: 'IIR Music',
    limpo: { titulo: 'Fez Um Caminho', artista: 'IIR' },
  },
  {
    nome: 'remove o sufixo «music» do canal quando não há separador',
    titulo: 'Meia Noite (Ao Vivo) | fhop music',
    canal: 'fhop music',
    limpo: { titulo: 'Meia Noite', artista: 'fhop' },
  },
  {
    nome: 'reconhece o canal na primeira metade e inverte',
    titulo: 'Gateway Worship Português - Deus Cuida de Mim',
    canal: 'Gateway Worship Português',
    limpo: { titulo: 'Deus Cuida de Mim', artista: 'Gateway Worship Português' },
  },
  {
    nome: 'compara com o canal sem distinguir maiúsculas e acentos',
    titulo: 'Oceanos - Ministério Zoe',
    canal: 'ministerio zoe oficial',
    limpo: { titulo: 'Oceanos', artista: 'Ministério Zoe' },
  },
  {
    nome: 'remove colchetes de lyric e áudio',
    titulo: 'Lugar Secreto [Lyric Video] (Áudio Oficial)',
    canal: 'Gabriela Rocha',
    limpo: { titulo: 'Lugar Secreto', artista: 'Gabriela Rocha' },
  },
  {
    nome: 'usa o travessão como separador',
    titulo: 'Bondade de Deus – Isaias Saad (Playback)',
    canal: 'Isaias Saad',
    limpo: { titulo: 'Bondade de Deus', artista: 'Isaias Saad' },
  },
  {
    nome: 'apara pontuação solta nas pontas',
    titulo: 'Teu Amor Não Falha - (Ao Vivo) - ',
    canal: 'Nívea Soares Oficial',
    limpo: { titulo: 'Teu Amor Não Falha', artista: 'Nívea Soares' },
  },
  {
    nome: 'mantém parênteses que fazem parte do nome',
    titulo: 'Grande É o Senhor (Great Is the Lord)',
    canal: 'Adhemar de Campos',
    limpo: { titulo: 'Grande É o Senhor (Great Is the Lord)', artista: 'Adhemar de Campos' },
  },
  {
    nome: 'tira o sufixo do artista mesmo quando ele não coincide com o canal',
    titulo: 'Rei do Meu Coração - Ana Paula Valadão Music',
    canal: 'Diante do Trono',
    limpo: { titulo: 'Rei do Meu Coração', artista: 'Ana Paula Valadão' },
  },
  {
    nome: 'acha a música quando o canal vem antes do corte',
    titulo: 'fhop music | BONDADE DE DEUS (Ao vivo)',
    canal: 'Fhop Music',
    limpo: { titulo: 'BONDADE DE DEUS', artista: 'Fhop' },
  },
  {
    nome: 'pula o pedaço que só menciona o canal junto com outro nome',
    titulo: 'fhop music, Marco Telles | COLOSSENSES E SUAS LINHAS DE AMOR (Ao Vivo)',
    canal: 'Fhop Music',
    limpo: { titulo: 'COLOSSENSES E SUAS LINHAS DE AMOR', artista: 'Fhop' },
  },
  {
    nome: 'com dois hífens, o canal vira artista e o resto depois da música é descartado',
    titulo: 'Felipe Rodrigues - Aclame Ao Senhor - Ministração ao vivo',
    canal: 'Felipe Rodrigues',
    limpo: { titulo: 'Aclame Ao Senhor', artista: 'Felipe Rodrigues' },
  },
  {
    nome: 'tira colchetes e parênteses de «oficial» sozinho, mas mantém os que nomeiam o evento',
    titulo: 'Me ama (OVERMISSION 2025) [Oficial]',
    canal: 'Overmission',
    limpo: { titulo: 'Me ama (OVERMISSION 2025)', artista: 'Overmission' },
  },
  {
    nome: 'um pedaço que é só ruído não vira título, mesmo quando é o único sem o canal',
    titulo: 'MARAVILHADO - NÍVEA SOARES | AO VIVO',
    canal: 'Nívea Soares',
    limpo: { titulo: 'MARAVILHADO', artista: 'NÍVEA SOARES' },
  },
  {
    nome: 'devolve o título inteiro quando não há nada pra limpar',
    titulo: 'Aleluia',
    canal: 'Coral',
    limpo: { titulo: 'Aleluia', artista: 'Coral' },
  },
]

describe('limparTitulo', () => {
  for (const caso of CASOS) {
    it(caso.nome, () => {
      expect(limparTitulo(caso.titulo, caso.canal)).toEqual(caso.limpo)
    })
  }

  it('nunca devolve título vazio: cai no título cru sem ruído, e por último no canal', () => {
    expect(limparTitulo('(Ao Vivo) | Nívea Soares', 'Nívea Soares')).toEqual({ titulo: 'Nívea Soares', artista: 'Nívea Soares' })
    expect(limparTitulo('Nívea Soares - (Ao Vivo)', 'Nívea Soares')).toEqual({ titulo: 'Nívea Soares', artista: 'Nívea Soares' })
    expect(limparTitulo('(Ao Vivo)', 'Canal')).toEqual({ titulo: 'Canal', artista: 'Canal' })
    for (const caso of CASOS) expect(limparTitulo(caso.titulo, caso.canal).titulo).not.toBe('')
  })

  it('aplicar sobre o próprio resultado não muda nada', () => {
    for (const caso of CASOS) {
      const limpo = limparTitulo(caso.titulo, caso.canal)
      expect(limparTitulo(limpo.titulo, limpo.artista)).toEqual(limpo)
    }
  })
})
