"use server";

import { userHashedId } from "@/features/auth/helpers";
import { CosmosDBContainer } from "@/features/common/cosmos";

import { uniqueId } from "@/features/common/util";
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
  DocumentAnalysisClientOptions,
} from "@azure/ai-form-recognizer";
import { SqlQuerySpec } from "@azure/cosmos";
import {
  AzureCogDocumentIndex,
  ensureIndexIsCreated,
  indexDocuments,
} from "./azure-cog-search/azure-cog-vector-store";
import {
  CHAT_DOCUMENT_ATTRIBUTE,
  ChatDocumentModel,
  ServerActionResponse,
} from "./models";
import { chunkDocumentWithOverlap } from "./text-chunk";
import { isNotNullOrEmpty } from "./utils";

const MAX_DOCUMENT_SIZE = 20000000;

export const UploadDocument = async (
  formData: FormData
): Promise<ServerActionResponse<string[]>> => {
  try {
    await ensureSearchIsConfigured();

    const { docs } = await LoadFile(formData);
    const splitDocuments = chunkDocumentWithOverlap(docs.join("\n"));

    return {
      success: true,
      error: "",
      response: splitDocuments,
    };
  } catch (e) {
    return {
      success: false,
      error: (e as Error).message,
      response: [],
    };
  }
};

const LoadFile = async (formData: FormData) => {
  try {
    const file: File | null = formData.get("file") as unknown as File;

    if (file && file.size < MAX_DOCUMENT_SIZE) {
      console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);
      
      const client = await initDocumentIntelligence();
      console.log("Document Intelligence client initialized successfully");

      const blob = new Blob([file], { type: file.type });
      const arrayBuffer = await blob.arrayBuffer();
      console.log(`Array buffer created, size: ${arrayBuffer.byteLength}`);

      console.log("Starting document analysis...");
      const poller = await client.beginAnalyzeDocument(
        "prebuilt-read",
        arrayBuffer
      );
      console.log("Document analysis started, polling for results...");
      const { paragraphs } = await poller.pollUntilDone();
      console.log(`Document analysis complete, found ${paragraphs?.length || 0} paragraphs`);

      const docs: Array<string> = [];

      if (paragraphs) {
        for (const paragraph of paragraphs) {
          docs.push(paragraph.content);
        }
      }

      return { docs };
    }
  } catch (e) {
    const error = e as any;
    console.error("Error in LoadFile:", error);
    console.error("Error stack:", error.stack);
    console.error("Error cause:", error.cause);

    if (error.details) {
      if (error.details.length > 0) {
        throw new Error(`Document Intelligence Error: ${error.details[0].message}`);
      } else {
        throw new Error(`Document Intelligence Error: ${error.details.error?.innererror?.message || error.message}`);
      }
    }

    // Provide more helpful error message for fetch failures
    if (error.message?.includes("fetch failed") || error.cause?.code) {
      throw new Error(
        `Failed to connect to Azure Document Intelligence service. ` +
        `Error: ${error.message}. ` +
        `Cause: ${error.cause?.message || 'Unknown'}. ` +
        `Code: ${error.cause?.code || 'N/A'}. ` +
        `Please check your endpoint URL and network configuration.`
      );
    }

    throw new Error(`Document processing error: ${error.message}`);
  }

  throw new Error("Invalid file format or size. Only PDF files are supported.");
};

export const IndexDocuments = async (
  fileName: string,
  docs: string[],
  chatThreadId: string
): Promise<ServerActionResponse<AzureCogDocumentIndex[]>> => {
  try {
    const documentsToIndex: AzureCogDocumentIndex[] = [];

    for (const doc of docs) {
      const docToAdd: AzureCogDocumentIndex = {
        id: uniqueId(),
        chatThreadId,
        user: await userHashedId(),
        pageContent: doc,
        metadata: fileName,
        embedding: [],
      };

      documentsToIndex.push(docToAdd);
    }

    await indexDocuments(documentsToIndex);

    await UpsertChatDocument(fileName, chatThreadId);
    return {
      success: true,
      error: "",
      response: documentsToIndex,
    };
  } catch (e) {
    console.log(e);
    return {
      success: false,
      error: (e as Error).message,
      response: [],
    };
  }
};

export const initDocumentIntelligence = async () => {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence endpoint or key is not configured");
  }

  // Ensure endpoint has proper format
  const formattedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;

  const options: DocumentAnalysisClientOptions = {
    // Add retry options and logging for better debugging
    retryOptions: {
      maxRetries: 3,
      retryDelayInMs: 1000,
    },
    // This helps with Node.js 22 compatibility
    allowInsecureConnection: false,
  };

  const client = new DocumentAnalysisClient(
    formattedEndpoint,
    new AzureKeyCredential(key),
    options
  );

  return client;
};

export const FindAllChatDocuments = async (chatThreadID: string) => {
  const container = await CosmosDBContainer.getInstance().getContainer();

  const querySpec: SqlQuerySpec = {
    query:
      "SELECT * FROM root r WHERE r.type=@type AND r.chatThreadId = @threadId AND r.isDeleted=@isDeleted",
    parameters: [
      {
        name: "@type",
        value: CHAT_DOCUMENT_ATTRIBUTE,
      },
      {
        name: "@threadId",
        value: chatThreadID,
      },
      {
        name: "@isDeleted",
        value: false,
      },
    ],
  };

  const { resources } = await container.items
    .query<ChatDocumentModel>(querySpec)
    .fetchAll();

  return resources;
};

export const UpsertChatDocument = async (
  fileName: string,
  chatThreadID: string
) => {
  const modelToSave: ChatDocumentModel = {
    chatThreadId: chatThreadID,
    id: uniqueId(),
    userId: await userHashedId(),
    createdAt: new Date(),
    type: CHAT_DOCUMENT_ATTRIBUTE,
    isDeleted: false,
    name: fileName,
  };

  const container = await CosmosDBContainer.getInstance().getContainer();
  await container.items.upsert(modelToSave);
};

export const ensureSearchIsConfigured = async () => {
  var isSearchConfigured =
    isNotNullOrEmpty(process.env.AZURE_SEARCH_NAME) &&
    isNotNullOrEmpty(process.env.AZURE_SEARCH_API_KEY) &&
    isNotNullOrEmpty(process.env.AZURE_SEARCH_INDEX_NAME) &&
    isNotNullOrEmpty(process.env.AZURE_SEARCH_API_VERSION);

  if (!isSearchConfigured) {
    throw new Error("Azure search environment variables are not configured.");
  }

  var isDocumentIntelligenceConfigured =
    isNotNullOrEmpty(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT) &&
    isNotNullOrEmpty(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);

  if (!isDocumentIntelligenceConfigured) {
    throw new Error(
      "Azure document intelligence environment variables are not configured."
    );
  }

  var isEmbeddingsConfigured = isNotNullOrEmpty(
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME
  );

  if (!isEmbeddingsConfigured) {
    throw new Error("Azure openai embedding variables are not configured.");
  }

  await ensureIndexIsCreated();
};
