# Vue Push Demo (integración con Laravel API)

Proyecto Vue 3 (Vite) mínimo preparado para suscripciones Web Push y para integrarse con un backend Laravel:

## Libreria php
  - `minishlink/web-push ^10.0`.

## Reemplaza
  - `VAPID_PUBLIC_PLACEHOLDER` en PushSubscribe.vue

## Endpoints esperados en Laravel API:
  - `POST /api/save-subscription` -> guarda la suscripción
  - `POST /api/send-notification` -> dispara una notificación

Arrancar:
1. npm install
2. npm run dev

Service worker: `public/sw.js` (sirve desde la raíz). En producción necesitas HTTPS.
