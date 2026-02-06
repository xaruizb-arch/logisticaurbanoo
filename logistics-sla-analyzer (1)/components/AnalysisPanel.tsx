
import React from 'react';
import { MasterRecord } from '../types';
import { FileText, Lightbulb, Clock, ArrowRight } from 'lucide-react';

interface Props {
  data: MasterRecord[];
}

export const AnalysisPanel: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <FileText className="text-blue-600" />
        <h2 className="text-lg font-bold">Hallazgos Operativos</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-bold text-blue-800 flex items-center gap-1"><Lightbulb size={14}/> Recomendación</h4>
          <p className="text-xs text-blue-700 mt-1">Se detectaron pedidos sin movimiento en Urbano. Sugerimos descargar el reporte de Estancados para reclamo masivo.</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
          <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1"><Clock size={14}/> Eficiencia</h4>
          <p className="text-xs text-orange-700 mt-1">El tiempo de preparación interna es óptimo, pero el correo presenta demoras en el arribo a sucursal destino.</p>
        </div>
      </div>
    </div>
  );
};
