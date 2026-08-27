# JournalPRO

Trading journal profesional — registra, revisa y analiza tus operaciones.

## Stack

- React 19 + Vite
- Firebase / Firestore (misma base de datos del proyecto original — sin migraciones destructivas)
- React Router (Dashboard, Calendar, Journal, Analytics, Settings)
- Tailwind CSS
- Recharts (equity curve)
- date-fns (calendario)

## Desarrollo

```bash
npm install
npm run dev
```

## Estructura

```
src/
  lib/            Firebase + acceso a Firestore
  shared/         Lógica compartida: modelo de trade, métricas, CSV
  context/        Estado global de la app (AppContext)
  components/     UI reutilizable (modales, sidebar, drawer de filtros)
  pages/          Las 5 secciones: Dashboard, Journal, Calendar, Analytics, Settings
```

## Notas

- Los datos existentes de la versión anterior de la app son totalmente compatibles: cualquier operación sin los campos nuevos (entrada, SL, TP, P&L, notas, screenshot) simplemente se muestra sin ese dato.
- Los activos, setups, sesiones y cuentas ahora se configuran desde **Settings** en vez de estar fijos en el código.
