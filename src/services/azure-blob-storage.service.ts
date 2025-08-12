import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";

interface AzureBlobConfig {
  connectionString: string;
  containerName: string;
}

interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  contentType: string;
}

interface UploadOptions {
  fileName?: string;
  contentType?: string;
  folder?: string;
}

export class AzureBlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private config: AzureBlobConfig;

  constructor() {
    this.config = this.loadConfig();

    if (this.isConfigured()) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        this.config.connectionString
      );
      this.containerClient = this.blobServiceClient.getContainerClient(
        this.config.containerName
      );
    }
  }

  private loadConfig(): AzureBlobConfig {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || "template-images";

    if (process.env.NODE_ENV === "production" && !connectionString) {
      throw new Error("Missing Azure Storage connection string in production");
    }

    return {
      connectionString: connectionString || "dummy-connection-string",
      containerName,
    };
  }

  public isConfigured(): boolean {
    return !!(
      this.config.connectionString &&
      this.config.connectionString !== "dummy-connection-string" &&
      this.config.containerName
    );
  }

  async ensureContainerExists(): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    try {
      await this.containerClient.createIfNotExists({
        access: "blob", // Public read access for images
      });
    } catch (error) {
      console.error("Error creating container:", error);
      throw new Error("Failed to create Azure Storage container");
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    await this.ensureContainerExists();

    const fileExtension = this.getFileExtension(
      options.contentType || "image/jpeg"
    );
    const fileName = options.fileName || `${uuidv4()}${fileExtension}`;
    const folder = options.folder || "templates";
    const blobName = `${folder}/${fileName}`;

    const blockBlobClient: BlockBlobClient =
      this.containerClient.getBlockBlobClient(blobName);

    try {
      const uploadResult = await blockBlobClient.upload(buffer, buffer.length, {
        blobHTTPHeaders: {
          blobContentType: options.contentType || "image/jpeg",
        },
      });

      if (!uploadResult.requestId) {
        throw new Error("Upload failed - no request ID returned");
      }

      return {
        url: blockBlobClient.url,
        fileName: blobName,
        size: buffer.length,
        contentType: options.contentType || "image/jpeg",
      };
    } catch (error) {
      console.error("Error uploading to Azure Blob Storage:", error);
      throw new Error("Failed to upload file to Azure Storage");
    }
  }

  async uploadFromUrl(
    sourceUrl: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    try {
      // Fetch the image from the source URL
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image from URL: ${response.statusText}`
        );
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType =
        response.headers.get("content-type") ||
        options.contentType ||
        "image/jpeg";

      return await this.uploadBuffer(buffer, {
        ...options,
        contentType,
      });
    } catch (error) {
      console.error("Error uploading from URL:", error);
      throw new Error("Failed to upload file from URL");
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error("Error deleting file from Azure Blob Storage:", error);
      throw new Error("Failed to delete file from Azure Storage");
    }
  }

  async listFiles(folder?: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    try {
      const files: string[] = [];
      const prefix = folder ? `${folder}/` : "";

      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        files.push(blob.name);
      }

      return files;
    } catch (error) {
      console.error("Error listing files from Azure Blob Storage:", error);
      throw new Error("Failed to list files from Azure Storage");
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("Azure Blob Storage is not configured");
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }

  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
    };

    return extensions[contentType] || ".jpg";
  }

  // Utility method to generate optimized file names
  generateFileName(
    originalName: string,
    templateId: number,
    imageType: string
  ): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedBaseName = baseName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    return `template-${templateId}-${imageType}-${sanitizedBaseName}-${timestamp}${ext}`;
  }
}

// Export singleton instance
export const azureBlobStorageService = new AzureBlobStorageService();
