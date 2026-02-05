import type { ReactNode } from 'react';
import { Banknote, Building2, Smartphone, CreditCard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobilepay' | 'card';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: ReactNode;
}

const paymentMethodOptions: PaymentMethodOption[] = [
  {
    value: 'cash',
    label: 'Kontant',
    description: 'Betal kontant ved afhentning',
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    value: 'bank_transfer',
    label: 'Bankoverførsel',
    description: 'Overfør til udlejers bankkonto',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    value: 'mobilepay',
    label: 'MobilePay',
    description: 'Betal via MobilePay',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: 'card',
    label: 'Kort',
    description: 'Betal med kredit-/debetkort',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

interface PaymentMethodSelectorProps {
  acceptedMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  lessorPaymentDetails?: {
    mobilepay_number?: string | null;
    bank_reg_number?: string | null;
    bank_account_number?: string | null;
  };
}

export const PaymentMethodSelector = ({
  acceptedMethods,
  selectedMethod,
  onMethodChange,
  lessorPaymentDetails,
}: PaymentMethodSelectorProps) => {
  const availableOptions = paymentMethodOptions.filter((option) =>
    acceptedMethods.includes(option.value)
  );

  if (availableOptions.length === 0) {
    return null;
  }

  const getPaymentDetails = (method: PaymentMethod): string | null => {
    if (!lessorPaymentDetails) return null;

    switch (method) {
      case 'mobilepay':
        return lessorPaymentDetails.mobilepay_number
          ? `MobilePay nr: ${lessorPaymentDetails.mobilepay_number}`
          : null;
      case 'bank_transfer':
        if (lessorPaymentDetails.bank_reg_number && lessorPaymentDetails.bank_account_number) {
          return `Reg: ${lessorPaymentDetails.bank_reg_number} - Konto: ${lessorPaymentDetails.bank_account_number}`;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Vælg betalingsmetode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod || undefined}
          onValueChange={(value) => onMethodChange(value as PaymentMethod)}
          className="space-y-3"
        >
          {availableOptions.map((option) => {
            const details = getPaymentDetails(option.value);
            return (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    {selectedMethod === option.value && details && (
                      <p className="text-sm font-medium text-primary mt-2">{details}</p>
                    )}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
