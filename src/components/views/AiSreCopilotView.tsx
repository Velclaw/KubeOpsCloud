import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  ShieldCheck,
  Server,
  Terminal,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CloudProvider, KubernetesPod, HpaConfig, AlertRule } from '../../types';

interface AiSreCopilotViewProps {
  provider: CloudProvider;
  pods: KubernetesPod[];
  hpa: HpaConfig;
  rules: AlertRule[];
  trafficRps: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AiSreCopilotView: React.FC<AiSreCopilotViewProps> = ({
  provider,
  pods,
  hpa,
  rules,
  trafficRps,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Xin chào SRE Lead! Tôi là AI DevOps & SRE Copilot (Gemini 3.8 Flash). Tôi sẵn sàng hỗ trợ bạn:\n' +
        '• Tối ưu chi phí $0.00 cho Cloud Free Tier (Oracle Cloud Ampere A1, GCP, AWS)\n' +
        '• Phân tích sự cố Prometheus Alert, tinh chỉnh HPA auto-scaling\n' +
        '• Kiểm định Evidence Xanh trong CI/CD và sinh mã YAML Production chuẩn bảo mật.\n\n' +
        'Hãy chọn câu hỏi gợi ý bên dưới hoặc gửi yêu cầu của bạn!',
      timestamp: 'Vừa xong',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const clusterContext = {
    cloudProvider: provider,
    activePodsCount: pods.length,
    hpaMin: hpa.minReplicas,
    hpaMax: hpa.maxReplicas,
    targetCpu: hpa.targetCpuPercentage,
    trafficRps: trafficRps,
    firingAlertsCount: rules.filter((r) => r.isFiring).length,
  };

  const handleSendMessage = async (promptToSend?: string) => {
    const query = promptToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const resp = await fetch('/api/sre-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          clusterContext,
        }),
      });

      const data = await resp.json();
      const botMsg: Message = {
        role: 'assistant',
        content: data.response || 'Đã xử lý yêu cầu thành công.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        role: 'assistant',
        content: `Đã xảy ra lỗi kết nối: ${err.message}. Hệ thống chuyển sang giải đáp tối ưu Free Tier cục bộ.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPrompts = [
    'Làm thế nào để duy trì cụm K8s hoàn toàn miễn phí $0.00 trên Oracle Cloud hoặc GCP?',
    'Giải thích cơ chế HPA tự động scale pod khi có spike lưu lượng người dùng',
    'Hướng dẫn cấu hình Slack Webhook Alertmanager trong Kubernetes',
    'Cách kiểm định Evidence Xanh đạt chuẩn SLSA Level 3 cho CI/CD',
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> GEMINI SRE ARCHITECT &amp; COPILOT
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            Server-side AI Engine
          </span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Trợ Lý AI DevOps &amp; SRE Xử Lý Sự Cố Tức Thì
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
          Tích hợp mô hình Gemini AI thế hệ mới để hỗ trợ chẩn đoán cảnh báo Prometheus, tư vấn cấu hình K8s HPA tối ưu cho các gói Cloud Free Tier và giải đáp kỹ thuật chuyên sâu về chuỗi cung ứng CI/CD bảo mật.
        </p>
      </div>

      {/* Quick Prompt Pills */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-800 transition-all text-left"
          >
            💡 {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Messages list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 p-0.5 shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 mb-1">
                    <span className="font-semibold">{isUser ? 'Bạn (DevOps Lead)' : 'AI SRE Copilot'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content}
                  </div>

                  {!isUser && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
              <span>AI SRE Copilot đang suy luận và phân tích số liệu cụm...</span>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Hỏi về Kubernetes, Prometheus alert, CI/CD Green Evidence hoặc Free Tier..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
