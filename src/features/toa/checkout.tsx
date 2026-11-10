"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api/client";
import type { CheckoutOrder, ToaInvoice } from "@/lib/api/toa";
import { formatCurrency } from "@/lib/domain/stages";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("could not load the payment window"));
    document.body.appendChild(script);
  });
}

// Starts a gateway order for an invoice and confirms it on the server (the browser result alone is never trusted).
export function PayButton({ invoice }: { invoice: ToaInvoice }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [mockOrder, setMockOrder] = useState<CheckoutOrder | null>(null);

  const refresh = () => queryClient.invalidateQueries();
  const verify = async (body: { orderId: string; paymentId: string; signature: string }) => {
    try {
      await api.post("/toa/tp/payments/verify", body);
      toast.success("Payment received, the receipt is ready");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      await refresh();
    }
  };
  const failed = async (orderId: string, cancelled: boolean, reason?: string) => {
    await api.put(`/toa/tp/payments/${orderId}/failed`, { cancelled, reason }).catch(() => {});
    toast.message(cancelled ? "Payment cancelled" : `Payment failed${reason ? `: ${reason}` : ""}`);
    await refresh();
  };

  const start = async () => {
    setBusy(true);
    try {
      const { data } = await api.post<{ data: CheckoutOrder }>(`/toa/tp/invoices/${invoice._id}/pay`);
      const order = data.data;
      if (order.gateway === "mock") {
        setMockOrder(order);
        return;
      }
      await loadRazorpay();
      const checkout = new window.Razorpay!({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: "#111111" },
        handler: (response: RazorpayResponse) => verify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }),
        modal: { ondismiss: () => failed(order.orderId, true) },
      });
      checkout.on("payment.failed", (response) => failed(order.orderId, false, response.error?.description));
      checkout.open();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const mockPay = async () => {
    if (!mockOrder) return;
    setBusy(true);
    try {
      const { data } = await api.post<{ data: { orderId: string; paymentId: string; signature: string } }>(`/toa/tp/payments/${mockOrder.orderId}/mock-checkout`);
      await verify(data.data);
      setMockOrder(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" onClick={start} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <CreditCard />}
        Pay {formatCurrency(invoice.total)}
      </Button>
      <Dialog open={Boolean(mockOrder)} onOpenChange={(open) => !open && mockOrder && (failed(mockOrder.orderId, true), setMockOrder(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="size-5" />
              Test payment gateway
            </DialogTitle>
            <DialogDescription>
              Online payment is not connected to Razorpay yet, so this test window stands in for it. No real money moves. Amount {formatCurrency((mockOrder?.amount ?? 0) / 100)} · {mockOrder?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                if (mockOrder) failed(mockOrder.orderId, false, "test failure");
                setMockOrder(null);
              }}
            >
              Simulate a failure
            </Button>
            <Button onClick={mockPay} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Simulate a successful payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
