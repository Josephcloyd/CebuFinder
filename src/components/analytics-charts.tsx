'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'

interface AnalyticsChartsProps {
  data: {
    barangayData: Array<{ name: string; count: number }>
    categoryData: Array<{ name: string; value: number }>
    funnelData: Array<{ name: string; count: number; percentage: number }>
  }
}

const COLORS = ['#a855f7', '#6366f1', '#3b82f6', '#10b981', '#f59e0b']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/50 rounded-xl px-4 py-3 shadow-xl shadow-black/20">
        <p className="text-white font-bold text-xs mb-1">{label || payload[0]?.name}</p>
        <p className="text-purple-400 font-semibold text-sm">{payload[0]?.value} leads</p>
      </div>
    )
  }
  return null
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Barangay Conversion Chart */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Qualified Leads by Barangay</h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.barangayData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 39, 42, 0.5)" vertical={false} />
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168, 85, 247, 0.04)' }} />
              <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]}>
                {data.barangayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories Pie Chart */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500" />
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Opportunities by Category</h3>
        </div>
        <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between">
          <div className="h-full w-full md:w-3/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {data.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-2/5 flex flex-col gap-3 justify-center">
            {data.categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2.5 group">
                <span className="w-3 h-3 rounded-md" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <div>
                  <span className="text-xs text-zinc-300 font-semibold">{item.name}</span>
                  <span className="text-[10px] text-zinc-600 ml-1.5">({item.value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel Table & Metrics */}
      <div className="glass-card rounded-2xl p-6 lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500" />
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Outreach Performance Funnel</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-enter">
          {data.funnelData.map((step, index) => (
            <div key={step.name} className="relative bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-xl text-center overflow-hidden group hover:border-zinc-700/50 transition-all hover:bg-zinc-900/50">
              {/* Background index glow */}
              <span className="absolute bottom-[-15px] right-[-5px] text-8xl font-black text-zinc-800/10 select-none group-hover:text-zinc-800/20 transition-colors">
                {index + 1}
              </span>
              
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{step.name}</h4>
              <p className="text-3xl font-black text-white tracking-tight">{step.count}</p>
              
              <div className="w-full bg-zinc-800/60 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-700" 
                  style={{ width: `${step.percentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-bold">{step.percentage}% Conversion</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  )
}
