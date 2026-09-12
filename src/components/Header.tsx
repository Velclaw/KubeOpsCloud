import React from 'react';
import {
  Server,
  ShieldCheck,
  DollarSign,
  Activity,
  Bell,
  Cpu,
  RefreshCw,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { CloudProvider } from '../types';
import { CLOUD_PROVIDERS } from '../mock/initialData';

interface HeaderProps {
  currentProvider: CloudProvider;
  onSelectProvider: (provider: CloudProvider) => void;
  activeAlertCount: number;
  podCount: number;
  onRefreshMetrics: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProvider,
  onSelectProvider,
  activeAlertCount,
  podCount,
  onRefreshMetrics,
  isRefreshing,
}) => {
  const selectedProviderInfo = CLOUD_PROVIDERS.find(p => p.id === currentProvider) || CLOUD_PROVIDERS[0];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Server className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                KubeOps Cloud
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                  Production v1.30
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Green Evidence CI/CD • Kubernetes HPA • Prometheus • Slack Alert • Backup 24/7
            </p>
          </div>
        </div>

        {/* Center: Cloud Free Tier Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="text-slate-400 font-medium px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Cloud:
          </span>
          {CLOUD_PROVIDERS.map((prov) => (
            <button
              key={prov.id}
              onClick={() => onSelectProvider(prov.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                currentProvider === prov.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {prov.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Right: Metrics Badges & Action */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Cost Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300" title="Chi phí hạ tầng tối ưu cho dự án nhỏ">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chi phí: <strong className="font-semibold text-emerald-200">$0.00 / tháng</strong></span>
          </div>

          {/* Pods Count */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Pods: <strong className="text-white font-mono">{podCount} replicas</strong></span>
          </div>

          {/* Alert count */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
            activeAlertCount > 0
              ? 'bg-rose-950/50 border-rose-800/60 text-rose-300 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Bell className="w-3.5 h-3.5 text-rose-400" />
            <span>Cảnh báo: <strong>{activeAlertCount}</strong></span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefreshMetrics}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Làm mới số liệu thực tế"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cloud specs banner */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">{selectedProviderInfo.name}:</span>
          <span>{selectedProviderInfo.freeTierAllowance}</span>
        </div>
        <div className="text-slate-500 font-mono hidden md:block">
          Cluster Target: <span className="text-slate-300">k8s-prod-free.cluster.local</span> (AES-256 encrypted)
        </div>
      </div>
    </header>
  );
};
