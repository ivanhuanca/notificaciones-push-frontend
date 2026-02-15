<template>
    <div class="push-box">
        <button @click="registerAndSubscribe" :disabled="loading || subscribed">
            {{ subscribed ? 'Suscribido' : 'Suscribirse a Push' }}
        </button>

        <button @click="sendTestNotification" :disabled="!subscribed || loading">
            Enviar prueba (vía API)
        </button>


        <!-- <ul v-if="notifications.length">
            <li v-for="(notif, i) in notifications" :key="i">
                {{ notif.title }} - {{ notif.body }}
            </li>
        </ul> -->

        <p v-if="error" class="error">{{ error }}</p>
    </div>

    <div class="log-box">
        <h4>Logs y avisos</h4>
        <ul>
            <li v-for="(log, idx) in logs" :key="idx" :class="log.type">
                <span v-if="log.type === 'error'">[Error]</span>
                <span v-else-if="log.type === 'warn'">[Aviso]</span>
                <span v-else>[Info]</span>
                {{ log.message }}
            </li>
        </ul>
    </div>
</template>

<script>
import axios from 'axios'

const VAPID_PUBLIC_PLACEHOLDER = 'BCSKGXlbLtaElFmSo9xwMj1BH0EIkfDd5BbMJ2FN5sULiB5fuUDy8ionHqs-8ehu9Oc2oKS013sfKaCix8djPnM'
const API = import.meta.env.VITE_API_ENDPOINT || ''

