import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { SecurityAuditItem } from '../../types';

interface SecurityComplianceViewProps {
  items: SecurityAuditItem[];
}

export const SecurityComplianceView: React.FC<SecurityComplianceViewProps> = ({ items }) => {
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [activeRole, setActiveRole] = useState<'admin' | 'sre' | 'auditor'>('sre');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> ZERO-TRUST SECURITY &amp; COMPLIANCE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Score: 98/100 (Grade A+)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Bảo Mật Tuyệt Đối &amp; Tuân Thủ Tiêu Chuẩn Quốc Tế
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Bảo mật toàn diện từ mã hóa đầu cuối (TLS 1.3 &amp; AES-GCM-256), xác thực đa yếu tố chặt chẽ (MFA/2FA), kiểm soát truy cập phân quyền RBAC đến tuân thủ nghiêm ngặt các quy định bảo mật toàn cầu (ISO/IEC 27001, SOC 2 Type II, EU GDPR).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-cyan-400" />
            <div>
              <div className="text-xs font-semibold text-white">Xác thực Đa Yếu Tố (MFA)</div>
              <div className="text-[11px] text-emerald-400 font-mono">Bắt buộc 100% người dùng</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Security Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Encryption */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Mã Hóa Đầu Cuối (E2E)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dữ liệu truyền tải qua Internet được bảo vệ bằng giao thức TLS 1.3 (Let&apos;s Encrypt cert-manager). Dữ liệu lưu trữ (Data-at-Rest) tại cơ sở dữ liệu và Cloud Bucket được niêm phong bằng khóa AES-GCM-256.
          </p>
          <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> TLS 1.3 &amp; AES-256 Active
          </div>
        </div>

        {/* Pillar 2: MFA & RBAC */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-blue-400">
            <Key className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Xác Thực Đa Yếu Tố (MFA)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Áp dụng chuẩn WebAuthn / FIDO2 và mã TOTP 6 số cho mọi kỹ sư vận hành có quyền truy cập kubectl, CI/CD secrets hoặc bảng điều khiển hạ tầng Cloud.
          </p>
          <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> TOTP / FIDO2 Enforced
          </div>
        </div>

        {/* Pillar 3: Global Compliance */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Quyền Riêng Tư &amp; GDPR</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hỗ trợ cơ chế ẩn danh hóa log, xuất dữ liệu cá nhân (Right to Portability) và xóa vĩnh viễn theo yêu cầu (Right to Erasure) theo quy định bảo vệ dữ liệu toàn cầu của EU GDPR.
          </p>
          <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> GDPR Article 17 Compliant
          </div>
        </div>
      </div>

      {/* Security Audit Checklist Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" /> Danh Mục Tiêu Chuẩn Tuân Thủ Quốc Tế
          </h3>
          <span className="text-xs text-emerald-400 font-mono">SOC2 • ISO-27001 • GDPR</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="p-3">Hạng Mục &amp; Tiêu Chuẩn</th>
                  <th className="p-3">Danh Mục</th>
                  <th className="p-3">Chi Tiết Kiểm Soát</th>
                  <th className="p-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{item.title}</div>
                      <span className="text-[10px] text-cyan-400 font-mono">{item.standard}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-xs leading-relaxed max-w-md">
                      {item.details}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
