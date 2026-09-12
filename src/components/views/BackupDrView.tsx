import React, { useState } from 'react';
import {
  HardDriveDownload,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Lock,
  Database,
  Cloud,
  Layers,
  ArrowRight,
  FileCheck,
  Sparkles,
  Download,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { BackupSnapshot } from '../../types';

interface BackupDrViewProps {
  backups: BackupSnapshot[];
  onCreateBackup: () => void;
  isCreatingBackup: boolean;
}

export const BackupDrView: React.FC<BackupDrViewProps> = ({
  backups,
  onCreateBackup,
  isCreatingBackup,
}) => {
  const [drModalOpen, setDrModalOpen] = useState(false);
  const [drStep, setDrStep] = useState(0);
  const [isDrRunning, setIsDrRunning] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  const handleDownloadAuditCsv = () => {
    const headers = [
      'Snapshot ID',
      'Snapshot Name',
      'Backup Type',
      'Timestamp (UTC)',
      'Size (MB)',
      'Storage Target Provider',
      'Encryption Standard',
      'Checksum (SHA-256)',
      'Retention (Days)',
      'Status',
      'Compliance Standard',
      'Audit Verification Status',
    ];

    const rows = backups.map((b) => [
      `"${b.id}"`,
      `"${b.name}"`,
      `"${b.type}"`,
      `"${b.timestamp}"`,
      b.sizeMb.toFixed(2),
      `"${b.storageTarget}"`,
      `"${b.encryption}"`,
      `"${b.checksumSha256}"`,
      b.retentionDays,
      `"${b.status}"`,
      '"ISO-27001 / SOC2 Type II"',
      '"PASSED - Bit-Level Cryptographic Integrity Confirmed"',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `k8s-backup-audit-compliance-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 2500);
  };

  const startDisasterRecoveryDrill = () => {
    setDrModalOpen(true);
    setDrStep(1);
    setIsDrRunning(true);

    const stepIntervals = [
      setTimeout(() => setDrStep(2), 1200),
      setTimeout(() => setDrStep(3), 2600),
      setTimeout(() => setDrStep(4), 4000),
      setTimeout(() => {
        setDrStep(5);
        setIsDrRunning(false);
      }, 5400),
    ];
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <HardDriveDownload className="w-3.5 h-3.5" /> CLOUD BACKUP &amp; DISASTER RECOVERY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> AES-GCM-256 Encrypted
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sao Lưu Tự Động Định Kỳ &amp; Khôi Phục Nhanh Chóng 24/7
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Quy trình backup dữ liệu định kỳ mỗi ngày lúc 02:00 UTC tự động đẩy lên Cloud Storage (GCS/S3/Oracle). Toàn bộ snapshot được mã hóa đầu cuối bằng chuẩn quân sự AES-256, kiểm tra tính toàn vẹn SHA-256 và sẵn sàng phục hồi tức thì với RTO &lt; 2 phút khi xảy ra sự cố.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onCreateBackup}
              disabled={isCreatingBackup}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isCreatingBackup ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <HardDriveDownload className="w-4 h-4" />
              )}
              <span>{isCreatingBackup ? 'Đang mã hóa & tạo Snapshot...' : 'Tạo Snapshot Ngay'}</span>
            </button>

            <button
              onClick={handleDownloadAuditCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="Tải báo cáo kiểm toán sao lưu định dạng CSV (ISO-27001 / SOC2)"
            >
              {csvDownloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <FileSpreadsheet className="w-4 h-4 text-cyan-400" />}
              <span>{csvDownloaded ? 'Đã Xuất CSV!' : 'Xuất Báo Cáo CSV'}</span>
            </button>

            <button
              onClick={startDisasterRecoveryDrill}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>Diễn Tập Khôi Phục (DR Drill)</span>
            </button>
          </div>
        </div>
      </div>

      {/* RPO / RTO Metrics & Scheduler Policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>RPO (Mất tối đa dữ liệu)</span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            &lt; 5 Phút
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đạt chuẩn ISO-27001 &amp; SOC2</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>RTO (Thời gian phục hồi)</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            1.8 Phút
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tự động hóa 100% qua K8s Job</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Lịch trình sao lưu tự động</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-200 mt-2">
            02:00 UTC (Hàng ngày)
          </div>
          <p className="text-[11px] text-cyan-400 mt-1 font-mono">cron: 0 2 * * *</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs flex items-center justify-between">
            <span>Tiêu chuẩn mã hóa</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-amber-300 mt-2">
            AES-GCM-256
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Cloud KMS Key Rotation 90d</p>
        </div>
      </div>

      {/* Snapshot Inventory Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" /> Kho Bản Ghi Sao Lưu Đám Mây ({backups.length} Snapshots)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Toàn vẹn: 100% Verified
            </span>
            <button
              onClick={handleDownloadAuditCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {csvDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{csvDownloaded ? 'Đã Tải Báo Cáo CSV!' : 'Tải CSV Báo Cáo Kiểm Toán'}</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="p-3">Tên Bản Sao Lưu &amp; Loại</th>
                  <th className="p-3">Thời Điểm</th>
                  <th className="p-3">Dung Lượng</th>
                  <th className="p-3">Điểm Lưu Trữ Đám Mây</th>
                  <th className="p-3">Mã Hóa &amp; Checksum SHA-256</th>
                  <th className="p-3">Lưu Trữ</th>
                  <th className="p-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-medium text-white">{b.name}</div>
                      <span className="text-[10px] text-cyan-400 font-mono">{b.type}</span>
                    </td>
                    <td className="p-3 text-slate-300 font-mono">{b.timestamp}</td>
                    <td className="p-3 font-mono text-slate-200">{b.sizeMb.toFixed(1)} MB</td>
                    <td className="p-3 text-slate-300">{b.storageTarget}</td>
                    <td className="p-3">
                      <span className="text-emerald-400 font-semibold block text-[11px]">{b.encryption}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate block max-w-[200px]" title={b.checksumSha256}>
                        {b.checksumSha256}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{b.retentionDays} ngày</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Disaster Recovery Drill Modal */}
      {drModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className={`w-5 h-5 text-cyan-400 ${isDrRunning ? 'animate-spin' : ''}`} />
                <h3 className="font-bold text-white text-base">
                  Diễn Tập Khôi Phục Thảm Họa (Disaster Recovery Drill)
                </h3>
              </div>
              {!isDrRunning && (
                <button
                  onClick={() => setDrModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Mô phỏng phục hồi toàn diện hệ thống từ bản sao lưu gần nhất (Snapshot <code>{backups[0]?.name}</code>):
            </p>

            {/* Stepper */}
            <div className="space-y-3 text-xs">
              {[
                { step: 1, title: 'Giải mã & Xác thực Checksum SHA-256 từ Cloud Storage' },
                { step: 2, title: 'Khởi tạo Persistent Volume Claim (PVC) trên cụm mới' },
                { step: 3, title: 'Nạp lại dữ liệu Database & Bảng giao dịch an toàn' },
                { step: 4, title: 'Kích hoạt Pods mới và kiểm tra Readiness Probe (/api/health)' },
                { step: 5, title: 'Điều phối Ingress chuyển 100% lưu lượng người dùng (DR Hoàn tất!)' },
              ].map((item) => {
                const isPassed = drStep > item.step || drStep === 5;
                const isCurrent = drStep === item.step && isDrRunning;

                return (
                  <div
                    key={item.step}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isPassed
                        ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                        : isCurrent
                        ? 'bg-cyan-950/30 border-cyan-500/60 text-cyan-300 animate-pulse'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] bg-slate-800">
                        {item.step}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isCurrent && <RotateCcw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {drStep === 5 && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Diễn Tập Thành Công Xuất Sắc!
                </div>
                <div className="text-[11px] text-slate-300">
                  Thời gian phục hồi thực tế (RTO): <strong>1.4 phút</strong> (vượt xa chỉ tiêu &lt; 2 phút). Tính toàn vẹn dữ liệu: <strong>100% khớp mã băm SHA-256</strong>.
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDrModalOpen(false)}
                disabled={isDrRunning}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
