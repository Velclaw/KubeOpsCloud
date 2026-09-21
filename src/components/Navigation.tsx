import React from 'react';
import {
  CheckCircle2,
  Cpu,
  Activity,
  Bell,
  HardDriveDownload,
  ShieldCheck,
  FileCode,
  Sparkles,
  Server,
} from 'lucide-react';

export type ActiveTab =
  | 'evidence'
  | 'k8s'
  | 'vps'
  | 'monitoring'
  | 'alerts'
  | 'backup'
  | 'security'
  | 'manifests'
  | 'sre_ai';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  evidenceVerified: boolean;
  activeAlertCount: number;
  vpsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  evidenceVerified,
  activeAlertCount,
  vpsCount = 5,
}) => {
  const tabs = [
    {
      id: 'evidence' as ActiveTab,
      label: 'CI/CD Evidence Xanh',
      icon: CheckCircle2,
      badge: evidenceVerified ? 'Verified' : 'Pending',
      badgeColor: evidenceVerified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      id: 'k8s' as ActiveTab,
      label: 'K8s, HPA & Cluster Autoscaler',
      icon: Cpu,
      badge: 'Pod & Node',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'vps' as ActiveTab,
      label: 'Máy Chủ VPS (Fleet)',
      icon: Server,
      badge: `${vpsCount} Nodes`,
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    },
        {
      id: 'monitoring' as ActiveTab,
      label: 'Prometheus & Grafana',
      icon: Activity,
      badge: 'Real-time',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Cảnh báo Slack',
      icon: Bell,
      badge: activeAlertCount > 0 ? `${activeAlertCount} Firing` : '0 Active',
      badgeColor: activeAlertCount > 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-700/40 text-slate-400 border-slate-700',
    },
    {
      id: 'backup' as ActiveTab,
      label: 'Backup & DR 24/7',
      icon: HardDriveDownload,
      badge: 'AES-256',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'security' as ActiveTab,
      label: 'Bảo mật & Tuân thủ',
      icon: ShieldCheck,
      badge: 'MFA/TLS1.3',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      id: 'manifests' as ActiveTab,
      label: 'File K8s & Workflow',
      icon: FileCode,
      badge: 'Ready YAML',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      id: 'sre_ai' as ActiveTab,
      label: 'AI SRE Copilot',
      icon: Sparkles,
      badge: 'Gemini AI',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 lg:px-8 py-2 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${tab.badgeColor}`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
