<template>
    <div class="list-login">
        <h2>Selecciona un usuario para iniciar sesión</h2>
        <ul>
            <li v-for="user in users" :key="user.id">
                <span>{{ user.name }} ({{ user.email }})</span>
                <button @click="loginAs(user)" :disabled="loading">
                    Iniciar sesión
                </button>
            </li>
        </ul>
        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const emit = defineEmits(['authenticated'])
const users = ref([])
const loading = ref(false)
const error = ref('')
const API = import.meta.env.VITE_API_ENDPOINT || ''

async function fetchUsers() {
    loading.value = true
    error.value = ''
    try {
        const url = `${API.replace(/\/$/, '')}/users` // endpoint debe devolver lista de usuarios
        const res = await fetch(url)
        const data = await res.json()
        if (!Array.isArray(data)) throw new Error('Respuesta inesperada de la API')
        users.value = data
    } catch (err) {
        error.value = err?.message || 'Error al obtener usuarios'
    } finally {
        loading.value = false
    }
}

async function loginAs(user) {
    loading.value = true
    error.value = ''
    try {
        // Demo: login directo con el email del usuario y una contraseña dummy
        const url = `${API.replace(/\/$/, '')}/login`
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password || '~@L2@b~~apkrJbJ@buuRx.B' })
        })
        const data = await res.json()
        if (!data.success) throw new Error(data?.message || 'Error al autenticar')
        const token = data.token || ''
        if (!token) throw new Error('Token de autenticación no recibido')
        localStorage.setItem('user', JSON.stringify({ ...data.user, token }))
        emit('authenticated', { ...data.user, token })
    } catch (err) {
        error.value = err?.message || 'Error al iniciar sesión'
    } finally {
        loading.value = false
    }
}

onMounted(fetchUsers)
</script>

<style scoped>
.list-login {
    max-width: 680px;
    margin: 2rem auto;
    padding: 1.25rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.list-login h2 {
    margin-bottom: 1rem;
}

.list-login ul {
    list-style: none;
    padding: 0;
}

.list-login li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.list-login button {
    padding: 0.4rem 1rem;
    border-radius: 6px;
    border: none;
    background: #646cff;
    color: white;
    cursor: pointer;
}

.list-login button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.error {
    color: #ff6b6b;
    font-size: 0.9rem;
    margin-top: 1rem;
}
</style>
