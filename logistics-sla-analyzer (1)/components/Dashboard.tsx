
import React from 'react';
import { MasterRecord, LogisticsStatus, RiskLevel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Package, Ghost, Activity, TrendingUp, HelpCircle, ShieldAlert, Siren } from 'lucide-react';

interface Props {
  data: MasterRecord[];
}

const PIE_COLORS = {
  Safe: '#10B981',   
  Warning: '#F59E0B', 
  Critical: '#EF4444' 
};

export const Dashboard: React.FC<Props> = ({ data }) => {
  const totalOrders = data.length;
  const deliveredOrders = data.filter(r => r.isEntregado).length;
  const performanceRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : "0";
  
  const criticalCount = data.filter(r => r.riskLevel === RiskLevel.CRITICAL && !r.isEntregado && !r.isDevuelto).length;
  const mediumCount = data.filter(r => r.riskLevel === RiskLevel.MEDIUM && !r.isEntregado && !r.isDevuelto).length;
  const lowCount = data.filter(r => r.riskLevel === RiskLevel.LOW && !r.isEntregado && !r.isDevuelto).length;
  
  const riskData = [
    { name: 'En Fecha', value: lowCount, color: PIE_COLORS.Safe },
    { name: 'Riesgo Medio', value: mediumCount, color: PIE_COLORS.Warning },
    { name: 'Crítico/Vencido', value: criticalCount, color: PIE_COLORS.Critical },
  ].filter(d => d.value > 0);

  const ghosts = data.filter(r => r.isGhost);
  const huerfanos = data.filter(r => r.isHuerfano);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 flex items-center justify-between">
          <div><p className="text-gray-500 text-sm font-medium uppercase">Total Procesados</p><p className="text-3xl font-bold text-gray-800">{totalOrders}</p></div>
          <Package className="text-blue-200 w-10 h-10" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500 flex items-center justify-between">
          <div><p className="text-gray-500 text-sm font-medium uppercase">Entregados</p><p className="text-3xl font-bold text-gray-800">{deliveredOrders}</p></div>
          <CheckCircle className="text-green-200 w-10 h-10" />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500 flex items-center justify-between">
          <div><p className="text-gray-500 text-sm font-medium uppercase">Performance Global</p><p className="text-3xl font-bold text-gray-800">{performanceRate}%</p></div>
          <TrendingUp className="text-purple-200 w-10 h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2"><Siren className="text-red-500 w-5 h-5" />Semáforo de Riesgo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {riskData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2"><ShieldAlert className="text-indigo-600" />Integridad</h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                <span className="text-sm font-medium text-indigo-900">Fantasmas (Solo Interno)</span>
                <span className="text-xl font-bold text-indigo-700">{ghosts.length}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-cyan-50 rounded">
                <span className="text-sm font-medium text-cyan-900">Huérfanos (Solo Urbano)</span>
                <span className="text-xl font-bold text-cyan-700">{huerfanos.length}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
