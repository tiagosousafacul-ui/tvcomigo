// Lightweight SVG QR Code / link share visualizer
export function getQrCodeImageUrl(text: string, size = 260): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=09090b&color=a855f7&margin=10`;
}