export default {
    name: 'PushSubscribe',
    data() {
        return {
            loading: false,
            subscribed: false,
            error: null,
            vapidPublicKey: VAPID_PUBLIC_PLACEHOLDER,
            notifications: [
                { title: 'Nueva venta realizada', body: 'Se ha registrado una nueva venta en tu tienda.', data: { url: '/ventas/123' } },
                { title: 'Pago recibido', body: 'Has recibido un pago de $250.00 por una orden.', data: { url: '/pagos' } },
                { title: 'Retiro procesado', body: 'Tu solicitud de retiro ha sido procesada exitosamente.', data: { url: '/retiros' } },
                { title: 'Cancelación de pedido', body: 'Un cliente ha cancelado su pedido #1023.', data: { url: '/pedidos/1023' } },
                { title: 'Venta grande', body: '¡Felicidades! Has vendido 10 artículos en una sola orden.', data: { url: '/ventas' } },
                { title: 'Pago pendiente', body: 'Tienes un pago pendiente de $120.00.', data: { url: '/pagos/pendientes' } },
                { title: 'Retiro fallido', body: 'No se pudo procesar tu retiro. Verifica tus datos bancarios.', data: { url: '/retiros/error' } },
                { title: 'Pedido enviado', body: 'El pedido #1045 ha sido enviado al cliente.', data: { url: '/pedidos/1045' } },
                { title: 'Devolución solicitada', body: 'Un cliente ha solicitado la devolución de un producto.', data: { url: '/devoluciones' } },
                { title: 'Pago completado', body: 'El pago de la orden #1050 ha sido completado.', data: { url: '/pagos/1050' } }
            ],
            autoSending: false,
            autoInterval: null,
            currentNotifIndex: 0,
            logs: []
        }
    },
    methods: {
        startAutoNotifications() {
            if (this.autoSending || !this.subscribed) return
            this.autoSending = true
            this.currentNotifIndex = 0
            const sendNext = () => {
                if (!this.autoSending) return
                if (this.currentNotifIndex >= this.notifications.length) {
                    this.addLog('Envío automático finalizado.', 'info')
                    this.stopAutoNotifications()
                    return
                }
                this.sendNotificationFromList(this.notifications[this.currentNotifIndex])
                this.currentNotifIndex++
                // Intervalo aleatorio entre 10 y 20 segundos
                const nextDelay = 10000 + Math.floor(Math.random() * 10000)
                this.autoInterval = setTimeout(sendNext, nextDelay)
            }
            sendNext()
        },
        stopAutoNotifications() {
            this.autoSending = false
            if (this.autoInterval) {
                clearTimeout(this.autoInterval)
                this.autoInterval = null
            }
        },
        async sendNotificationFromList(notif) {
            try {
                this.addLog(`Enviando notificación: ${notif.title}`, 'info')
                const user = localStorage.getItem('user')
                if (!user) {
                    this.addLog('Se requiere autenticación. Por favor, inicia sesión primero.', 'error')
                    throw new Error('Se requiere autenticación. Por favor, inicia sesión primero.')
                }
                const { token } = JSON.parse(user)
                const id = JSON.parse(user)?.id
                await axios.post(`${API}/push/send/${id}`,
                    {
                        title: notif.title,
                        body: notif.body
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    })
            } catch (err) {
                this.error = err.response?.data?.message || err.message || String(err)
                this.addLog(this.error, 'error')
                this.stopAutoNotifications()
            }
        },
        addLog(message, type = 'info') {
            this.logs.push({ message, type })
            if (this.logs.length > 50) this.logs.shift()
        },
        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4)
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i)
            }
            return outputArray
        },

        async registerAndSubscribe() {
            this.loading = true
            this.error = null
            try {
                this.addLog('Intentando suscribirse a notificaciones...', 'info')
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    this.addLog('Push no soportado en este navegador.', 'error')
                    throw new Error('Push not supported in this browser.')
                }

                // Registrar el Service Worker
                const reg = await navigator.serviceWorker.register('/sw.js')
                this.addLog('Service Worker registrado.', 'info')

                // Esperar a que el Service Worker esté activo
                let swRegistration = null
                if (reg.active) {
                    swRegistration = reg
                } else {
                    swRegistration = await new Promise((resolve, reject) => {
                        if (reg.installing) {
                            reg.installing.addEventListener('statechange', function handler(e) {
                                if (e.target.state === 'activated') {
                                    resolve(reg)
                                }
                            })
                        } else if (reg.waiting) {
                            reg.waiting.addEventListener('statechange', function handler(e) {
                                if (e.target.state === 'activated') {
                                    resolve(reg)
                                }
                            })
                        } else {
                            // fallback: esperar a que esté activo
                            navigator.serviceWorker.ready.then(resolve).catch(reject)
                        }
                    })
                }

                // Ahora sí, suscribirse a PushManager
                const sub = await swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                })

                // enviar la suscripción al backend (Laravel API) — token en header Authorization
                const user = localStorage.getItem('user')
                if (!user) {
                    this.addLog('Se requiere autenticación. Por favor, inicia sesión primero.', 'error')
                    throw new Error('Se requiere autenticación. Por favor, inicia sesión primero.')
                }

                const id = JSON.parse(user)?.id
                const { token } = JSON.parse(user)

                // añadir id del usuario a la suscripción para asociarla en el backend
                const subWithUser = { ...sub.toJSON(), user_id: id }

                // enviamos solo la suscripción en el body y el token en el header Authorization
                await axios.post(`${API}/push/subscribe`, subWithUser, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })

                this.subscribed = true
                this.addLog('Suscripción exitosa. Iniciando envío automático de notificaciones.', 'info')
                // Iniciar envío automático de notificaciones al suscribirse
                this.startAutoNotifications()
            } catch (err) {
                this.error = err.response?.data?.message || err.message || String(err)
                this.addLog(this.error, 'error')
            } finally {
                this.loading = false
            }
        },

        async sendTestNotification() {
            try {
                this.addLog('Enviando notificación de prueba...', 'info')
                const user = localStorage.getItem('user')
                if (!user) {
                    this.addLog('Se requiere autenticación. Por favor, inicia sesión primero.', 'error')
                    throw new Error('Se requiere autenticación. Por favor, inicia sesión primero.')
                }
                const { token } = JSON.parse(user)
                const id = JSON.parse(user)?.id

                await axios.post(`${API}/push/send/${id}`,
                    {
                        title: 'Test al usuario',
                        body: 'El usuario: ' + JSON.parse(user)?.email + ' ha solicitado una notificación de prueba.',
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    })
                // window.alert('Notificación solicitada al backend')
            } catch (err) {
                this.error = err.response?.data?.message || err.message || String(err)
                this.addLog(this.error, 'error')
            }
        }
    }
}
</script>

<style scoped>
.push-box {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    max-width: 360px
}

.log-box {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: #222;
    color: #fff;
    max-height: 180px;
    overflow-y: auto;
    font-size: 0.95rem;
    padding: 0.5rem 1rem 1rem 1rem;
    z-index: 100;
    border-top: 2px solid #646cff;
}

.log-box h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.05rem;
    color: #aaf;
}

.log-box ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.log-box li {
    margin-bottom: 0.2rem;
}

.log-box li.error {
    color: #ff6b6b;
}

.log-box li.warn {
    color: #ffd166;
}

.log-box li.info {
    color: #aaf;
}

button {
    padding: .5rem 1rem
}

.error {
    color: crimson
}
</style>
