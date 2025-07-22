"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stripeService } from '@/services/stripeService';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    amount: number;
    patientName: string;
    dueDate: string;
  };
  patientId: string;
  onPaymentSuccess?: () => void;
}

// Payment Form Component (inside Elements wrapper)
const PaymentForm: React.FC<{
  invoice: PaymentModalProps['invoice'];
  patientId: string;
  onSuccess: () => void;
  onClose: () => void;
}> = ({ invoice, patientId, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Stripe has not loaded properly. Please refresh and try again.",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        variant: "destructive",
        title: "Payment Error", 
        description: "Card element not found.",
      });
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment intent via our service
      const paymentIntent = await stripeService.createPaymentIntent(
        invoice.id,
        null, // Will be created if needed
        invoice.amount
      );

      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: invoice.patientName,
            },
          },
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        setPaymentStatus('failed');
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
        });
      } else {
        setPaymentStatus('succeeded');
        toast({
          title: "Payment Successful",
          description: `Payment of $${invoice.amount.toFixed(2)} has been processed successfully.`,
        });
        
        // Call success callback after a brief delay to show success state
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "An unexpected error occurred while processing your payment.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (paymentStatus === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
        <p className="text-sm text-gray-600">
          Your payment of ${invoice.amount.toFixed(2)} has been processed.
        </p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Payment Failed</h3>
        <p className="text-sm text-gray-600 mb-4">
          We couldn't process your payment. Please try again.
        </p>
        <Button onClick={() => setPaymentStatus('idle')} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Card Information</label>
        <div className="p-3 border rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-md">
        <span className="font-medium">Total Amount:</span>
        <span className="text-xl font-bold">${invoice.amount.toFixed(2)}</span>
      </div>

      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || processing}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${invoice.amount.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// Main Payment Modal Component
export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  patientId,
  onPaymentSuccess
}) => {
  const handleSuccess = () => {
    onPaymentSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment for Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-800">Invoice #{invoice.id.substring(0, 8)}</span>
              <span className="text-sm text-blue-600">Due: {invoice.dueDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Patient: {invoice.patientName}</span>
              <span className="text-lg font-bold text-blue-900">${invoice.amount.toFixed(2)}</span>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm
              invoice={invoice}
              patientId={patientId}
              onSuccess={handleSuccess}
              onClose={onClose}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;