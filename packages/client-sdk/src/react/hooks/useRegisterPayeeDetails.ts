import { useState, useCallback } from 'react';
import type { Zkp2pClient } from '../../client/Zkp2pClient';
import type { RegisterPayeeDetailsRequest, RegisterPayeeDetailsResponse, ValidatePayeeDetailsResponse } from '../../types';

export interface UseRegisterPayeeDetailsOptions {
  client: Zkp2pClient | null;
  onSuccess?: (result: RegisterPayeeDetailsResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for registering payee details to obtain a hashedOnchainId (payeeHash)
 *
 * @example
 * const { registerPayeeDetails, response, isLoading, error } = useRegisterPayeeDetails({ client });
 * const res = await registerPayeeDetails({ processorName: 'mercadopago', depositData: { identifier: 'alice' } });
 * const payeeHash = res?.responseObject.hashedOnchainId;
 */
export function useRegisterPayeeDetails({ client, onSuccess, onError }: UseRegisterPayeeDetailsOptions) {
  const [response, setResponse] = useState<RegisterPayeeDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const registerPayeeDetails = useCallback(
    async (params: RegisterPayeeDetailsRequest) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.registerPayeeDetails(params);
        setResponse(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    registerPayeeDetails,
    response,
    isLoading,
    error,
    reset,
  };
}

export interface UseValidatePayeeDetailsOptions {
  client: Zkp2pClient | null;
  onSuccess?: (result: ValidatePayeeDetailsResponse) => void;
  onError?: (error: Error) => void;
}

export function useValidatePayeeDetails({ client, onSuccess, onError }: UseValidatePayeeDetailsOptions) {
  const [response, setResponse] = useState<ValidatePayeeDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const validatePayeeDetails = useCallback(
    async (params: { processorName: string; depositData: Record<string, string> }) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await client.validatePayeeDetails(params);
        setResponse(res);
        onSuccess?.(res);
        return res;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { validatePayeeDetails, response, isLoading, error, reset };
}

export interface UsePayeeRegistrationOptions {
  client: Zkp2pClient | null;
  onSuccess?: (result: { isValid: boolean; validation: ValidatePayeeDetailsResponse; registration?: RegisterPayeeDetailsResponse }) => void;
  onError?: (error: Error) => void;
}

export function usePayeeRegistration({ client, onSuccess, onError }: UsePayeeRegistrationOptions) {
  const [result, setResult] = useState<{ isValid: boolean; validation: ValidatePayeeDetailsResponse; registration?: RegisterPayeeDetailsResponse } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const validateAndRegister = useCallback(
    async (params: RegisterPayeeDetailsRequest) => {
      if (!client) {
        const err = new Error('Client not initialized');
        setError(err);
        onError?.(err);
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const res = await client.validateAndRegisterPayeeDetails(params);
        setResult(res);
        onSuccess?.(res);
        return res;
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { validateAndRegister, result, isLoading, error, reset };
}
