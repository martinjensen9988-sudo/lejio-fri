# GitHub Actions → Azure Static Web Apps Deployment Setup

## Required GitHub Secret

Du skal sætte dette secret i GitHub før deployment virker:

### 1. Gå til Repository Settings
- https://github.com/martinjensen9988-sudo/lejio-b75cff1f/settings

### 2. Klik "Secrets and variables" > "Actions"

### 3. Klik "New repository secret"

### 4. Tilføj secret med disse detaljer:
- **Name:** `AZURE_STATIC_WEB_APPS_API_TOKEN`
- **Value:** (Hent fra Azure Portal → Lejio-fri Static Web App → Manage deployment token)

Aktuel token (hold privat):
```
43a41d7f029531b6a5c19590be0f0ab3b37015996d9621d5c6d0ddfe7010d71302-bdd2e150-80af-4e7d-bd94-869badafab0e003311904c86dd03
```

## Workflow File
- `.github/workflows/azure-static-web-apps-deploy.yml`

## Deployment Process
1. Push til `main` branch
2. GitHub Actions kører automatisk
3. Frontend bygges med `npm run build` → `dist/`
4. API kopiers til `dist/api/` og `api/` deployes
5. Alt uploades til Azure Static Web Apps

## Fejlfinding

### Deployment fejler?
1. Tjek GitHub Actions logs: https://github.com/martinjensen9988-sudo/lejio-b75cff1f/actions
2. Tjek hvis secret `AZURE_STATIC_WEB_APPS_API_TOKEN` er sat
3. Tjek hvis token er udløbet (skal regenereres i Azure)
4. Se Azure Static Web Apps deployment logs

### API virker ikke?
1. Tjek `/dist/api/Test/` folder findes lokalt efter `npm run build`
2. Tjek Azure Static Web Apps → APIs → Test function
3. Test lokalt: `npm run build && curl http://localhost:5173/api/Test` (efter build)

