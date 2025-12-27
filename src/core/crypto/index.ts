import { CryptoService } from './crypto.service';

export type { CryptoService } from './crypto.service';
export * from './crypto.types';

/**
 * ### Shared instance of the cryptographic service
 *
 * Provides a central point of access for secure decryption and key management,
 * ensuring consistent cryptographic operations across the application while
 * minimizing exposure of sensitive key material.
 */
export const cryptoService = new CryptoService();
