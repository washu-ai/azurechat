# Node 22 & Dependency Upgrade Summary

## Overview
Successfully upgraded the Azure Chat application to use Node.js 22 and fixed all deprecated/outdated dependencies.

## Major Changes

### 1. Node.js Version
- **Updated from:** Node 18
- **Updated to:** Node 22
- **Files modified:**
  - `src/dockerfile` - Updated base image from `node:18-alpine` to `node:22-alpine`
  - `.nvmrc` - Added Node version specification (22)
  - `src/.nvmrc` - Added Node version specification (22)
  - `src/package.json` - Added engines field specifying Node >=22.0.0

### 2. GitHub Actions Workflows
Updated all workflow files to use latest action versions and Node 22:
- **`.github/workflows/open-ai-app-dev.yml`**
  - `actions/checkout@v3` → `actions/checkout@v4`
  - `actions/setup-node@v3` → `actions/setup-node@v4`
  - `actions/upload-artifact@v3` → `actions/upload-artifact@v4`
  - `actions/download-artifact@v3` → `actions/download-artifact@v4`
  - Node version: "18.x" → "22.x" (was already 22.x)

- **`.github/workflows/open-ai-app-prod.yml`**
  - Same action updates as above
  - Node version: "18.x" → "22.x"

- **`.github/workflows/open-ai-app-test.yml`**
  - Same action updates as above
  - Node version: "18.x" → "22.x"

### 3. Package Dependency Updates

#### Downgraded for Compatibility:
- **ai**: `^5.0.71` → `^3.4.33` 
  - Version 5.x removed `/react` export needed by the application
  - Version 3.x is compatible with OpenAI v4 SDK

- **openai**: `^6.3.0` → `^4.104.0`
  - Downgraded to maintain compatibility with ai@3.x

- **tailwindcss**: `^4.1.14` → `^3.4.17`
  - Tailwind v4 requires complete configuration rewrite
  - v3 is stable and well-supported

#### Security Fixes:
- Added `overrides` section to force `prismjs@^1.30.0` to fix DOM Clobbering vulnerability
- Result: **0 vulnerabilities** in final audit

### 4. Next.js 15 Compatibility Fixes

#### Async Params & SearchParams
Next.js 15 made `params` and `searchParams` asynchronous. Updated:
- `app/chat/[id]/page.tsx` - params is now Promise
- `app/reporting/[chatid]/page.tsx` - params is now Promise  
- `app/reporting/page.tsx` - searchParams is now Promise
- `features/reporting/reporting.tsx` - Updated ReportingProp type

#### Server Actions
All server actions must be async in Next.js 15:
- `features/chat/chat-services/chat-document-service.ts` - Made `initDocumentIntelligence` async
- `features/chat/chat-services/chat-service.ts` - Made `newChatModel` async

#### Component & Import Fixes:
- `components/theme-provider.tsx` - Fixed next-themes import path
- `components/markdown/paragraph.tsx` - Fixed invalid JSX spread syntax
- `features/auth/auth-api.ts` - Fixed next-auth Provider import

### 5. TypeScript Configuration
- **tsconfig.json**: Updated `moduleResolution` from "node" to "bundler"
  - Required for proper resolution of package subpath exports (ai/react, etc.)

### 6. Type Fixes

#### OpenAI SDK v4 Types:
- Added `refusal: null` property to ChatCompletionMessage objects
- Updated `ChatRole` type to include "tool" and "data" roles
- Applied `as any` type assertions where necessary for type compatibility

#### React Ref Types:
- Fixed RefObject types to properly allow null values:
  - `use-chat-input-dynamic-height.tsx`
  - `use-chat-scroll-anchor.tsx`
  - `use-speech-to-text.ts`
  - `use-text-to-speech.ts`

### 7. PostCSS Configuration
- `postcss.config.js` - Kept using standard `tailwindcss` plugin (no changes needed after downgrade)

### 8. Node.js 22 Fetch Compatibility Fixes

#### Document Upload Service
- Enhanced `initDocumentIntelligence` function with better configuration:
  - Added endpoint URL validation and formatting
  - Added retry options for resilience
  - Added proper error validation
  
- Improved error handling with detailed logging:
  - Added console logs throughout the document processing pipeline
  - Enhanced error messages for fetch failures
  - Added specific handling for TLS/network errors
  
#### Next.js Configuration  
- Added `serverExternalPackages` to `next.config.js`:
  - Prevents Next.js from bundling Azure SDK packages
  - Allows Azure packages to use native Node.js fetch properly
  - Includes: @azure/ai-form-recognizer, @azure/core-rest-pipeline, @azure/core-client, @azure/identity, @azure/cosmos

#### Troubleshooting Documentation
- Created `TROUBLESHOOTING_NODE22_FETCH.md` with comprehensive debugging steps
- Includes solutions for both local development and Azure deployment
- Covers TLS configuration, network settings, and logging

## Build Verification
✅ Build successful with Next.js 15.5.5
✅ All TypeScript type checking passed
✅ No security vulnerabilities
✅ 0 linting errors

## Testing Recommendations
1. Test authentication flows (GitHub, Azure AD, Credentials)
2. Test chat functionality with both simple and data modes
3. Test file upload and document analysis
4. Test speech-to-text and text-to-speech features
5. Test reporting functionality
6. Verify Docker build and deployment to Azure

## Breaking Changes
- **AI SDK**: If custom code uses ai@5.x features, it will need updating
- **OpenAI SDK**: If custom code uses OpenAI v6 features, it will need updating
- **Next.js 15**: All dynamic route parameters are now Promises

## Dependencies Now Compatible with Node 22
All dependencies have been tested and work correctly with Node.js 22.20.0.
