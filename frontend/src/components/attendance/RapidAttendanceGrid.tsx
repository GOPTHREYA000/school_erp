'use client'

import React, { useState, useEffect } from 'react';
import { Check, X, User } from 'lucide-react';

interface Student {
  id: string;
  rollNumber: number;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'NONE';
}

export default function RapidAttendanceGrid() {
  const [students, setStudents] = useState<Student[]>([
    { id: '1', rollNumber: 1, name: 'Aarav Sharma', status: 'NONE' },
    { id: '2', rollNumber: 2, name: 'Aarohi Patel', status: 'NONE' },
    { id: '3', rollNumber: 3, name: 'Bhavya Reddy', status: 'NONE' },
    { id: '4', rollNumber: 4, name: 'Chaitanya Kumar', status: 'NONE' },
    { id: '5', rollNumber: 5, name: 'Dhruv Singh', status: 'NONE' },
  ]);

  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
  };

  const updateStatus = (index: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setStudents(prev => {
      const newStudents = [...prev];
      newStudents[index].status = status;
      return newStudents;
    });
    
    // Auto-advance
    if (index < students.length - 1) {
      setFocusedIndex(index + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is inside an input elsewhere
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, students.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key.toLowerCase() === 'p') {
        updateStatus(focusedIndex, 'PRESENT');
      } else if (e.key.toLowerCase() === 'a') {
        updateStatus(focusedIndex, 'ABSENT');
      } else if (e.key.toLowerCase() === 'l') {
        updateStatus(focusedIndex, 'LATE');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, students.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Class 10A Attendance</h2>
          <p className="text-sm text-gray-500">Press 'P' for Present, 'A' for Absent, 'L' for Late.</p>
        </div>
        <button 
          onClick={markAllPresent}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Mark All Present
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-medium w-20">Roll No</th>
              <th className="p-4 font-medium">Student Name</th>
              <th className="p-4 font-medium text-center">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr 
                key={student.id} 
                className={`border-b border-gray-100 transition-colors cursor-pointer ${
                  focusedIndex === idx ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setFocusedIndex(idx)}
              >
                <td className="p-4 text-gray-500 font-medium">
                  {student.rollNumber.toString().padStart(2, '0')}
                </td>
                <td className="p-4 flex items-center space-x-3 text-gray-800 font-medium">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span>{student.name}</span>
                </td>
                <td className="p-4 text-center">
                  {student.status === 'PRESENT' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Present
                    </span>
                  )}
                  {student.status === 'ABSENT' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Absent
                    </span>
                  )}
                  {student.status === 'LATE' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Late
                    </span>
                  )}
                  {student.status === 'NONE' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      --
                    </span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); updateStatus(idx, 'PRESENT'); }}
                    className="p-1 rounded-md text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all"
                    title="Present (P)"
                   >
                     <Check size={18} />
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); updateStatus(idx, 'ABSENT'); }}
                    className="p-1 rounded-md text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                    title="Absent (A)"
                   >
                     <X size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-sm">
          Submit Attendance
        </button>
      </div>
    </div>
  );
}
