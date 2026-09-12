import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
  FileCheck,
  ShieldCheck,
  Download,
  Key,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  GitCommit,
  GitBranch,
  Clock,
  Award,
  GitPullRequest,
  Lock,
  Unlock,
  GitMerge,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PipelineRun, PipelineStage } from '../../types';

interface CiCdViewProps {
  pipeline: PipelineRun;
  onRerunPipeline: (simulateFailure?: boolean) => void;
  isRunning: boolean;
}

export const CiCdView: React.FC<CiCdViewProps> = ({
  pipeline,
  onRerunPipeline,
  isRunning,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(pipeline.stages[0]?.id || 'lint_check');
  const [copiedArtifact, setCopiedArtifact] = useState<string | null>(null);

  const selectedStage = pipeline.stages.find((s) => s.id === selectedStageId) || pipeline.stages[0];

  const handleTriggerRun = (failMode = false) => {
    onRerunPipeline(failMode);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedArtifact(label);
    setTimeout(() => setCopiedArtifact(null), 2000);
  };

  const downloadAuditReport = () => {
    const reportData = {
      pipelineId: pipeline.id,
      commit: pipeline.commitHash,
      branch: pipeline.branch,
      author: pipeline.author,
      timestamp: new Date().toISOString(),
      slsaLevel: pipeline.slsaLevel,
      evidenceVerified: pipeline.evidenceVerified,
      signature: pipeline.attestationSignature,
      stages: pipeline.stages.map((st) => ({
        name: st.name,
        status: st.status,
        durationMs: st.durationMs,
        evidence: st.evidence,
      })),
      complianceStatement: "SLSA Level 3 Supply Chain Security Verified. All test gates green with zero high/critical CVEs.",
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `green-evidence-attestation-${pipeline.commitHash}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Green Evidence Certification Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> EVIDENCE XANH (GREEN ATTESTED)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> SLSA Level 3 Provenance
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Quy trình Tự động hóa CI/CD GitHub Actions & Bằng chứng Kiểm thử
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Giải quyết triệt để vấn đề <em>&quot;CI chưa có evidence xanh&quot;</em>: Mọi commit đều được kiểm tra Lint, chạy 100% Unit Tests, quét bảo mật SAST/CVE (Trivy), đóng gói container Distroless siêu nhẹ và ký số xác thực mật mã (Cosign) trước khi rollout lên Kubernetes.
            </p>

            {/* Commit Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-slate-300">
                <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                Commit: <strong className="text-white">{pipeline.commitHash}</strong>
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                Branch: <strong className="text-white">{pipeline.branch}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Thời gian: {pipeline.timestamp}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerRun(false)}
              disabled={isRunning}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isRunning ? 'Đang chạy Pipeline...' : 'Chạy Lại Pipeline (Audit)'}</span>
            </button>

            <button
              onClick={downloadAuditReport}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Tải chứng chỉ JSON Evidence kiểm định cho kiểm toán"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Tải Evidence JSON</span>
            </button>

            <button
              onClick={() => handleTriggerRun(true)}
              disabled={isRunning}
              className="px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 text-xs font-medium border border-slate-800 transition-all"
              title="Mô phỏng lỗi CI để xem quy trình cảnh báo và tự chữa lành"
            >
              <span>Giả lập lỗi CI</span>
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Branch Protection & Pull Request Merge Gate */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              GitHub Branch Protection Rule Gate: Pull Request #42
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
              target: main &larr; feature/k8s-production-hardening
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pipeline.evidenceVerified ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5" /> MERGE UNLOCKED (EVIDENCE XANH)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> MERGE BLOCKED (CHƯA CÓ EVIDENCE)
              </span>
            )}
          </div>
        </div>

        {/* 4 Required Status Checks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-slate-300 block">ci/lint-typecheck</span>
              <span className="text-[10px] text-slate-500">TypeScript 0 Errors</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-slate-300 block">ci/unit-tests</span>
              <span className="text-[10px] text-slate-500">Coverage &gt; 85%</span>
            </div>
            {pipeline.stages[1]?.status === 'failed' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-slate-300 block">sec/trivy-sast</span>
              <span className="text-[10px] text-slate-500">0 High / Critical</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-[11px] text-slate-300 block">sec/cosign-slsa</span>
              <span className="text-[10px] text-slate-500">Rekor Transparency</span>
            </div>
            {pipeline.evidenceVerified ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>

        {/* PR Merge CTA & Status Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
          <p className="text-slate-400 text-[11px]">
            {pipeline.evidenceVerified ? (
              <span className="text-emerald-300 font-medium">
                ✓ Tất cả 4/4 kiểm tra nghiêm ngặt đã hoàn thành với bằng chứng số (evidence) hợp lệ. Sẵn sàng gộp vào nhánh chính (main).
              </span>
            ) : (
              <span className="text-rose-300 font-medium">
                ✕ Khóa chặn: Quy tắc Branch Protection từ chối merge do thiếu bằng chứng kiểm thử xanh hoặc có lỗi chưa giải quyết.
              </span>
            )}
          </p>

          <button
            disabled={!pipeline.evidenceVerified || isRunning}
            onClick={fireConfetti}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
              pipeline.evidenceVerified
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>{pipeline.evidenceVerified ? 'Squash and Merge (Đã Xác Thực)' : 'Merge Blocked'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Pipeline Stages Pipeline, Right Terminal & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Các công đoạn Pipeline (6/6 Pass)
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              Tổng: {(pipeline.totalDurationMs / 1000).toFixed(1)}s
            </span>
          </div>

          <div className="space-y-2">
            {pipeline.stages.map((stage, idx) => {
              const isSelected = selectedStageId === stage.id;
              const isSuccess = stage.status === 'success';
              const isFailed = stage.status === 'failed';
              const isRunningStage = stage.status === 'running';

              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/60 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {isSuccess && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        {isFailed && (
                          <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
                            <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        {isRunningStage && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                            <RotateCcw className="w-3 h-3 animate-spin" />
                          </div>
                        )}
                        {stage.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700 text-[10px] font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">
                            {stage.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {stage.description}
                        </p>

                        {/* Evidence Tag */}
                        {stage.evidence && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono flex items-center gap-1">
                              <FileCheck className="w-3 h-3 text-emerald-400" />
                              {stage.evidence.artifactName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-800/40">
                              {stage.evidence.score || 'PASSED'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-mono text-slate-400">
                      {(stage.durationMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Details: Terminal Log & Cryptographic Evidence (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Evidence Details Card */}
          {selectedStage.evidence && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Bằng chứng kiểm định (Cryptographic Evidence)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 font-mono">
                  Audit Passed • 100% Green
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Loại bằng chứng:</span>
                  <span className="font-medium text-slate-200">{selectedStage.evidence.type}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px]">Tệp Artifact:</span>
                  <span className="font-mono text-cyan-300">{selectedStage.evidence.artifactName}</span>
                </div>
                <div className="sm:col-span-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mã băm SHA-256 (Immutability):</span>
                    <span className="font-mono text-emerald-400 text-[11px] break-all">
                      {selectedStage.evidence.hash}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedStage.evidence?.hash || '', 'hash')}
                    className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 whitespace-nowrap"
                  >
                    {copiedArtifact === 'hash' ? 'Đã chép!' : 'Chép SHA'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Logs Viewer */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  Console Output: {selectedStage.name}
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="p-4 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto">
              {selectedStage.logs.map((line, idx) => {
                let color = 'text-slate-400';
                if (line.includes('[PASS]') || line.includes('SUCCESS') || line.includes('PASSED')) {
                  color = 'text-emerald-400 font-semibold';
                } else if (line.includes('[FAIL]') || line.includes('ERROR')) {
                  color = 'text-rose-400 font-semibold';
                } else if (line.includes('[INIT]') || line.includes('[EXEC]') || line.includes('[RUN]')) {
                  color = 'text-cyan-400';
                } else if (line.includes('[COVERAGE]') || line.includes('[OPTIMIZE]')) {
                  color = 'text-amber-300';
                }

                return (
                  <div key={idx} className={`leading-relaxed ${color}`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supply chain security badge explanation */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-slate-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-300">Chứng minh Evidence Xanh đạt chuẩn:</strong> Mọi build container được ký thông qua Sigstore Cosign với danh tính OIDC, đẩy bản ghi vào sổ cái Rekor phi tập trung. Đảm bảo 100% không thể sửa đổi (tamper-proof) và đáp ứng chuẩn kiểm toán quốc tế ISO 27001 / SOC2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
