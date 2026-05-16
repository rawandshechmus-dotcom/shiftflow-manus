interface QRCodeImageProps {
  dataUrl: string;
}

export default function QRCodeImage({ dataUrl }: QRCodeImageProps) {
  return (
    <div className="flex justify-center p-4 bg-white rounded-xl">
      <img src={dataUrl} alt="2FA QR Code" className="w-48 h-48" />
    </div>
  );
}