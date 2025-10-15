# Azure App Service Configuration for Node.js 22

## Required Application Settings

When deploying this application to Azure App Service with Node.js 22, add these application settings:

### 1. Node.js Options (REQUIRED)
```
NODE_OPTIONS = --dns-result-order=ipv4first
```

This setting resolves DNS/fetch issues with Azure services in Node.js 22.

### 2. Environment Variables

Ensure these are configured (from your Key Vault or direct values):

#### Azure OpenAI
```
AZURE_OPENAI_API_INSTANCE_NAME = your-instance
AZURE_OPENAI_API_DEPLOYMENT_NAME = your-deployment
AZURE_OPENAI_API_VERSION = 2024-02-15-preview
AZURE_OPENAI_API_KEY = <from-keyvault>
```

#### Azure Document Intelligence
```
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = https://YOUR-REGION.api.cognitive.microsoft.com
AZURE_DOCUMENT_INTELLIGENCE_KEY = <from-keyvault>
```

**Important:** The endpoint should NOT have a trailing slash.

#### Azure Cosmos DB
```
AZURE_COSMOSDB_URI = https://your-account.documents.azure.com:443/
AZURE_COSMOSDB_KEY = <from-keyvault>
```

#### Authentication (choose one or more)
```
# GitHub OAuth
AUTH_GITHUB_ID = your-github-app-id
AUTH_GITHUB_SECRET = <from-keyvault>

# Azure AD OAuth
AZURE_AD_CLIENT_ID = your-app-registration-id
AZURE_AD_CLIENT_SECRET = <from-keyvault>
AZURE_AD_TENANT_ID = your-tenant-id

# NextAuth
NEXTAUTH_SECRET = <generate-with: openssl rand -base64 32>
NEXTAUTH_URL = https://your-app.azurewebsites.net
```

## Azure CLI Commands

### Set NODE_OPTIONS
```bash
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings NODE_OPTIONS="--dns-result-order=ipv4first"
```

### Enable Detailed Logging (for debugging)
```bash
# Enable application logging
az webapp log config \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --application-logging filesystem \
  --level information

# Stream logs
az webapp log tail \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP
```

### Restart App Service
```bash
az webapp restart \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP
```

## General Settings in Azure Portal

Navigate to: **App Service → Configuration → General settings**

### Stack Settings
- **Stack:** Node
- **Major version:** 22 LTS
- **Minor version:** Latest (22.x)

### Platform Settings
- **Platform:** 64 Bit
- **Always On:** On (for production)
- **ARR affinity:** Off (for better load balancing)
- **HTTPS Only:** On
- **Minimum TLS Version:** 1.2

### Startup Command
Leave empty - the app will automatically start with `node server.js` from the standalone build.

## Network Settings

If using VNet integration or Private Endpoints:

1. **Allow outbound traffic** to:
   - `*.openai.azure.com`
   - `*.api.cognitive.microsoft.com` 
   - `*.documents.azure.com`

2. **Ports required:**
   - 443 (HTTPS)

3. **DNS:**
   - Ensure proper DNS resolution for Azure service endpoints
   - Consider using Azure DNS if having connectivity issues

## Monitoring

### Enable Application Insights
```bash
# Create or link Application Insights
az monitor app-insights component create \
  --app YOUR_APP_INSIGHTS_NAME \
  --location YOUR_LOCATION \
  --resource-group YOUR_RESOURCE_GROUP

# Connect to your app
az webapp config appsettings set \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="<connection-string>"
```

### Key Metrics to Monitor
- **HTTP 5xx errors** - Server errors
- **Response time** - Should be < 3s for document upload
- **Dependency calls** - Monitor Azure Document Intelligence calls
- **Failed requests** - Watch for fetch failures

## Troubleshooting

### Check Current Settings
```bash
az webapp config appsettings list \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --output table
```

### View Logs
```bash
# Download logs
az webapp log download \
  --name YOUR_APP_NAME \
  --resource-group YOUR_RESOURCE_GROUP \
  --log-file app-logs.zip

# Or view in Azure Portal:
# App Service → Monitoring → Log stream
```

### Common Issues

1. **"fetch failed" errors:**
   - Ensure `NODE_OPTIONS=--dns-result-order=ipv4first` is set
   - Check endpoint URLs have no trailing slashes
   - Verify network connectivity to Azure services

2. **Authentication failures:**
   - Check NEXTAUTH_URL matches your app URL exactly
   - Verify NEXTAUTH_SECRET is set and persistent
   - Check OAuth redirect URIs in provider settings

3. **Document upload slow/timeout:**
   - Increase Azure Document Intelligence quota
   - Check App Service plan (scale up if needed)
   - Verify file size limits

## Performance Optimization

### App Service Plan
- **Minimum for production:** S1 (1 core, 1.75 GB RAM)
- **Recommended:** P1V2 or P1V3 (2+ cores)

### Scale Settings
```bash
# Enable autoscale
az monitor autoscale create \
  --resource-group YOUR_RESOURCE_GROUP \
  --resource YOUR_APP_NAME \
  --resource-type Microsoft.Web/sites \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Security Best Practices

1. **Use Key Vault** for all secrets
2. **Enable Managed Identity** for the App Service
3. **Configure CORS** appropriately
4. **Set up** custom domains with SSL
5. **Enable** Microsoft Defender for Cloud
6. **Regular** dependency updates (use Dependabot)

## Additional Resources

- [Azure App Service Node.js Configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs)
- [Node.js 22 Release Notes](https://nodejs.org/en/blog/release/v22.0.0)
- [Azure Document Intelligence Docs](https://learn.microsoft.com/en-us/azure/applied-ai-services/form-recognizer/)
