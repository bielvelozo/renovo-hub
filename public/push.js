self.addEventListener('push', (evento) => {
  const dados = lerDados(evento)

  evento.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      icon: '/icone-192.png',
      badge: '/icone-192.png',
      lang: 'pt-BR',
      tag: dados.tag,
      data: { url: dados.navigate },
    }),
  )
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const alvo = new URL(evento.notification.data?.url || '/', self.location.origin)

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (new URL(janela.url).origin === alvo.origin && 'focus' in janela) {
          janela.navigate?.(alvo.href)
          return janela.focus()
        }
      }

      return self.clients.openWindow(alvo.href)
    }),
  )
})

// A Apple exige notificação visível em todo push: sem carga legível, mostra o genérico.
function lerDados(evento) {
  const padrao = { title: 'Renovo Hub', body: 'Toque pra ver o que mudou.', navigate: '/' }

  try {
    const carga = evento.data && evento.data.json()
    return Object.assign(padrao, carga && carga.notification)
  } catch {
    return padrao
  }
}
