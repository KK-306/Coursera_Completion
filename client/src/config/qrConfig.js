export const QR_CONFIG = Object.freeze({
  qrCodes: [
    import.meta.env.VITE_QR_BANK_1 || '/qr/bank1.png',
    import.meta.env.VITE_QR_BANK_2 || '/qr/bank2.png',
  ],
  rotationIntervalMs: Number(import.meta.env.VITE_QR_ROTATION_MS || 120000), // 120,000ms = 2 minutes
});
