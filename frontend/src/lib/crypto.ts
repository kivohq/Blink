// frontend/src/lib/crypto.ts
// Utility for hybrid E2EE using Web Crypto API

export const generateKeyPair = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey"]
  );
};

export const encryptMessage = async (text: string, sharedKey: CryptoKey) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    data
  );

  // Return IV + Encrypted Data
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedContent)),
  };
};

export const decryptMessage = async (encryptedData: { iv: number[], data: number[] }, sharedKey: CryptoKey) => {
  const iv = new Uint8Array(encryptedData.iv);
  const data = new Uint8Array(encryptedData.data);

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedContent);
};
