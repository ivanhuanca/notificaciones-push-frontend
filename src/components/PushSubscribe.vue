<template>
    <div class="push-box">
        <button @click="registerAndSubscribe" :disabled="loading || subscribed">
            {{ subscribed ? 'Subscribed' : 'Subscribe to Push' }}
        </button>

        <button @click="sendTestNotification" :disabled="!subscribed || loading">
            Send test (via API)
        </button>

        <p v-if="error" class="error">{{ error }}</p>
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
            vapidPublicKey: VAPID_PUBLIC_PLACEHOLDER
        }
    },
    methods: {
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
                if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                    throw new Error('Push not supported in this browser.')
                }

                // opcional: leer VAPID desde backend
                // const { data } = await axios.get('/api/vapid-public')
                // this.vapidPublicKey = data.publicKey

                const reg = await navigator.serviceWorker.register('/sw.js')
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                })

                // enviar la suscripción al backend (Laravel API) — token en header Authorization
                const user = localStorage.getItem('user')
                if (!user) {
                    throw new Error('Authentication required. Please log in first.')
                }
                const { token } = JSON.parse(user)

                // enviamos solo la suscripción en el body y el token en el header Authorization
                await axios.post(`${API}/push/subscribe`, sub, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })

                this.subscribed = true
            } catch (err) {
                this.error = err.response?.data?.message || err.message || String(err)
            } finally {
                this.loading = false
            }
        },

        async sendTestNotification() {
            try {
                const user = localStorage.getItem('user')
                if (!user) {
                    throw new Error('Authentication required. Please log in first.')
                }
                const { token } = JSON.parse(user)

                await axios.post(`${API}/push/send`,
                    {
                        title: 'Test desde Vue',
                        body: 'Este es un mensaje de prueba'
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

button {
    padding: .5rem 1rem
}

.error {
    color: crimson
}
</style>
