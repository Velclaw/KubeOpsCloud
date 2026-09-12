import React, { useState } from 'react';
import {
  Bell,
  Send,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  MessageSquare,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { AlertRule, SlackAlertEvent } from '../../types';

interface AlertsViewProps {
  rules: AlertRule[];
  events: SlackAlertEvent[];
  onToggleRule: (ruleId: string) => void;
  onUpdateThreshold: (ruleId: string, newThreshold: number) => void;
  onSimulateAlert: (rule: AlertRule) => void;
  onAcknowledgeEvent: (eventId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  rules,
  events,
  onToggleRule,
  onUpdateThreshold,
  onSimulateAlert,
  onAcknowledgeEvent,
}) => {
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSlackWebhook = async (alertToTest?: SlackAlertEvent) => {
    setSendingWebhook(true);
    setWebhookFeedback(null);

    const testAlert = alertToTest || {
      id: 'test-alert',
      ruleId: 'rule-cpu',
      title: '🚨 KubePodHighCpuUsage: deployment/kubeops-api vượt ngưỡng',
      severity: 'CRITICAL',
      value: 'CPU 86.4% (> 75%)',
      target: 'production / deployment/kubeops-api',
      timestamp: new Date().toLocaleString('vi-VN'),
      message: 'Lưu lượng tăng cao đột ngột. HPA đang điều phối scale-up thêm Pods để ổn định hệ thống.',
      status: 'firing' as const,
    };

    try {
      const response = await fetch('/api/slack-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: customWebhookUrl || undefined,
          alert: testAlert,
          testMode: !customWebhookUrl,
        }),
      });

      const data = await response.json();
      setWebhookFeedback({
        success: data.success,
        message: data.message || 'Đã gửi cảnh báo thành công!',
      });
    } catch (err: any) {
      setWebhookFeedback({
        success: false,
        message: 'Lỗi gửi cảnh báo: ' + (err.message || 'Không thể kết nối'),
      });
    } finally {
      setSendingWebhook(false);
    }
  };

  const latestEvent = events[0];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> PROMETHEUS ALERTMANAGER &amp; SLACK INTEGRATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Kênh: #devops-alerts
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Thiết Lập Ngưỡng Cảnh Báo Thông Minh &amp; Báo Động Tức Thì Qua Slack
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Cấu hình các rule giám sát nhạy bén: Phát hiện sớm tải CPU tăng cao, lỗi HTTP 5xx, Pod CrashLoop và sao lưu thất bại. Cảnh báo định dạng Slack Block Kit trực quan kèm số liệu đo và hướng dẫn xử lý (Runbook).
            </p>
          </div>

          <button
            onClick={() => handleTestSlackWebhook()}
            disabled={sendingWebhook}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingWebhook ? 'Đang gửi...' : 'Test Gửi Cảnh Báo Đến Slack'}</span>
          </button>
        </div>

        {/* Feedback message */}
        {webhookFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
              webhookFeedback.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <span>{webhookFeedback.message}</span>
            <button
              onClick={() => setWebhookFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Grid: Alert Rules List vs Slack Interactive Message Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Alert Rules Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Quy tắc Cảnh báo Prometheus ({rules.length} rules)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Alertmanager v0.26</span>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => {
              const isCritical = rule.severity === 'CRITICAL';

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.isFiring
                      ? 'bg-rose-950/20 border-rose-800/80 shadow-md shadow-rose-950/20'
                      : rule.enabled
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-slate-900/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {rule.severity}
                        </span>
                        <h4 className="text-sm font-semibold text-white font-mono">{rule.name}</h4>
                        {rule.isFiring && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-bold animate-pulse">
                            FIRING
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 text-xs text-slate-400 font-mono">
                        Biểu thức: <span className="text-slate-300">{rule.metric}</span> {rule.condition}{' '}
                        <strong className="text-white">
                          {rule.threshold}
                          {rule.unit}
                        </strong>{' '}
                        trong <span className="text-cyan-400">{rule.duration}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                        <span>Kênh: <strong className="text-slate-300 font-normal">{rule.channel}</strong></span>
                        {rule.lastTriggered && (
                          <span>Kích hoạt gần nhất: {rule.lastTriggered}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          rule.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {rule.enabled ? 'Bật' : 'Tắt'}
                      </button>

                      <button
                        onClick={() => onSimulateAlert(rule)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                        title="Thử nghiệm bắn cảnh báo sự cố từ rule này"
                      >
                        Kích hoạt thử
                      </button>
                    </div>
                  </div>

                  {/* Threshold slider adjuster */}
                  {rule.enabled && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">Chỉnh ngưỡng:</span>
                      <input
                        type="range"
                        min={rule.unit === '%' ? 10 : rule.unit === 'ms' ? 100 : 1}
                        max={rule.unit === '%' ? 95 : rule.unit === 'ms' ? 1000 : 10}
                        step={rule.unit === '%' ? 5 : rule.unit === 'ms' ? 25 : 1}
                        value={rule.threshold}
                        onChange={(e) => onUpdateThreshold(rule.id, Number(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <span className="font-mono text-xs text-cyan-300 w-12 text-right">
                        {rule.threshold}
                        {rule.unit}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Slack Block Kit Card & Webhook Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Cấu hình Webhook Slack Thực
            </h3>
            <p className="text-xs text-slate-400">
              Nhập Slack Incoming Webhook URL của bạn (nếu có) để nhận thông báo thực tế về điện thoại hoặc Slack desktop workspace:
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={customWebhookUrl}
                onChange={(e) => setCustomWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/T00/B00/XXXXX..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
              <div className="text-[11px] text-slate-500">
                Để trống để chạy chế độ giả lập trực quan (Safe Preview Mode).
              </div>
            </div>
          </div>

          {/* Realistic Slack Message Preview */}
          <div className="rounded-xl bg-[#1A1D21] border border-slate-800 overflow-hidden shadow-2xl">
            {/* Slack App Header */}
            <div className="px-4 py-2.5 bg-[#121417] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                  K
                </div>
                <span className="text-xs font-bold text-white">KubeOps AlertBot</span>
                <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">APP</span>
              </div>
              <span className="text-[10px] text-slate-400">#devops-alerts</span>
            </div>

            {/* Slack Block Card Content */}
            <div className="p-4 space-y-3 font-sans text-xs">
              <div className="border-l-4 border-rose-500 pl-3 py-1 space-y-2.5 bg-slate-900/30 rounded-r">
                <div className="font-bold text-white text-sm flex items-center gap-1.5">
                  🚨 {latestEvent?.title || 'KubePodHighCpuUsage Alert Fired'}
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Mức độ (Severity):</span>
                    <span className="text-rose-400 font-mono font-bold">
                      `{latestEvent?.severity || 'CRITICAL'}`
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Cluster / Env:</span>
                    <span className="font-mono text-slate-200">`production-k8s`</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Đối tượng (Target):</span>
                    <span className="font-mono text-cyan-300">`{latestEvent?.target || 'kubeops-api'}`</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-semibold">Giá trị đo (Value):</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {latestEvent?.value || 'CPU 84.6% (> 75%)'}
                    </span>
                  </div>
                </div>

                <div className="text-slate-300 text-xs bg-slate-950/60 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                  <strong>Chi tiết:</strong> {latestEvent?.message || 'Lưu lượng người dùng tăng đột biến, HPA kích hoạt scale từ 2 -> 4 pods.'}
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  🕒 {latestEvent?.timestamp || 'Hôm nay 14:38'} • Prometheus Alertmanager
                </div>

                {/* Slack Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => latestEvent && onAcknowledgeEvent(latestEvent.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors"
                  >
                    Đã Tiếp Nhận (Ack)
                  </button>
                  <button
                    onClick={() => handleTestSlackWebhook(latestEvent)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
                  >
                    Gửi Lại Slack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
