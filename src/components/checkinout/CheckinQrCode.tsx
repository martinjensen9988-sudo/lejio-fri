import { QRCodeSVG } from 'qrcode.react';

export function CheckinQrCode({ checkinUrl }: { checkinUrl: string }) {
  return (
    <div className="flex flex-col items-center">
      <QRCodeSVG value={checkinUrl} size={120} />
      <div className="mt-1 text-xs break-all text-center">{checkinUrl}</div>
    </div>
  );
}
