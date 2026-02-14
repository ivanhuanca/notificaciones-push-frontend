<script setup>
import { ref, computed } from 'vue'
const emit = defineEmits(['authenticated'])

const email = ref('test@example.com')
const password = ref('~@L2@b~~apkrJbJ@buuRx.B')
const loading = ref(false)
const error = ref('')
// lee el endpoint desde .env (VITE_*)
const API = import.meta.env.VITE_API_ENDPOINT || ''

const isValid = computed(() => {
    return email.value.trim() !== '' && password.value.length >= 4
})

async function submit(e) {
    e.preventDefault()
    error.value = ''
    if (!isValid.value) {
        error.value = 'Introduce un email y una contraseña (mín. 4 caracteres)'
        return
    }
    if (!API) {
        error.value = 'API endpoint no configurado (VITE_API_ENDPOINT)'
        return
    }

    loading.value = true
    try {
        const url = `${API.replace(/\/$/, '')}/login`
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value, password: password.value })
        })
        const data = await res.json().catch(() => ({}))

        if (!data.success) {
            error.value = data?.message || `Error ${res.status} al autenticar`;
            loading.value = false
            return
        }

        const user = {
            email: email.value,
            token: data.token
        }
        // guardar user en localStorage para mantener sesión
        localStorage.setItem('user', JSON.stringify(user))

        emit('authenticated', user)
    } catch (err) {
        error.value = err?.message || 'Error de red al conectar con la API'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <form class="login" @submit="submit">
        <h2>Iniciar sesión</h2>

        <label>
            <span>Email</span>
            <input v-model="email" type="email" placeholder="tu@ejemplo.com" required />
        </label>

        <label>
            <span>Contraseña</span>
            <input v-model="password" type="password" placeholder="••••••" required minlength="4" />
        </label>

        <p class="error" v-if="error">{{ error }}</p>

        <button type="submit" :disabled="!isValid || loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>

        <p class="hint">(Módulo demo — reemplaza la lógica por tu API)</p>
    </form>
</template>

<style scoped>
.login {
    max-width: 360px;
    margin: 2rem auto;
    padding: 1.25rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.login h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem
}

.login label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.9rem
}

.login input {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: transparent
}

.login button {
    padding: 0.6rem;
    border-radius: 6px;
    border: none;
    background: #646cff;
    color: white;
    cursor: pointer
}

.login button:disabled {
    opacity: 0.5;
    cursor: not-allowed
}

.login .error {
    color: #ff6b6b;
    font-size: 0.9rem
}

.login .hint {
    color: #888;
    font-size: 0.8rem;
    margin-top: 0.25rem
}
</style>