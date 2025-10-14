# Deployment Verification Checklist

## After pushing this branch, verify the following in GitHub Actions logs:

### Build Job
- [ ] Step "🔍 Verify React files before packaging" shows React CJS files exist
- [ ] Step shows "Good: package.json removed"
- [ ] Step "📦 Package Next application" completes successfully
- [ ] Zip file is created and uploaded as artifact

### Deploy Job  
- [ ] Step "🔍 Verify artifact contents" extracts zip successfully
- [ ] Shows `node_modules/react/cjs/react-jsx-runtime.production.js` in listing
- [ ] Shows "React CJS files found" message
- [ ] Does NOT show package.json in the extracted files

### Azure Configuration
- [ ] Step "Azure CLI script" sets `NODE_ENV=production`
- [ ] Step sets `SCM_DO_BUILD_DURING_DEPLOYMENT=false`
- [ ] Deployment completes successfully

## After Deployment - In Azure Portal

1. Go to App Service → Configuration → Application settings
2. Verify these settings exist:
   - `NODE_ENV` = `production`
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`

3. Test the application:
   - [ ] App loads successfully
   - [ ] Click upload button
   - [ ] Upload a PDF document
   - [ ] No module resolution errors in logs

## If Still Failing

Check Azure App Service logs:
```bash
az webapp log tail --name <APP_NAME> --resource-group <RG_NAME>
```

Look for:
- What version of React is actually loaded
- What file paths it's trying to require
- Whether npm install ran (should NOT run)

## Alternative Solution (if needed)

If removing package.json causes other issues, we can:
1. Copy package-lock.json to force exact versions
2. Set npm config to skip scripts
3. Create a custom .deployment file
