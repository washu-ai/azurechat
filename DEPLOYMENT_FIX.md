# React 19 Deployment Fix for Azure App Service

## Problem
When deploying the Next.js app to Azure App Service, clicking the upload button resulted in this error:

```
Error: Cannot find module './cjs/react-jsx-runtime.production.min.js'
Require stack:
- /home/site/wwwroot/node_modules/react/jsx-runtime.js
```

## Root Causes
There were multiple issues:

1. **Incorrect zip command** - wasn't including `node_modules`
2. **Missing NODE_ENV** - Azure wasn't running in production mode  
3. **Azure running npm install** - Despite SCM_DO_BUILD_DURING_DEPLOYMENT=false, Azure was detecting package.json and reinstalling dependencies, potentially getting different React versions

## Solution
Applied multiple fixes:

### 1. Fixed zip command
```bash
zip -r Nextjs-site.zip . -x "*.git*"
```
This recursively zips **everything**, including `node_modules`.

### 2. Set NODE_ENV=production
Added `NODE_ENV=production` to Azure app settings to ensure React uses production builds.

### 3. Removed package.json from deployment
Added step to remove `package.json` from the standalone build before zipping:
```bash
rm -f ./site-deploy/package.json
```
This prevents Azure from detecting it and running `npm install`, which could install different dependency versions.

## Files Modified
1. `.github/workflows/open-ai-app-dev.yml`
2. `.github/workflows/open-ai-app-prod.yml`
3. `.github/workflows/open-ai-app-test.yml`

## Changes Made

### Before:
```yaml
- name: 📦 Package Next application
  run: |
    cd ./site-deploy
    zip Nextjs-site.zip ./* .next -qr

- name: Azure CLI script
  uses: azure/CLI@v1
  with:
    inlineScript: |
      az webapp config appsettings set -n $APP_NAME -g $RG --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false -o none
```

### After:
```yaml
- name: 📝 Remove package.json to prevent Azure from running npm install
  run: rm -f ./site-deploy/package.json

- name: 🔍 Verify React files before packaging
  run: |
    echo "Checking for React CJS files..."
    ls -la ./site-deploy/node_modules/react/cjs/ || echo "React CJS directory not found!"
    echo "Verifying package.json is removed..."
    ls ./site-deploy/package.json && echo "WARNING: package.json still exists!" || echo "Good: package.json removed"

- name: 📦 Package Next application
  run: |
    cd ./site-deploy
    zip -r Nextjs-site.zip . -x "*.git*"

- name: Azure CLI script
  uses: azure/CLI@v1
  with:
    inlineScript: |
      az webapp config appsettings set -n $APP_NAME -g $RG --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false NODE_ENV=production -o none
```

## Why This Happens with React 19
React 19 uses both ESM and CJS builds. The issues were:
- React 19.2.0 has files named `react-jsx-runtime.production.js`
- Older React versions had `react-jsx-runtime.production.min.js`
- If Azure ran `npm install` with version ranges like `^19.2.0`, it might install a different patch version
- Without `NODE_ENV=production`, React might not load the correct file paths

## Verification Steps
After redeploying:
1. Build logs will show React CJS files are present before packaging
2. Build logs will confirm package.json was removed
3. Deploy logs will show artifact verification step extracting zip and listing React files
4. Azure app settings will show `NODE_ENV=production`
5. Upload functionality should work without module resolution errors

## Additional Diagnostic Added
The deploy job now includes a step to extract and verify the zip contents before deployment:
```yaml
- name: 🔍 Verify artifact contents
  run: |
    unzip -l Nextjs-site.zip | grep -E "react|package.json"
    unzip -q Nextjs-site.zip -d temp_verify
    ls -la temp_verify/node_modules/react/cjs/ || echo "ERROR: React CJS not in zip!"
```

## Next Steps
1. Commit and push these changes
2. Monitor the GitHub Actions workflow logs
3. Check the diagnostic outputs to confirm files are packaged correctly
4. If still failing, check Azure App Service logs for what's actually extracted
