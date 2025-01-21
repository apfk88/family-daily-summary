export function arrayBufferToBase64Url(buffer) {
  const byteArray = new Uint8Array(buffer);
  let binaryString = "";
  for (let i = 0; i < byteArray.length; i++) {
    binaryString += String.fromCharCode(byteArray[i]);
  }
  return btoa(binaryString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function pemToArrayBuffer(pem) {
  if (!pem) {
    throw new Error("Private key is undefined or empty.");
  }
  const base64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export function toBase64Url(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
} 