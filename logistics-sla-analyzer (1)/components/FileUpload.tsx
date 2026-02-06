
import React from 'react';
import { Upload, FileCheck } from 'lucide-react';

interface Props {
  label: string;
  file: File | null;
  onUpload: (f: File) => void;
  accept?: string;
}

export const FileUpload: React.FC<Props> = ({ label, file, onUpload, accept = ".xlsx, .csv" }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400 bg-white'}`}>
      {file ? (
        <FileCheck className="w-10 h-10 text-green-500 mb-2" />
      ) : (
        <Upload className="w-10 h-10 text-gray-400 mb-2" />
      )}
      <p className="font-medium text-gray-700 text-sm mb-1">{label}</p>
      {file ? (
        <span className="text-xs text-green-700 font-semibold">{file.name}</span>
      ) : (
        <label className="cursor-pointer">
          <span className="text-xs text-blue-600 hover:underline">Seleccionar archivo</span>
          <input type="file" className="hidden" accept={accept} onChange={handleChange} />
        </label>
      )}
    </div>
  );
};
