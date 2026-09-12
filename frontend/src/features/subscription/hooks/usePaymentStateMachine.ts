import { useState, useRef, useCallback, useEffect } from 'react';
import { subscriptionService } from '../../../api/services/subscription.service';

export type PaymentState =
  | 'idle'
  | 'creating_order'
  | 'awaiting_payment'
  | 'verifying'
  | 'polling_status'
  | 'success'
  | 'failed'
  | 'pending_recovery';

export interface PaymentStateMachineResult {
  state: PaymentState;
  isSubmitting: boolean;
  activeOrderId: string | null;
  errorMessage: string | null;
  recoveryMessage: string | null;
  setState: (state: PaymentState) => void;
  setError: (msg: string | null) => void;
  setCreatingOrder: () => void;
  setAwaitingPayment: (orderId: string) => void;
  setVerifying: () => void;
  setSuccess: () => void;
  setFailed: (errorMsg: string) => void;
  startRecoveryPolling: (orderId: string, onResolved?: (data: any) => void) => void;
  resetState: () => void;
}

export function usePaymentStateMachine(): PaymentStateMachineResult {
  const [state, setState] = useState<PaymentState>('idle');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const resetState = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
    setState('idle');
    setActiveOrderId(null);
    setErrorMessage(null);
    setRecoveryMessage(null);
  }, []);

  const setCreatingOrder = useCallback(() => {
    setState('creating_order');
    setErrorMessage(null);
    setRecoveryMessage(null);
  }, []);

  const setAwaitingPayment = useCallback((orderId: string) => {
    setActiveOrderId(orderId);
    setState('awaiting_payment');
  }, []);

  const setVerifying = useCallback(() => {
    setState('verifying');
  }, []);

  const setSuccess = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    setState('success');
  }, []);

  const setFailed = useCallback((errorMsg: string) => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    setState('failed');
    setErrorMessage(errorMsg);
  }, []);

  const setError = useCallback((msg: string | null) => {
    setErrorMessage(msg);
  }, []);

  /**
   * Automatic background polling recovery for tab drops, UPI delays, and webhook reconciliation
   */
  const startRecoveryPolling = useCallback((orderId: string, onResolved?: (data: any) => void) => {
    if (!orderId) return;

    setActiveOrderId(orderId);
    setState('polling_status');
    setRecoveryMessage('Reconciling payment status with banking network...');
    pollCountRef.current = 0;

    const maxAttempts = 10; // 10 attempts * 3s = 30 seconds
    const pollInterval = 3000;

    const poll = async () => {
      if (!isMountedRef.current) return;

      pollCountRef.current += 1;
      try {
        const statusRes = await subscriptionService.getPaymentStatus(orderId);
        const dataObj = statusRes?.data || statusRes || {};
        const rawStatus = (dataObj?.status || '').toString().toUpperCase();
        const subscriptionActive = Boolean(
          dataObj?.subscriptionActive ||
          ['SUCCESS', 'PAID', 'COMPLETED', 'ACTIVE'].includes(rawStatus)
        );

        console.log(`📡 [SuviX Payment Recovery] Poll attempt ${pollCountRef.current}/${maxAttempts} -> status: "${rawStatus}", active: ${subscriptionActive}`);

        if (subscriptionActive) {
          if (isMountedRef.current) {
            setState('success');
            setRecoveryMessage(null);
            if (onResolved) onResolved(dataObj);
          }
          return;
        }

        if (rawStatus === 'FAILED' || rawStatus === 'CANCELLED') {
          if (isMountedRef.current) {
            setState('failed');
            setErrorMessage(dataObj?.message || 'Payment failed or was declined by your bank.');
            setRecoveryMessage(null);
          }
          return;
        }

        // If still pending/created and within timeout window, keep polling
        if (pollCountRef.current < maxAttempts) {
          setRecoveryMessage(`Verifying confirmation with bank... (Attempt ${pollCountRef.current}/${maxAttempts})`);
          pollTimerRef.current = setTimeout(poll, pollInterval);
        } else {
          // Timeout after 30 seconds
          if (isMountedRef.current) {
            setState('pending_recovery');
            setRecoveryMessage(
              'Payment is taking longer than usual to confirm. If your account was debited, your subscription will activate automatically within a few minutes.'
            );
          }
        }
      } catch {
        if (pollCountRef.current < maxAttempts) {
          pollTimerRef.current = setTimeout(poll, pollInterval);
        } else {
          if (isMountedRef.current) {
            setState('pending_recovery');
            setRecoveryMessage(
              'We are still awaiting confirmation from your payment provider. If debited, your plan will activate shortly.'
            );
          }
        }
      }
    };

    poll();
  }, []);

  const isSubmitting =
    state === 'creating_order' ||
    state === 'awaiting_payment' ||
    state === 'verifying' ||
    state === 'polling_status';

  return {
    state,
    isSubmitting,
    activeOrderId,
    errorMessage,
    recoveryMessage,
    setState,
    setError,
    setCreatingOrder,
    setAwaitingPayment,
    setVerifying,
    setSuccess,
    setFailed,
    startRecoveryPolling,
    resetState,
  };
}
