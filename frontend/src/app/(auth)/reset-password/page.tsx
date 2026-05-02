"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/axios';

const schema = z.object({
  new_password: z.string().min(8, { message: 'At least 8 characters' }),
  new_password_confirm: z.string().min(8, { message: 'Confirm your password' }),
}).refine((d) => d.new_password === d.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
});

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setMessage('');
    setError('');
    if (!uid || !token) {
      setError('Invalid reset link. Request a new reset from the login page.');
      return;
    }
    try {
      const res = await api.post('auth/password/reset/confirm/', {
        uid,
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      setMessage(res.data?.message || 'Password updated. You can sign in now.');
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (Array.isArray(detail)) {
        setError(detail.join(' '));
      } else {
        setError(detail || 'Reset failed. The link may have expired—request a new one.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">Choose a new password</h2>
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
              <label className="block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                {...register('new_password')}
                className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                autoComplete="new-password"
              />
              {errors.new_password && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                type="password"
                {...register('new_password_confirm')}
                className="mt-2 appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                autoComplete="new-password"
              />
              {errors.new_password_confirm && (
                <p className="mt-1 text-sm text-red-600">{errors.new_password_confirm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Update password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
