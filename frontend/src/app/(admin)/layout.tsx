"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, Calendar, Receipt, TrendingDown, TrendingUp, PenTool, Megaphone, Shield, LogOut } from 'lucide-react';
import api from '@/lib/axios';

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Users', icon: Shield, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/teachers', label: 'Teachers', icon: Users, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
  { href: '/classes', label: 'Classes', icon: BookOpen },
  { href: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/timetable', label: 'Timetable', icon: Calendar },
  { href: '/fees', label: 'Fees', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/homework', label: 'Homework', icon: PenTool },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/reports/financial', label: 'Financial Reports', icon: TrendingUp, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
  { href: '/reports/fees', label: 'Fee Reports', icon: Receipt, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'ACCOUNTANT'] },
  { href: '/reports/attendance', label: 'Attendance Reports', icon: ClipboardCheck, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'TEACHER'] },
  { href: '/setup', label: 'Setup', icon: Shield, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get('auth/me/')
      .then(res => setUser(res.data.data))
      .catch(err => console.error("Failed to load user profile in layout", err));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('auth/logout/');
      router.push('/login');
    } catch (err) {
      console.error("Logout failed", err);
      // Force redirect anyway
      router.push('/login');
    }
  };

  const navItems = allNavItems.filter(item => {
    if (item.roles) {
      return item.roles.includes(user?.role);
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10 overflow-hidden">
          {user?.tenant_logo ? (
            <div className="flex items-center justify-center w-full">
              <img src={user.tenant_logo} alt="Logo" className="h-10 w-auto object-contain" />
            </div>
          ) : (
            <h1 className="text-xl font-bold font-sans tracking-tight truncate">{user?.tenant_name || 'ScoolERP'}</h1>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-3">
            <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0 group hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold group-hover:ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 transition-all">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0 text-sm truncate">
                <p className="font-medium text-white truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.role?.replace('_', ' ') || 'Loading...'}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors ml-auto"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-6 justify-between flex-shrink-0">
          <div className="font-semibold text-lg capitalize">
            {pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

