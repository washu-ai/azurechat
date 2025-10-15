# Troubleshooting Document Upload Issues with Node.js 22

## ⚠️ Critical Issue
When uploading documents in Azure Chat on Node.js 22, you may encounter:
```
TypeError: fetch failed
    at node:internal/deps/undici/undici:13510:13
```

## 🔍 Root Cause
Node.js 22 uses undici 6.21.x for native fetch operations, which has:
1. **Stricter TLS/SSL certificate validation**
2. **Different DNS resolution behavior** (IPv6 preferred by default)
3. **Changes in how HTTP/2 connections are handled**

These changes can cause connectivity issues with Azure services, especially Azure Document Intelligence.

## ✅ Quick Fixes (Try These First)

### For Azure App Service:
Add this Application Setting in Azure Portal:
```
NODE_OPTIONS = --dns-result-order=ipv4first
```

Or via Azure CLI:
```bash
az webapp config appsettings set \
  --name <your-app-name> \
  --resource-group <your-rg> \
  --settings NODE_OPTIONS="--dns-result-order=ipv4first"
```

**Restart the App Service after adding this setting.**

### For Local Development:
Add to your `.env` file or set as environment variable:
```bash
export NODE_OPTIONS="--dns-result-order=ipv4first"
```

Then restart your development server.

## Solutions Implemented

### 1. Updated Document Intelligence Client Configuration
- Added proper endpoint URL formatting (removes trailing slashes)
- Added retry options for better resilience
- Added proper error validation and logging

### 2. Enhanced Error Handling
- Added detailed logging throughout the document processing pipeline
- Improved error messages to help diagnose fetch failures
- Added specific handling for network/TLS errors

### 3. Next.js Configuration
- Added `serverComponentsExternalPackages` to prevent bundling of Azure SDKs
- This allows the Azure packages to use their native HTTP client properly

## Additional Troubleshooting Steps

### If the issue persists in Azure App Service:

#### 1. Check Application Settings in Azure Portal
Ensure these environment variables are set correctly:
```
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://YOUR-REGION.api.cognitive.microsoft.com
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key-here
```

**Important:** The endpoint should NOT have a trailing slash and must use `https://`

#### 2. Enable Application Logging
In Azure Portal → App Service → Monitoring → App Service Logs:
- Enable Application Logging (Filesystem)
- Level: Information or Verbose
- Check logs in Log stream or download via FTP

#### 3. Check Network Configuration
- Ensure the App Service can reach `*.api.cognitive.microsoft.com`
- If using VNet integration, check NSG rules and route tables
- Verify no firewall rules are blocking outbound HTTPS (443)

#### 4. Verify Document Intelligence Resource
- Check the Document Intelligence resource is in the same region or accessible
- Verify the key is valid (regenerate if needed)
- Test the endpoint with a REST client (Postman, curl)

#### 5. Check TLS Settings
In Azure Portal → App Service → Configuration → General settings:
- Minimum TLS Version: 1.2 (recommended)
- HTTPS Only: On

#### 6. Node.js Specific Settings
If running in Azure App Service, you can add these app settings to help with debugging and compatibility:

```bash
# Enable Node.js fetch debugging
NODE_DEBUG=http,https,net,tls

# Set DNS resolution order (helps with IPv6/IPv4 issues)
NODE_OPTIONS=--dns-result-order=ipv4first

# Or use Azure CLI:
az webapp config appsettings set --name <app-name> --resource-group <rg-name> \
  --settings NODE_DEBUG=http,https,net,tls NODE_OPTIONS=--dns-result-order=ipv4first
```

**Important:** The `NODE_OPTIONS=--dns-result-order=ipv4first` setting can resolve many fetch issues with Azure services in Node.js 22.

### Local Development Issues

If you see this error locally:

#### 1. Check your .env file
Ensure:
```bash
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT="https://YOUR-REGION.api.cognitive.microsoft.com"
AZURE_DOCUMENT_INTELLIGENCE_KEY="your-key-here"
```

#### 2. Test the endpoint directly
```bash
curl -H "Ocp-Apim-Subscription-Key: YOUR-KEY" \
  "https://YOUR-REGION.api.cognitive.microsoft.com/formrecognizer/documentModels/prebuilt-read?api-version=2023-07-31"
```

#### 3. Network/Proxy Issues
If behind a corporate proxy:
```bash
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for testing!
```

⚠️ **Warning:** Never use `NODE_TLS_REJECT_UNAUTHORIZED=0` in production!

## Verification

After deploying these changes, you should see detailed logs when uploading a document:
```
Processing file: document.pdf, size: 12345, type: application/pdf
Document Intelligence client initialized successfully
Array buffer created, size: 12345
Starting document analysis...
Document analysis started, polling for results...
Document analysis complete, found 10 paragraphs
```

If the error occurs, the logs will now show:
- The exact error message
- The error cause and code
- Helpful suggestions for resolution

## Alternative Solutions

### If fetch continues to fail:

1. **Downgrade to Node.js 20 LTS** (temporary workaround)
   - Modify Dockerfile: `FROM node:20-alpine`
   - Update workflows to use Node 20
   - This uses an older undici version with less strict validation

2. **Use a different HTTP client** (advanced)
   - Configure Azure SDK to use axios or node-fetch instead of native fetch
   - Requires custom client pipeline configuration

3. **Contact Azure Support**
   - If the issue is specific to your Azure region or network configuration
   - They can help diagnose network/DNS/TLS issues

## Related Resources
- [Azure Document Intelligence SDK](https://learn.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/)
- [Node.js 22 Breaking Changes](https://nodejs.org/en/blog/release/v22.0.0)
- [Undici (Node.js fetch) Documentation](https://undici.nodejs.org/)
