import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { exportDataAsJson, importDataFromJson, resetToSampleData } from '../../utils/storage';
import { Download, Upload, RotateCcw, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExport = () => {
    exportDataAsJson();
    showStatus('데이터 백업 파일이 다운로드되었습니다.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataFromJson(content);
      if (success) {
        showStatus('데이터가 성공적으로 복원되었습니다!');
        onDataReload();
      } else {
        alert('올바르지 않은 JSON 파일 형식입니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetSample = () => {
    if (confirm('샘플 루틴과 지난 기록으로 초기화하시겠습니까? 현재 데이터가 덮어씌워집니다.')) {
      resetToSampleData();
      showStatus('샘플 데이터로 복원되었습니다.');
      onDataReload();
    }
  };

  const handleClearAll = () => {
    if (confirm('정말로 모든 루틴과 기록을 영구 삭제하시겠습니까?')) {
      localStorage.clear();
      showStatus('모든 데이터가 초기화되었습니다.');
      onDataReload();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="데이터 및 백업 설정">
      <div className="space-y-4">
        {/* Status notification */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
            <Check size={14} className="text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Local Storage Info Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-600">
              <strong className="text-neutral-800 block mb-0.5">
                완전한 무료 & 개인정보 보호
              </strong>
              루틴 데이터는 외부 서버에 전송되지 않고 브라우저(LocalStorage)에 안전하게 저장됩니다.
              기기를 변경하거나 백업할 땐 아래의 백업 다운로드를 이용하세요.
            </div>
          </div>
        </div>

        {/* Action list */}
        <div className="space-y-2">
          {/* Mobile App Install Guide */}
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📱</span>
              <h4 className="text-xs font-bold text-emerald-900">스마트폰 앱으로 설치하는 법</h4>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-relaxed">
              브라우저 상단 우측 <strong>메뉴 (⋮ 또는 ≡)</strong>를 누른 뒤, <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 누르시면 스마트폰 바탕화면에 정식 앱 아이콘이 바로 설치됩니다!
            </p>
          </div>

          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition text-left"
          >

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Download size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-800">데이터 백업 (JSON 다운로드)</h4>
                <p className="text-[11px] text-neutral-400">루틴, 실천 기록, 일기 전체를 백업합니다</p>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">내보내기</span>
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Upload size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-800">데이터 복원 (JSON 파일 불러오기)</h4>
                <p className="text-[11px] text-neutral-400">백업해둔 JSON 파일을 업로드하여 복원합니다</p>
              </div>
            </div>
            <span className="text-xs text-indigo-600 font-semibold">불러오기</span>
          </button>

          {/* Reset to Sample */}
          <button
            onClick={handleResetSample}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <RotateCcw size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-800">샘플 데이터로 채우기</h4>
                <p className="text-[11px] text-neutral-400">기본 추천 루틴과 5일치 샘플 기록을 불러옵니다</p>
              </div>
            </div>
            <span className="text-xs text-amber-700 font-semibold">적용</span>
          </button>

          {/* Clear all */}
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-100 hover:bg-rose-50/50 transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-600">전체 데이터 초기화</h4>
                <p className="text-[11px] text-neutral-400">모든 루틴과 기록을 비우고 새로 시작합니다</p>
              </div>
            </div>
            <span className="text-xs text-rose-600 font-semibold">초기화</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};
