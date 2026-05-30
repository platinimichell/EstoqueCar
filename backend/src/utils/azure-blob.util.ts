// src/utils/azure-blob.util.ts
// Utilitário para upload de imagens no Azure Blob Storage

import { BlobServiceClient } from '@azure/storage-blob';

class AzureBlobUtil {
  private containerName: string;
  private blobServiceClient: BlobServiceClient | null = null;

  constructor() {
    this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'estoque-car-images';
  }

  private getClient(): BlobServiceClient {
    if (!this.blobServiceClient) {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurada.');
      }
      this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    }
    return this.blobServiceClient;
  }

  /**
   * Faz upload de um buffer para o Azure Blob Storage.
   * Retorna a URL pública do arquivo.
   */
  async upload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
    const client = this.getClient();
    const containerClient = client.getContainerClient(this.containerName);

    // Garante que o container existe
    await containerClient.createIfNotExists({ access: 'blob' });

    const extension = contentType.split('/')[1] || 'jpg';
    const blobName = `${filename}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    return blockBlobClient.url;
  }

  /**
   * Remove um blob pelo nome.
   */
  async delete(blobName: string): Promise<void> {
    const client = this.getClient();
    const containerClient = client.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  }
}

export default new AzureBlobUtil();
