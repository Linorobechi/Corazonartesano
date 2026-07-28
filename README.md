# Corazon Artesano

Aplicacion full-stack con React + Vite (frontend) y Express + MySQL (backend).

## Requisitos

- Node.js 18+
- XAMPP con MySQL activo en el puerto `3306`

## Configuracion para otro PC

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

3. Crea el archivo `.env` en la raiz copiando `.env.example`.
4. Verifica que tenga estos valores por defecto para XAMPP:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=corazon_artesano
JWT_SECRET=corazon-artesano-secret
PORT=3001
```

## Ejecutar

Frontend + backend al mismo tiempo:

```bash
npm run dev:full
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Notas

- El backend crea automaticamente la base de datos y tablas si no existen.
- Las imagenes subidas por usuarios se guardan en `server/uploads/`.
- `.env` no se sube al repositorio; solo `.env.example`.
