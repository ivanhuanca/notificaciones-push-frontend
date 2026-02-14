self.addEventListener('push', event => {
    let payload = { title: 'Notificación', body: 'Contenido', icon: '/favicon.ico' }
    try {
        if (event.data) payload = event.data.json()
    } catch (e) { /* ignore malformed payload */ }

    const options = {
        body: payload.body,
        icon: payload.icon,
        data: payload.data || {}
    }
    event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', event => {
    event.notification.close()
    event.waitUntil(clients.matchAll({ type: 'window' }).then(clientsArr => {
        if (clientsArr.length > 0) return clientsArr[0].focus()
        return clients.openWindow('/')
    }))
})
