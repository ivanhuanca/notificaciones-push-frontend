<script setup>

import { ref } from 'vue'
import PushSubscribe from './components/PushSubscribe.vue'
import ListLogin from './components/ListLogin.vue'

const user = ref(null)
// cargar user desde localStorage (si existe)
try { user.value = JSON.parse(localStorage.getItem('user')) } catch (e) { user.value = null }

function onAuthenticated(u) {
  user.value = u || JSON.parse(localStorage.getItem('user'))
}
function logout() {
  localStorage.removeItem('user')
  user.value = null
}
</script>

<template>
  <div>

    <template v-if="!user">
      <ListLogin @authenticated="onAuthenticated" />
    </template>

    <template v-else>
      <header style="display:flex;justify-content:flex-end;padding:1rem">
        <div style="display:flex;gap:0.5rem;align-items:center">
          <small style="color:#666">Conectado como <strong>{{ user.email }}</strong></small>
          <button @click="logout"
            style="padding:0.35rem 0.6rem;border-radius:6px;border:1px solid #e6e6e6;cursor:pointer">Cerrar
            sesión</button>
        </div>
      </header>

      <main style="padding:1rem">
        <PushSubscribe />
      </main>
    </template>
  </div>
</template>

<style scoped>
/* estilos existentes conservados */
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
