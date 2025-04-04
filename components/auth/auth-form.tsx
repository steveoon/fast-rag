'use client';

import { FormMessage, type Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight } from 'lucide-react';
import React from 'react';

export type AuthField = {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  extraElement?: React.ReactNode;
  disabled?: boolean;
};

export type FormActionType = (formData: FormData) => void | Promise<void>;

export type AuthFormProps = {
  title: string;
  description?: React.ReactNode;
  fields: AuthField[];
  submitText: string;
  submitPendingText: string;
  formAction: FormActionType;
  message?: Message;
  footer?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
};

export function AuthForm({
  title,
  description,
  fields,
  submitText,
  submitPendingText,
  formAction,
  message,
  footer,
  className = '',
  icon = <ArrowRight className="ml-2 h-4 w-4" />,
}: AuthFormProps) {
  const [messageElement, isFormDisabled] = message ? FormMessage({ message }) : [null, false];

  return (
    <div
      className={`relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 p-8 w-full max-w-md mx-auto ${className}`}
    >
      <form action={formAction} className="flex flex-col">
        <h1 className="text-3xl font-bold mb-2 text-indigo-900 dark:text-white">{title}</h1>
        <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400 mb-6"></div>

        {description && (
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-8">{description}</p>
        )}

        <div className="flex flex-col gap-4">
          {fields.map(field => (
            <div key={field.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor={field.name} className="text-indigo-800 dark:text-indigo-300">
                  {field.label}
                </Label>
                {field.extraElement}
              </div>
              <Input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                minLength={field.minLength}
                disabled={field.disabled || isFormDisabled}
                className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/80 dark:bg-gray-800/80"
              />
            </div>
          ))}

          <SubmitButton
            pendingText={submitPendingText}
            disabled={isFormDisabled}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-medium py-2 rounded-md flex items-center justify-center"
          >
            {submitText} {icon}
          </SubmitButton>

          {messageElement}
        </div>
      </form>

      {footer && (
        <div className="mt-8 pt-6 border-t border-indigo-100 dark:border-indigo-800">{footer}</div>
      )}
    </div>
  );
}
