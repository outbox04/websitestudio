declare module "vietqr" {
  export class VietQR {
    constructor(options: { clientID: string; apiKey: string });
    genQRCodeBase64(options: {
      bank: string;
      accountName: string;
      accountNumber: string;
      amount: string;
      memo: string;
      template?: "qr_only" | "compact" | "compact2";
    }): Promise<{ data?: { qrDataURL?: string } }>;
  }
}
