# A.S Air Conditioning — design preview

See [the Arabic project guide](README.ar.md) for the full handoff, sample data notes and next steps.

```sh
npm run dev
```

Open http://127.0.0.1:5173/. Hebrew is the default language; Arabic and English are available from the header. The admin dashboard is at `/admin` and can manage products, prices, images and business contact details. Payments, Zap, order management and external integrations remain deferred. A self-contained Node.js deployment build is available for Israeli hosts that support persistent Node apps; see [DEPLOY-ISRAEL.md](DEPLOY-ISRAEL.md).

```sh
npm run typecheck
npm run build # creates dist/standalone for Node.js hosting
npm run test:design # requires the local preview to be running
```

Run the production Node.js package locally with `npm start` (or `npm run start:node`). The host should use Node.js 22.13 or newer and pass its assigned `PORT` to the app.

Render deployment uses the multi-stage `Dockerfile` and `render.yaml`. See [the Render and Docker guide](RENDER-DEPLOY.ar.md). Supabase and admin credentials are runtime environment variables; the container requires Supabase storage and does not include local data or `.env` files.

`qa/report.json` records responsive browser checks and interaction checks. Screenshot files are saved in `qa/`. No request or payment is sent by the checks.
