"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/axios';

const schema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setMessage('');
    setError('');
    try {
      const res = await api.post('auth/password/reset/', { email: data.email });
      setMessage(res.data?.message || 'Check your email for reset instructions.');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429) {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.response?.data?.detail || 'Something went wrong. Try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Reset password</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your account email. If it exists, we will send reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {message && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                {...register('email')}
                className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
