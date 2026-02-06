
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { AnalysisPanel } from './components/AnalysisPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { MasterRecord, LogisticsStatus, RiskLevel, HistoryRecord } from './types';
import { processLogisticsData } from './utils/businessLogic';
import { Truck, FileSpreadsheet, PlayCircle, DownloadCloud } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<{ internal: File | null; urbano: File | null; sla: File | null }>({
    internal: null,
    urbano: null,
    sla: null,
  });
  
  const [data, setData] = useState<MasterRecord[] | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'all' | 'history'>('dashboard');
  const [processing, setProcessing] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('logistics_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleUpload = (key: 'internal' | 'urbano' | 'sla') => (file: File) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const runAnalysis = async () => {
    if (!files.internal) { alert("Archivo interno requerido"); return; }
    setProcessing(true);
    try {
      const readExcel = (file: File | null): Promise<any[]> => {
        if (!file) return Promise.resolve([]);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, { type: 'array' });
            resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
          };
          reader.readAsArrayBuffer(file);
        });
      };

      const [internalJson, urbanoJson, slaJson] = await Promise.all([
        readExcel(files.internal), readExcel(files.urbano), readExcel(files.sla),
      ]);
      const processed = processLogisticsData(internalJson, urbanoJson, slaJson);
      setData(processed);
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
      alert("Error procesando archivos. Revisa la consola para más detalles.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-400" />
            <h1 className="text-xl font-bold">Torre de Control Logístico</h1>
          </div>
          <button className="text-xs bg-slate-800 p-2 rounded flex items-center gap-1">
            <DownloadCloud size={14} /> Plantillas
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {!data && activeTab !== 'history' ? (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileSpreadsheet size={20}/> Carga de Datos</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <FileUpload label="Interno" file={files.internal} onUpload={handleUpload('internal')} />
              <FileUpload label="Urbano" file={files.urbano} onUpload={handleUpload('urbano')} />
              <FileUpload label="SLA" file={files.sla} onUpload={handleUpload('sla')} />
            </div>
            <button 
              onClick={runAnalysis} 
              disabled={processing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 flex justify-center items-center gap-2"
            >
              {processing ? "Procesando..." : <><PlayCircle size={20}/> Iniciar Análisis</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'dashboard' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('all')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Datos</button>
              <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-bold ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Historial</button>
            </div>
            {activeTab === 'dashboard' && data && <div className="space-y-4"><Dashboard data={data} /><AnalysisPanel data={data} /></div>}
            {activeTab === 'all' && data && <DataTable title="Base Maestra" data={data} />}
            {activeTab === 'history' && <HistoryPanel history={history} onClearHistory={() => setHistory([])} onDeleteRecord={(id) => setHistory(history.filter(h => h.id !== id))} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
