'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsChartsProps {
  data: {
    barangayData: Array<{ name: string; count: number }>
    categoryData: Array<{ name: string; value: number }>
    funnelData: Array<{ name: string; count: number; percentage: number }>
  }
}

const COLORS = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Barangay Conversion Chart */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-md font-bold mb-4 text-white">Qualified Leads by Barangay</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.barangayData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
              />
              <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]}>
                {data.barangayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Categories Pie Chart */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-md font-bold mb-4 text-white">Opportunities by Category</h3>
        <div className="h-80 w-full flex flex-col md:flex-row items-center justify-between">
          <div className="h-full w-full md:w-3/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#121214', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-2/5 flex flex-col gap-3 justify-center">
            {data.categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-xs text-zinc-300 font-semibold">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel Table & Metrics */}
      <div className="glass rounded-xl p-6 lg:col-span-2">
        <h3 className="text-md font-bold mb-4 text-white">Outreach Performance Funnel</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {data.funnelData.map((step, index) => (
            <div key={step.name} className="relative bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-lg text-center overflow-hidden">
              {/* Background index glow */}
              <span className="absolute bottom-[-15px] right-[-5px] text-8xl font-black text-zinc-800/20 select-none">
                {index + 1}
              </span>
              
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{step.name}</h4>
              <p className="text-3xl font-black text-white">{step.count}</p>
              
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${step.percentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-2 font-semibold">{step.percentage}% Conversion</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  )
}
