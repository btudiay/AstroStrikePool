import { getAddress, hexlify } from 'ethers';

let fheInstance: any = null;

/**
 * Get SDK from window (loaded via static script tag in HTML)
 * SDK 0.3.0-5 is loaded via static script tag in index.html
 */
const getSDK = (): any => {
  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  // Check for both uppercase and lowercase versions
  const sdk = (window as any).RelayerSDK || (window as any).relayerSDK;

  if (!sdk) {
    throw new Error('RelayerSDK not loaded. Please ensure the script tag is in your HTML.');
  }

  return sdk;
};

export const initializeFHE = async (provider?: any): Promise<any> => {
  if (fheInstance) {
    return fheInstance;
  }

  if (typeof window === 'undefined') {
    throw new Error('FHE SDK requires browser environment');
  }

  // Get Ethereum provider from multiple sources
  const ethereumProvider = provider ||
    (window as any).ethereum ||
    (window as any).okxwallet?.provider ||
    (window as any).okxwallet;

  if (!ethereumProvider) {
    throw new Error('Ethereum provider not found. Please connect your wallet first.');
  }

  console.log('[FHE] Initializing FHE SDK...');

  const sdk = getSDK();
  const { initSDK, createInstance, SepoliaConfig } = sdk;

  console.log('[FHE] SDK found, calling initSDK()...');
  await initSDK();
  console.log('[FHE] ✅ SDK initialized');

  const config = { ...SepoliaConfig, network: ethereumProvider };

  try {
    fheInstance = await createInstance(config);
    console.log('[FHE] ✅ FHE instance initialized for Sepolia');
    return fheInstance;
  } catch (error) {
    console.error('[FHE] ❌ createInstance failed:', error);
    throw error;
  }
};

export const getFHEInstance = (): any => {
  return fheInstance;
};

export const isFheReady = (): boolean => {
  return fheInstance !== null;
};

export const encryptWeight = async (
  weight: number | bigint,
  contractAddress: string,
  userAddress: string
): Promise<{ ciphertext: string; proof: string }> => {
  if (!fheInstance) {
    await initializeFHE();
  }
  if (!fheInstance) {
    throw new Error('FHE instance not initialized. Call initializeFHE() first.');
  }

  const weightBigInt = typeof weight === 'bigint' ? weight : BigInt(weight);

  if (weightBigInt <= 0n) {
    throw new Error('Weight must be greater than 0');
  }

  if (weightBigInt > 2n ** 64n - 1n) {
    throw new Error('Weight exceeds 64-bit range');
  }

  try {
    const input = fheInstance.createEncryptedInput(
      getAddress(contractAddress),
      getAddress(userAddress)
    );
    input.add64(weightBigInt);

    const { handles, inputProof } = await input.encrypt();

    const handleHex = hexlify(handles[0]);
    const proofHex = hexlify(inputProof);

    return {
      ciphertext: handleHex,
      proof: proofHex
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[FHE] ❌ Encryption failed:', errorMsg);
    throw new Error(`Failed to encrypt weight: ${errorMsg}`);
  }
};
