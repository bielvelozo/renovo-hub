export type Plataforma = 'ios' | 'android' | 'outra'

export type Instrucao = {
  aba: string
  titulo: string
  passos: string[]
}

export const PLATAFORMAS: readonly Plataforma[] = ['ios', 'android', 'outra']

const INSTRUCOES: Record<Plataforma, Instrucao> = {
  ios: {
    aba: 'iPhone',
    titulo: 'No iPhone ou iPad',
    passos: [
      'Abra este link no Safari (não funciona no Chrome do iPhone).',
      'Toque no botão Compartilhar, o quadrado com a seta pra cima.',
      'Role a lista e toque em Adicionar à Tela de Início.',
      'Toque em Adicionar. O Renovo Hub vira um ícone na sua tela.',
      'Abra o app pelo ícone. Só assim ele pode notificar você.',
    ],
  },
  android: {
    aba: 'Android',
    titulo: 'No Android',
    passos: [
      'Abra este link no Chrome.',
      'Toque nos três pontinhos do canto.',
      'Toque em Instalar app (ou Adicionar à tela inicial).',
      'Confirme. O Renovo Hub vira um ícone na sua tela.',
      'Abra o app pelo ícone. Só assim ele pode notificar você.',
    ],
  },
  outra: {
    aba: 'Computador',
    titulo: 'No computador',
    passos: [
      'Dá pra usar o Renovo Hub aqui mesmo, pelo navegador.',
      'Pra instalar, procure o ícone de instalar na barra de endereço do Chrome ou do Edge.',
      'As notificações são feitas pro celular: instale também no seu telefone.',
    ],
  },
}

// O iPad recente se apresenta como Mac; a tela sensível ao toque é o que o separa de um desktop.
export function plataformaDoAgente(agente: string, temToque: boolean): Plataforma {
  if (/iPhone|iPad|iPod/i.test(agente)) return 'ios'
  if (/Android/i.test(agente)) return 'android'
  if (/Macintosh/i.test(agente) && temToque) return 'ios'
  return 'outra'
}

export function passosDeInstalacao(plataforma: Plataforma): Instrucao {
  return INSTRUCOES[plataforma]
}
