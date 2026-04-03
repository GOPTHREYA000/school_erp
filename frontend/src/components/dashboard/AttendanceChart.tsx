"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  class_name: string;
  percentage: number;
}

interface AttendanceChartProps {
  data: DataPoint[];
  title: string;
}

export default function AttendanceChart({ data, title }: AttendanceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full"
    >
      <h3 className="text-gray-900 text-lg font-bold mb-6">{title}</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis 
              dataKey="class_name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 500 }}
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(val: any) => [`${val || 0}%`, 'Attendance']}
            />
            <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.percentage > 90 ? '#10b981' : entry.percentage > 75 ? '#3b82f6' : '#f59e0b'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
