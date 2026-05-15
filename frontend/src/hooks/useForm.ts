import { useState } from 'react';

import z from 'zod';

import { useFeedback } from '@hooks/utilHooks';

import type { FakeEvent } from '@mytypes/utilTypes';

export const useForm = <T>(
  schema: z.ZodSchema<T>,
  initialValues: T,
  clearOnSuccess: boolean = false,
) => {
  const [params, setParams] = useState(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useFeedback();
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setParam = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | FakeEvent) => {
    const name: keyof T = e.target.name as keyof T;
    const value = e.target.value;

    setParams((params) => ({ ...params, [name]: value }));
    if (errors[name])
      setErrors((errs) => {
        const { [name]: _, ...rest } = errs;
        return rest as Partial<Record<keyof T, string>>;
      });
  };

  const setField = (name: keyof T) => ({
    name,
    value: params[name] as any,
    onChange: setParam,
    error: errors[name],
  });

  const validate = () => {
    const validation = schema.safeParse(params);

    if (validation.success) {
      setErrors({});
    } else {
      setErrors(
        validation.error.issues.reduce(
          (prev, cur) => {
            prev[cur.path[0] as keyof T] = cur.message;
            return prev;
          },
          {} as Partial<Record<keyof T, string>>,
        ),
      );
    }
    return validation.success;
  };

  const handleSubmit = (submit: (params: T) => void) => (e: React.SubmitEvent) => {
    e.preventDefault();
    setFeedback();
    if (validate()) {
      setIsLoading(true);
      submit(params);
    }
  };

  const setSuccess = ({ message }: { message: string }) => {
    setIsLoading(false);
    setFeedback(message, 'ok');
    if (clearOnSuccess) setParams(initialValues);
  };

  const setFailure = ({
    message,
    errors: apiErrors,
  }: {
    message: string;
    errors: Partial<Record<keyof T, string>>;
  }) => {
    setIsLoading(false);
    if (apiErrors) setErrors(apiErrors);
    else setFeedback(message, 'fail');
  };

  const clearForm = (params?: T) => {
    setIsLoading(false);
    setFeedback();
    setErrors({});
    setParams(params ?? initialValues);
  };

  return {
    setField,
    handleSubmit,
    isLoading,
    setIsLoading,
    feedback,
    errors,
    setSuccess,
    setFailure,
    params,
    setParam,
    setParams,
    clearForm,
  };
};
