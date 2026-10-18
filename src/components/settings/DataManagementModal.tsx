import React, { useRef, useState } from 'react';
import { exportDataAsJson, importDataFromJson, resetToSampleData } from '../../utils/storage';
import { Download, Upload, RotateCcw, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = () => {
    exportDataAsJson();
    showStatus(t.dataModal.exportSuccess);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataFromJson(content);
      if (success) {
        showStatus(t.dataModal.importSuccess);
        onDataReload();
      } else {
        alert('올바르지 않은 JSON 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSample = () => {
    if (confirm(t.dataModal.confirmSample)) {
      resetToSampleData();
      showStatus(t.dataModal.sampleSuccess);
      onDataReload();
    }
  };

  const handleClearAll = () => {
    if (confirm(t.dataModal.confirmClear)) {
      localStorage.clear();
      showStatus(t.dataModal.clearSuccess);
      onDataReload();
    }
  };

  return (
    /* Full Page Layout (User Request 3: 팝업X 풀페이지 형태) */
    <div className="fixed inset-0 z-50 bg-[#f4f7fc] flex flex-col overflow-y-auto select-none animate-fadeIn">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-100/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-slate-700 hover:text-blue-700 transition font-bold text-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            <span>{t.common.back}</span>
          </button>
          <h2 className="text-base font-black text-[#0f2e7a]">
            {t.dataModal.title}
          </h2>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-5 flex flex-col gap-4">
        {/* Status notification toast */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
            <Check size={20} className="text-emerald-600 shrink-0" />
            <span className="break-keep">{statusMessage}</span>
          </div>
        )}

        {/* Privacy & Security Note */}
        <div className="p-4 rounded-2xl bg-white border border-blue-100/90 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <p className="text-xs font-semibold text-slate-700 leading-snug break-keep">
            {t.dataModal.securityBadge}
          </p>
        </div>

        {/* Action List */}
        <div className="space-y-3">
          {/* 1. Export JSON */}
          <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-all shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center shrink-0">
                <Download size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 break-keep">
                  {t.dataModal.exportTitle}
                </h4>
                <p className="text-xs text-slate-500 break-keep mt-0.5">
                  {t.dataModal.exportDesc}
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
            >
              {t.dataModal.exportBtn}
            </button>
          </div>

          {/* 2. Import JSON */}
          <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-all shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center shrink-0">
                <Upload size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 break-keep">
                  {t.dataModal.importTitle}
                </h4>
                <p className="text-xs text-slate-500 break-keep mt-0.5">
                  {t.dataModal.importDesc}
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-blue-700 text-white font-bold text-xs shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
            >
              {t.dataModal.importBtn}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* 3. Sample Data */}
          <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-all shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                <RotateCcw size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-900 break-keep">
                  {t.dataModal.sampleTitle}
                </h4>
                <p className="text-xs text-slate-500 break-keep mt-0.5">
                  {t.dataModal.sampleDesc}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetSample}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
            >
              {t.dataModal.sampleBtn}
            </button>
          </div>

          {/* 4. Reset All Data */}
          <div className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-rose-900 break-keep">
                  {t.dataModal.clearTitle}
                </h4>
                <p className="text-xs text-rose-700/80 break-keep mt-0.5">
                  {t.dataModal.clearDesc}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
            >
              {t.dataModal.clearBtn}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
