# React 19 Deployment Fix for Azure App Service

## Problem
When deploying the Next.js app to Azure App Service, clicking the upload button resulted in this error:

```
Error: Cannot find module './cjs/react-jsx-runtime.production.min.js'
Require stack:
- /home/site/wwwroot/node_modules/react/jsx-runtime.js
```

## Root Cause
The issue was in the GitHub Actions workflow's packaging step. The command:
```bash
zip Nextjs-site.zip ./* .next -qr
```

This command only zips:
- Visible files matching `*` (excludes directories starting with `.`)
- The `.next` directory explicitly

**It was missing the `node_modules` directory**, which contains the React CJS files needed by Next.js standalone builds.

## Solution
Changed the zip command in all three workflow files to:
```bash
zip -r Nextjs-site.zip . -x "*.git*"
```

This recursively zips **everything** in the current directory (`.`), including `node_modules`, while only excluding git files.

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
```

### After:
```yaml
- name: 🔍 Verify React files before packaging
  run: |
    echo "Checking for React CJS files..."
    ls -la ./site-deploy/node_modules/react/cjs/ || echo "React CJS directory not found!"
    ls -la ./site-deploy/node_modules/react-dom/cjs/ || echo "React-DOM CJS directory not found!"

- name: 📦 Package Next application
  run: |
    cd ./site-deploy
    zip -r Nextjs-site.zip . -x "*.git*"
```

## Why This Happens with React 19
React 19 uses both ESM and CJS builds. Next.js standalone mode includes only the necessary dependencies, but the deployment package wasn't including the `node_modules` directory at all, causing runtime module resolution failures.

## Verification
After redeploying with this fix:
1. The diagnostic step will show that React CJS files exist before packaging
2. The zip file will include the complete `node_modules` directory
3. The upload functionality should work without module resolution errors

## Next Steps
Push this branch and run the workflow. Monitor the build logs to confirm the React CJS files are detected and properly packaged.
