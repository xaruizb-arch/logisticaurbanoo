
import React from 'react';
import { HistoryRecord } from '../types';
import { Clock, Trash2 } from 'lucide-react';

interface Props {
  history: HistoryRecord[];
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
}

export const HistoryPanel: React.FC<Props> = ({ history, onClearHistory, onDeleteRecord }) => {
  if (history.length === 0) return <div className="p-8 text-center text-gray-500">No hay reportes guardados.</div>;
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-bold">Historial de Reportes</h3>
        <button onClick={onClearHistory} className="text-xs text-red-600">Limpiar todo</button>
      </div>
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Fecha</th>
            <th className="px-4 py-2 text-left">Total</th>
            <th className="px-4 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {history.map(h => (
            <tr key={h.id} className="border-t">
              <td className="px-4 py-2">{new Date(h.savedAt).toLocaleString()}</td>
              <td className="px-4 py-2">{h.stats.total}</td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => onDeleteRecord(h.id)} className="text-red-500"><Trash2 size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
