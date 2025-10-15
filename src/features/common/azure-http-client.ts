/**
 * Azure HTTP Client Configuration for Node.js 22
 * 
 * This module provides a custom HTTP client configuration for Azure SDKs
 * to work properly with Node.js 22's undici fetch implementation.
 */

import { PipelinePolicy, PipelineRequest, PipelineResponse, SendRequest } from "@azure/core-rest-pipeline";

/**
 * Custom policy to add additional headers and configuration for Node.js 22 compatibility
 */
export function createNodeFetchPolicy(): PipelinePolicy {
  return {
    name: "nodeFetchPolicy",
    async sendRequest(request: PipelineRequest, next: SendRequest): Promise<PipelineResponse> {
      // Add headers that help with Azure service communication
      if (!request.headers.has("Connection")) {
        request.headers.set("Connection", "keep-alive");
      }
      
      // Ensure proper content type for form data
      if (request.body && !request.headers.has("Content-Type")) {
        request.headers.set("Content-Type", "application/octet-stream");
      }

      try {
        return await next(request);
      } catch (error: any) {
        // Add more context to fetch errors
        if (error.message?.includes("fetch failed")) {
          const enhancedError = new Error(
            `Azure Service Connection Failed: ${error.message}\n` +
            `URL: ${request.url}\n` +
            `Cause: ${error.cause?.message || 'Unknown'}\n` +
            `Code: ${error.cause?.code || 'N/A'}`
          );
          enhancedError.cause = error.cause;
          throw enhancedError;
        }
        throw error;
      }
    },
  };
}

/**
 * Get Azure client options with Node.js 22 compatibility settings
 */
export function getAzureClientOptions() {
  return {
    retryOptions: {
      maxRetries: 3,
      retryDelayInMs: 1000,
      maxRetryDelayInMs: 64000,
    },
    // Disable client-side request ID generation which can cause issues
    telemetryOptions: {
      clientRequestIdHeaderName: undefined,
    },
    allowInsecureConnection: false,
    // Add custom policies
    additionalPolicies: [
      {
        policy: createNodeFetchPolicy(),
        position: "perRetry" as const,
      },
    ],
  };
}
