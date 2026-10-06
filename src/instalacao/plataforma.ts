export type Plataforma = 'ios' | 'android' | 'outra'

export type IconeDoPasso = 'compartilhar' | 'adicionar' | 'menu' | 'instalar'

export type Passo = {
  texto: string
  icone?: IconeDoPasso
}

export type Instrucao = {
  aba: string
  titulo: string
  passos: Passo[]
}

export const PLATAFORMAS: readonly Plataforma[] = ['ios', 'android', 'outra']

const INSTRUCOES: Record<Plataforma, Instrucao> = {
  ios: {
    aba: 'iPhone',
    titulo: 'No iPhone ou iPad',
    passos: [
      { texto: 'Abra este link no Safari ou no Chrome.' },
      { texto: 'Toque no botão Compartilhar do navegador (no Safari fica embaixo; no Chrome, no alto):', icone: 'compartilhar' },
      { texto: 'Role a lista e toque em Adicionar à Tela de Início, com este ícone:', icone: 'adicionar' },
      { texto: 'Toque em Adicionar. O Renovo Music vira um ícone na sua tela.' },
      { texto: 'Abra o app pelo ícone. Só assim ele pode notificar você.' },
    ],
  },
  android: {
    aba: 'Android',
    titulo: 'No Android',
    passos: [
      { texto: 'Abra este link no Chrome.' },
      { texto: 'Toque nos três pontinhos do canto:', icone: 'menu' },
      { texto: 'Toque em Instalar app (ou Adicionar à tela inicial).', icone: 'instalar' },
      { texto: 'Confirme. O Renovo Music vira um ícone na sua tela.' },
      { texto: 'Abra o app pelo ícone. Só assim ele pode notificar você.' },
    ],
  },
  outra: {
    aba: 'Computador',
    titulo: 'No computador',
    passos: [
      { texto: 'Dá pra usar o Renovo Music aqui mesmo, pelo navegador.' },
      { texto: 'Pra instalar, procure este ícone na barra de endereço do Chrome ou do Edge:', icone: 'instalar' },
      { texto: 'As notificações são feitas pro celular: instale também no seu telefone.' },
    ],
  },
}

export function plataformaDoAgente(agente: string, temToque: boolean): Plataforma {
  if (/iPhone|iPad|iPod/i.test(agente)) return 'ios'
  if (/Android/i.test(agente)) return 'android'
  if (/Macintosh/i.test(agente) && temToque) return 'ios'
  return 'outra'
}

export function passosDeInstalacao(plataforma: Plataforma): Instrucao {
  return INSTRUCOES[plataforma]
}
