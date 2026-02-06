
import React, { useState, useMemo } from 'react';
import { MasterRecord, LogisticsStatus } from '../types';
import { Download, User, X, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  data: MasterRecord[];
  title: string;
}

export const DataTable: React.FC<Props> = ({ data, title }) => {
  const [filters, setFilters] = useState({ tracking: '', client: '' });
  
  const processedData = useMemo(() => {
    return data.filter(row => {
      const matchTracking = row.id.toLowerCase().includes(filters.tracking.toLowerCase());
      const matchClient = filters.client === '' || row.client.toLowerCase().includes(filters.client.toLowerCase());
      return matchTracking && matchClient;
    });
  }, [data, filters]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
          <Download size={14} /> Exportar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Tracking</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedData.slice(0, 50).map(row => (
              <tr key={row.id} className="text-xs hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{row.id}</td>
                <td className="px-4 py-2">{row.client}</td>
                <td className="px-4 py-2">{row.status}</td>
                <td className="px-4 py-2">{row.slaRealDias}d / {row.slaObjetivoDias}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
