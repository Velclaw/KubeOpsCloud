import React from 'react';
import { Server, Activity, Bell, Cpu, RefreshCw, ShieldCheck } from 'lucide-react';
interface HeaderProps { activeAlertCount: number; podCount: number; onRefreshMetrics: () => void; isRefreshing: boolean; }
export const Header: React.FC<HeaderProps> = ({ activeAlertCount, podCount, onRefreshMetrics, isRefreshing }) => (
  <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f16]/95 backdrop-blur-xl px-4 lg:px-8 py-3">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl border border-cyan-400/20 bg-cyan-400/10 flex items-center justify-center"><Server className="w-5 h-5 text-cyan-300" /></div><div><div className="flex items-center gap-2"><h1 className="text-lg font-bold tracking-tight text-white">KubeOps Cloud</h1><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">Control Plane</span></div><p className="text-xs text-slate-500 mt-0.5">Velclaw self-hosted Kubernetes management</p></div></div>
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span>Cluster: <strong>Not connected</strong></span></div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"><Cpu className="w-3.5 h-3.5 text-blue-400" /><span>Telemetry: <strong className="text-white">{podCount} demo pods</strong></span></div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"><Bell className="w-3.5 h-3.5 text-rose-400" /><span>Alerts: <strong>{activeAlertCount}</strong></span></div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /><span>Runtime: self-hosted</span></div>
        <button onClick={onRefreshMetrics} disabled={isRefreshing} className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50" title="Refresh telemetry"><RefreshCw className={isRefreshing ? 'w-3.5 h-3.5 animate-spin text-cyan-400' : 'w-3.5 h-3.5'} /></button>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-slate-500"><div className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-cyan-400" /><span>Control plane UI • no external cloud provider selected</span></div><span className="font-mono hidden md:block">API: /api/health</span></div>
  </header>
);