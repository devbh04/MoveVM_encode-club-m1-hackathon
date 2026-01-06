# Environment Configuration

This project supports both local and production backend environments.

## Configuration

The environment is configured in the `.env` file:

```env
# Backend API URLs
# Change to 'production' or 'local'
VITE_ENVIRONMENT = "production"

VITE_API_URL_LOCAL = "http://localhost:3000"
VITE_API_URL_PRODUCTION = "https://move-vm-backend.vercel.app"
```

## Switching Between Environments

### Use Local Backend (localhost:3000)
Set `VITE_ENVIRONMENT = "local"` in `.env`

### Use Production Backend (Vercel)
Set `VITE_ENVIRONMENT = "production"` in `.env`

## Important Notes

- After changing the environment variable, restart your development server for changes to take effect
- The `ENVIRONMENT_MODE` variable in `deployment-panel-v2.tsx` controls the overlay feature separately from the API environment
- All API calls automatically use the configured environment through `getApiUrl()` from `lib/config.ts`

## How It Works

The configuration is handled by `src/lib/config.ts`:
- Reads the `VITE_ENVIRONMENT` variable
- Selects the appropriate URL (local or production)
- Provides `getApiUrl()` helper function for all API calls
