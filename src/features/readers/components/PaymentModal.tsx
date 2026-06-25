import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, Building, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "credit_card", label: "Credit Card", icon: CreditCard },
  { id: "paypal", label: "PayPal", icon: Wallet },
  { id: "bank_transfer", label: "Bank Transfer", icon: Building },
];

export function PaymentModal({
  open,
  onOpenChange,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("credit_card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method === "credit_card") {
      if (!cardNumber || cardNumber.length < 16) {
        toast.error("Please enter a valid card number");
        return;
      }
      if (!expiryDate || expiryDate.length < 5) {
        toast.error("Please enter expiry date (MM/YY)");
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error("Please enter CVV");
        return;
      }
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Payment successful!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Secure payment for your reading session
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/30 text-center">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-3xl font-bold text-primary">
              ${amount.toFixed(2)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <RadioGroup
              value={method}
              onValueChange={setMethod}
              className="grid grid-cols-1 gap-2"
            >
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <div
                    key={pm.id}
                    className="flex items-center space-x-2 rounded-lg border p-3"
                  >
                    <RadioGroupItem value={pm.id} id={pm.id} />
                    <Label
                      htmlFor={pm.id}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {pm.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {method === "credit_card" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) =>
                      setExpiryDate(formatExpiry(e.target.value))
                    }
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          )}

          {method === "paypal" && (
            <div className="p-4 rounded-lg bg-blue-50 text-center text-sm text-blue-700">
              You will be redirected to PayPal to complete your payment.
            </div>
          )}

          {method === "bank_transfer" && (
            <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
              <p className="font-medium">Bank Transfer Details:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Bank: Astro Tarot Bank</p>
                <p>Account: 1234 5678 9012 3456</p>
                <p>Reference: Your email address</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Please include your email as reference. Payment will be
                confirmed within 24 hours.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
