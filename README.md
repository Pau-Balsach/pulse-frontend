# Pulse — Frontend

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8) ![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

**Web:** https://pulse-frontend-chi-three.vercel.app  
**Backend:** https://github.com/Pau-Balsach/pulse-backend

---

## ¿Qué es Pulse?

Pulse es una plataforma de observabilidad SaaS similar a UptimeRobot o BetterStack. Permite monitorizar servicios web en tiempo real, detectar caídas automáticamente, revisar el historial de incidencias y consultar el estado de todos los servicios desde una página pública sin necesidad de autenticación.

Este repositorio contiene el **frontend**, encargado de:

- Autenticar al usuario y gestionar la sesión con JWT
- Mostrar un dashboard en tiempo real con el estado de todos los servicios
- Actualizar automáticamente los datos mediante WebSockets sin recargar la página
- Mostrar páginas de detalle por servicio con gráfica de latencia, heatmap de checks e historial de incidencias
- Exponer una página de estado pública y compartible por proyecto

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework frontend |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos |
| Recharts | Gráfica de latencia |
| STOMP over SockJS | WebSockets en tiempo real |
| Axios | Cliente HTTP con interceptor JWT |
| Docker | Containerización |

---

## Páginas

| Ruta | Auth | Descripción |
|---|---|---|
| `/login` | No | Inicio de sesión |
| `/dashboard` | Sí | Dashboard principal con todos los servicios |
| `/dashboard/[serviceId]` | Sí | Detalle del servicio: gráfica, heatmap e incidencias |
| `/status/[projectId]` | No | Página de estado pública y compartible |

---

## Estructura del código

```
app/
├── dashboard/
│   ├── page.tsx               # Dashboard principal con WebSocket
│   └── [serviceId]/
│       └── page.tsx           # Detalle del servicio
├── login/
│   └── page.tsx               # Login con JWT
├── status/
│   └── [projectId]/
│       └── page.tsx           # Página de estado pública
└── lib/
    └── api.ts                 # Instancia Axios con interceptor JWT
```

---

## Configuración

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env.local
```

### .env.example

```env
# URL del backend (sin barra final)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## Ejecución local

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

### Con Docker (junto al backend)

Desde la raíz del repositorio del backend (donde está el `docker-compose.yml`):

```bash
docker-compose up --build
```

---

## Backend

El repositorio del backend está disponible en [pulse-backend](https://github.com/Pau-Balsach/pulse-backend).