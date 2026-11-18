# Ledger — Personal Finance

A personal finance app built with Next.js, a Node.js API layer, and MongoDB. Expenses, KhataBook records, groups, and shared expenses are stored in MongoDB. The browser stores only display preferences and any legacy records awaiting the first successful server migration.

## Project structure

- `app/` — Next.js routes, global styles, and the page-level application composition.
- `app/api/` — server routes for authentication, health checks, and MongoDB-backed data.
- `components/layout/` — app sidebar and top navigation bar (including data refresh and authenticated logout).
- `components/screens/` — Overview, Transactions, KhataBook, Groups, Reports, and Settings screens.
- `components/forms/` — transaction and KhataBook entry dialogs.
- `components/shared/` — reusable headings, rows, and list UI.
- `hooks/` — client-side data loading, legacy migration, and persistence orchestration.
- `lib/` — shared types, formatting, categories, settlement calculations, auth, and database connection.

## MongoDB setup

The app uses the official MongoDB Node.js driver. MongoDB Atlas currently offers a free cluster for small projects, with usage and storage limits; free clusters can pause after inactivity. See the official [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/) and [Node.js driver documentation](https://www.mongodb.com/docs/drivers/node/current/).

1. Create a MongoDB Atlas account and a free cluster.
2. Create a database user and allow your development machine's IP in Atlas Network Access.
3. Copy `.env.example` to `.env.local`.
4. Replace the placeholder in `MONGODB_URI` with the URI from Atlas. URL-encode special characters in the database username or password.
5. Set `MONGODB_DB` if you want a different database name.
6. Set a private `APP_PASSWORD` and random `SESSION_SECRET`. You can generate a secret with `openssl rand -base64 32`.
7. Restart the app with `npm run dev`.

Do not commit `.env.local` or share the connection URI. Production mode requires the app password; it is checked on the server and grants an HTTP-only signed session cookie. Local development does not require sign-in unless you configure `APP_PASSWORD`. Keep the app behind HTTPS if you deploy it.

## Run locally

Use Node.js 20.9 or newer. Run `npm install` and `npm run dev`, then open `http://localhost:3000`. The top bar and Settings page show the MongoDB connection status. The development and production build scripts use the Webpack builder for consistent builds in environments where Turbopack file watching is unavailable.

If the previous browser-storage version has data, the app imports it into MongoDB the first time the connection succeeds. After that, application records are read from and written to the server. Dark mode is the only preference kept in browser storage.

## Styling

The project uses Tailwind CSS 4 through its PostCSS plugin. Design tokens are defined in `app/globals.css` and can be used as Tailwind utilities (for example, `font-display`, `text-ink`, and `bg-ledger`). Tailwind utilities are applied to the app shell and page layout; remaining component-specific styles are in the global stylesheet.


## Checks

- `npm run lint` runs the Biome correctness checks on TypeScript and TSX source.
- `npm run test` runs the unit tests for group settlements and session authentication.
- `npx tsc --noEmit --incremental false` performs a standalone TypeScript check.
- `npm run build` builds the production app.
- `npm audit` checks the complete dependency tree.

## API

- `GET /api/health` checks the database connection.
- `GET /api/data?collection=transactions|khata|groups|groupExpenses` reads records.
- `PUT /api/data?collection=...` saves a collection snapshot.
- Production data endpoints require a signed session.
