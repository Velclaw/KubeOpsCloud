import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  Zap,
  TrendingUp,
  Server,
  Sliders,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  HardDrive,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  FileText,
  Check,
  Copy,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  KubernetesPod,
  KubernetesNode,
  ClusterAutoscalerConfig,
  HpaConfig,
  CloudProvider,
  ResourceQuotaNamespaceConfig,
} from '../../types';
import { CLOUD_PROVIDERS } from '../../mock/initialData';

interface KubernetesViewProps {
  pods: KubernetesPod[];
  nodes: KubernetesNode[];
  hpa: HpaConfig;
  clusterAutoscaler: ClusterAutoscalerConfig;
  trafficRps: number;
  onUpdateTrafficRps: (rps: number) => void;
  onUpdateHpa: (newHpa: HpaConfig) => void;
  onUpdateClusterAutoscaler: (newCa: ClusterAutoscalerConfig) => void;
  onTriggerNodeScaleUp: () => void;
  isNodeProvisioning: boolean;
  provider: CloudProvider;
}

export const KubernetesView: React.FC<KubernetesViewProps> = ({
  pods,
  nodes,
  hpa,
  clusterAutoscaler,
  trafficRps,
  onUpdateTrafficRps,
  onUpdateHpa,
  onUpdateClusterAutoscaler,
  onTriggerNodeScaleUp,
  isNodeProvisioning,
  provider,
}) => {
  const currentProviderInfo = CLOUD_PROVIDERS.find((p) => p.id === provider) || CLOUD_PROVIDERS[0];
  const [selectedPod, setSelectedPod] = useState<KubernetesPod | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'hpa' | 'cluster_autoscaler' | 'resource_quotas'>('hpa');

  // Resource Quotas state for production namespace
  const [quotaNamespace, setQuotaNamespace] = useState<'production' | 'monitoring' | 'kube-system'>('production');
  const [quotaConfig, setQuotaConfig] = useState<ResourceQuotaNamespaceConfig>({
    namespace: 'production',
    status: 'Active',
    cpuRequestsHardM: 2000,
    cpuLimitsHardM: 4000,
    memoryRequestsHardMi: 2048,
    memoryLimitsHardMi: 4096,
    maxPodsHard: 10,
    pvcsHard: 5,
    configMapsHard: 20,
    secretsHard: 15,
  });

  const [isApplyingQuota, setIsApplyingQuota] = useState(false);
  const [quotaToast, setQuotaToast] = useState<string | null>(null);
  const [showQuotaYamlModal, setShowQuotaYamlModal] = useState(false);
  const [yamlCopied, setYamlCopied] = useState(false);

  // Compute average CPU and Memory across active API pods
  const apiPods = pods.filter((p) => p.name.includes('api'));
  const avgCpuUsage = apiPods.length
    ? Math.round(apiPods.reduce((sum, p) => sum + (p.cpuUsageM / p.cpuLimitM) * 100, 0) / apiPods.length)
    : 32;

  const avgMemUsage = apiPods.length
    ? Math.round(apiPods.reduce((sum, p) => sum + (p.memUsageMi / p.memLimitMi) * 100, 0) / apiPods.length)
    : 45;

  // Calculate actual resource consumption for the production namespace
  const prodPods = pods.filter((p) => quotaNamespace === 'production' ? (p.namespace === 'production' || p.name.includes('api')) : p.namespace === quotaNamespace);
  const actualCpuRequestsM = prodPods.length * 100;
  const actualCpuLimitsM = prodPods.reduce((sum, p) => sum + p.cpuLimitM, 0);
  const actualMemRequestsMi = prodPods.length * 128;
  const actualMemLimitsMi = prodPods.reduce((sum, p) => sum + p.memLimitMi, 0);
  const actualPodsCount = prodPods.length;
  const actualPvcsCount = 2; // e.g. redis-pvc, uploads-pvc
  const actualConfigMapsCount = 7;
  const actualSecretsCount = 5;

  const cpuReqPercent = Math.min(Math.round((actualCpuRequestsM / quotaConfig.cpuRequestsHardM) * 100), 100);
  const cpuLimitPercent = Math.min(Math.round((actualCpuLimitsM / quotaConfig.cpuLimitsHardM) * 100), 100);
  const memReqPercent = Math.min(Math.round((actualMemRequestsMi / quotaConfig.memoryRequestsHardMi) * 100), 100);
  const memLimitPercent = Math.min(Math.round((actualMemLimitsMi / quotaConfig.memoryLimitsHardMi) * 100), 100);
  const podPercent = Math.min(Math.round((actualPodsCount / quotaConfig.maxPodsHard) * 100), 100);

  const handleApplyQuota = () => {
    setIsApplyingQuota(true);
    setTimeout(() => {
      setIsApplyingQuota(false);
      setQuotaToast('✓ ResourceQuota và LimitRange đã được áp dụng thành công qua kubectl vào namespace ' + quotaNamespace + '!');
      setTimeout(() => setQuotaToast(null), 4000);
    }, 700);
  };

  const handleResetFreeTierQuota = () => {
    setQuotaConfig({
      namespace: 'production',
      status: 'Active',
      cpuRequestsHardM: 1500,
      cpuLimitsHardM: 3000,
      memoryRequestsHardMi: 1536,
      memoryLimitsHardMi: 3072,
      maxPodsHard: 8,
      pvcsHard: 4,
      configMapsHard: 15,
      secretsHard: 10,
    });
    setQuotaToast('✓ Đã khôi phục mức ResourceQuota tối ưu Free Tier!');
    setTimeout(() => setQuotaToast(null), 3000);
  };

  const generatedQuotaYaml = `apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-resources-quota
  namespace: ${quotaNamespace}
spec:
  hard:
    requests.cpu: "${(quotaConfig.cpuRequestsHardM / 1000).toFixed(1)}"
    requests.memory: "${quotaConfig.memoryRequestsHardMi}Mi"
    limits.cpu: "${(quotaConfig.cpuLimitsHardM / 1000).toFixed(1)}"
    limits.memory: "${quotaConfig.memoryLimitsHardMi}Mi"
    pods: "${quotaConfig.maxPodsHard}"
    persistentvolumeclaims: "${quotaConfig.pvcsHard}"
    configmaps: "${quotaConfig.configMapsHard}"
    secrets: "${quotaConfig.secretsHard}"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: container-limit-range
  namespace: ${quotaNamespace}
spec:
  limits:
    - type: Container
      default:
        cpu: "300m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
      max:
        cpu: "1000m"
        memory: "1024Mi"
      min:
        cpu: "50m"
        memory: "64Mi"`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(generatedQuotaYaml);
    setYamlCopied(true);
    setTimeout(() => setYamlCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Kubernetes Production Runtime, HPA & Cluster Autoscaler */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> KUBERNETES RUNTIME v1.30
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Free Tier: $0.00/tháng
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> HPA & Cluster Autoscaler
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cụm Kubernetes Production Ổn Định: Tự Động Co Giãn Pods (HPA) & Worker Nodes (CA)
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Hai tầng tự động scale đồng bộ: <strong>Horizontal Pod Autoscaler (HPA)</strong> theo dõi CPU/Memory utilization để tăng giảm số lượng Pod, và <strong>Cluster Autoscaler (CA)</strong> tự động kích hoạt thêm/bớt Worker Node trong cụm khi tổng tài nguyên node pool tiệm cận ngưỡng giới hạn.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Số Pods (HPA)</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{pods.length}</span>
              <span className="text-[10px] text-slate-500 block">Min {hpa.minReplicas} • Max {hpa.maxReplicas}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Worker Nodes (CA)</span>
              <span className="text-lg font-bold font-mono text-blue-400">{nodes.length} nodes</span>
              <span className="text-[10px] text-slate-500 block">Min {clusterAutoscaler.minNodes} • Max {clusterAutoscaler.maxNodes}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">CPU Tải / Ngưỡng</span>
              <span className={`text-lg font-bold font-mono ${avgCpuUsage > hpa.targetCpuPercentage ? 'text-amber-400' : 'text-emerald-400'}`}>
                {avgCpuUsage}%
              </span>
              <span className="text-[10px] text-slate-500 block">Target {hpa.targetCpuPercentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">RAM Tải / Ngưỡng</span>
              <span className={`text-lg font-bold font-mono ${avgMemUsage > hpa.targetMemPercentage ? 'text-amber-400' : 'text-teal-400'}`}>
                {avgMemUsage}%
              </span>
              <span className="text-[10px] text-slate-500 block">Target {hpa.targetMemPercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulator: Traffic Load vs Dual-Layer Autoscaler */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Mô phỏng Lưu lượng Người Dùng Thực Tế (Traffic Generator)
              </h3>
              <p className="text-xs text-slate-400">
                Kéo thanh trượt để tăng/giảm Request Per Second (RPS) để kích hoạt tự động HPA và Cluster Autoscaler
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lưu lượng hiện tại:</span>
            <span className="text-sm font-mono font-bold text-cyan-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              {trafficRps.toLocaleString()} req/s
            </span>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="space-y-2">
          <input
            type="range"
            min="20"
            max="2500"
            step="50"
            value={trafficRps}
            onChange={(e) => onUpdateTrafficRps(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>20 RPS (Rảnh rỗi - 1 Pod / 2 Nodes)</span>
            <span>450 RPS (Bình thường - 2 Pods)</span>
            <span>1,300 RPS (Cao điểm - HPA scale 3 Pods)</span>
            <span>2,200 RPS (Cực đại - Pods bùng nổ, Node Pool scale lên 3 Nodes)</span>
          </div>
        </div>

        {/* Dynamic Insight Banner */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            {trafficRps <= 300 && (
              <span><strong>Tải nhẹ ({trafficRps} RPS):</strong> Cụm hoạt động ở mức tiết kiệm điện tối đa. HPA duy trì {pods.filter(p => p.name.includes('api')).length} API Pods, tổng CPU chiếm ~{avgCpuUsage}%, RAM ~{avgMemUsage}%. Node pool ổn định ở {nodes.length} nodes.</span>
            )}
            {trafficRps > 300 && trafficRps <= 1100 && (
              <span><strong>Tải trung bình ({trafficRps} RPS):</strong> CPU ~{avgCpuUsage}%, RAM ~{avgMemUsage}%. HPA đã scale-up lên {pods.filter(p => p.name.includes('api')).length} API replicas để chia tải đều giữa <code>worker-node-1</code> và <code>worker-node-2</code>.</span>
            )}
            {trafficRps > 1100 && (
              <span><strong>Tải cực đại ({trafficRps} RPS):</strong> HPA đạt mốc {pods.filter(p => p.name.includes('api')).length} pods. CPU request tiệm cận trần khả dụng của node pool. Cluster Autoscaler đã chủ động kích hoạt mở rộng thêm Node để đảm bảo zero-eviction và zero-packet-drop!</span>
            )}
          </div>
        </div>
      </div>

      {/* Subtabs for View Selection: HPA vs Cluster Autoscaler vs Resource Quotas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('hpa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'hpa'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Horizontal Pod Autoscaler (HPA Pods)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cluster_autoscaler')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'cluster_autoscaler'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Cluster Autoscaler (Worker Nodes Pool)</span>
          {nodes.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Scaled Up
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('resource_quotas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'resource_quotas'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Resource Quotas ({quotaNamespace})</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
            cpuLimitPercent > 80 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {cpuLimitPercent}% Quota
          </span>
        </button>
      </div>

      {/* SUBTAB 1: HPA View */}
      {activeSubTab === 'hpa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kubernetes Pods Table (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" /> Danh sách Pods trong Cụm ({pods.length} pods active)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Namespace: production, monitoring</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Tên Pod & Namespace</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Ready</th>
                      <th className="p-3">CPU (Usage / Limit)</th>
                      <th className="p-3">Memory (Usage / Limit)</th>
                      <th className="p-3">Node gán</th>
                      <th className="p-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {pods.map((pod) => {
                      const cpuPercent = Math.round((pod.cpuUsageM / pod.cpuLimitM) * 100);
                      const memPercent = Math.round((pod.memUsageMi / pod.memLimitMi) * 100);

                      return (
                        <tr key={pod.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-medium text-white truncate max-w-[190px]" title={pod.name}>
                              {pod.name}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">ns: {pod.namespace}</span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {pod.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{pod.ready}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${cpuPercent > 70 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                                  style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-slate-300 text-[11px] whitespace-nowrap">
                                {pod.cpuUsageM}m / {pod.cpuLimitM}m
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${memPercent > 75 ? 'bg-amber-400' : 'bg-teal-400'}`}
                                  style={{ width: `${Math.min(memPercent, 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-slate-300 text-[11px] whitespace-nowrap">
                                {pod.memUsageMi}Mi / {pod.memLimitMi}Mi
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-400 font-mono text-[11px] truncate max-w-[120px]" title={pod.node}>
                              {pod.node.split(' ')[0]}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{pod.ip}</div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedPod(pod)}
                              className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
                              title="Xem chi tiết Pod"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* HPA & Cloud Resource Optimization Config (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Cấu hình HPA (CPU & Memory)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                  autoscaling/v2
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    Replicas tối thiểu (Min Replicas):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="3"
                      value={hpa.minReplicas}
                      onChange={(e) => onUpdateHpa({ ...hpa, minReplicas: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                    />
                    <span className="text-[11px] text-slate-500">Tiết kiệm RAM khi rảnh</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Replicas tối đa (Max Replicas):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={hpa.maxReplicas}
                      onChange={(e) => onUpdateHpa({ ...hpa, maxReplicas: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                    />
                    <span className="text-[11px] text-slate-500">Giới hạn trong quota free</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Target CPU Utilization (%):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="40"
                      max="90"
                      step="5"
                      value={hpa.targetCpuPercentage}
                      onChange={(e) => onUpdateHpa({ ...hpa, targetCpuPercentage: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                    />
                    <span className="text-[11px] text-slate-500">Target CPU hiện tại: 70%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Target Memory Utilization (%):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="50"
                      max="90"
                      step="5"
                      value={hpa.targetMemPercentage || 75}
                      onChange={(e) => onUpdateHpa({ ...hpa, targetMemPercentage: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                    />
                    <span className="text-[11px] text-slate-500">Target Memory: 75%</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    Scale-down Stabilization (chống flapping):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={hpa.scaleDownStabilizationSeconds}
                      onChange={(e) => onUpdateHpa({ ...hpa, scaleDownStabilizationSeconds: Number(e.target.value) })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-white"
                    />
                    <span className="text-[11px] text-slate-500">300 giây (5 phút)</span>
                  </div>
                </div>
              </div>

              {/* Behavior policy note */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chính sách co giãn an toàn (Behavior)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  • <strong>Scale Up:</strong> 100% replicas trong 15s (phản ứng tức thì với traffic spike).
                </p>
                <p className="text-[11px] text-slate-300">
                  • <strong>Scale Down:</strong> Cooldown 300s ngăn chặn hiện tượng flapping co giãn liên tục làm chết pod đang xử lý request.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Cluster Autoscaler (CA) View */}
      {activeSubTab === 'cluster_autoscaler' && (
        <div className="space-y-6">
          {/* CA Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Trạng thái Cluster Autoscaler</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-white">Active & Monitoring</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Theo dõi hàng đợi Pod pending để kích hoạt mở rộng Node Pool tự động.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Thuật toán lựa chọn (Expander)</span>
              <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm">
                <span>least-waste (Tối ưu tiết kiệm)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ưu tiên node group tiêu tốn ít chi phí và tài nguyên thừa nhất, vừa khít Free Tier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Thao tác mô phỏng khẩn cấp</span>
              <button
                onClick={onTriggerNodeScaleUp}
                disabled={isNodeProvisioning || nodes.length >= clusterAutoscaler.maxNodes}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-950/40"
              >
                {isNodeProvisioning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang khởi tạo Worker Node mới...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Kích hoạt Scale-Up Node Mới</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 text-center">
                Mô phỏng Pods Pending kích hoạt Cluster Autoscaler cấp phát Node
              </p>
            </div>
          </div>

          {/* Worker Nodes Pool Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                Danh sách Worker Nodes trong Cụm ({nodes.length}/{clusterAutoscaler.maxNodes} nodes)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Node Group: {clusterAutoscaler.nodeGroupType}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => {
                const cpuUsagePct = Math.round((node.cpuUsedM / node.cpuAllocatableM) * 100);
                const memUsagePct = Math.round((node.memUsedMi / node.memAllocatableMi) * 100);

                return (
                  <div
                    key={node.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-xs">{node.name}</span>
                          {node.isAutoscaled && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                              Auto-scaled
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {node.instanceType} • {node.zone}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Ready
                      </span>
                    </div>

                    {/* Progress Bars: CPU & RAM */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/60">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                          <span>CPU Allocatable:</span>
                          <span className="text-slate-200 font-bold">{node.cpuUsedM}m / {node.cpuAllocatableM}m ({cpuUsagePct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cpuUsagePct > 75 ? 'bg-amber-400' : 'bg-cyan-400'}`}
                            style={{ width: `${cpuUsagePct}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                          <span>Memory Allocatable:</span>
                          <span className="text-slate-200 font-bold">{node.memUsedMi}Mi / {node.memAllocatableMi}Mi ({memUsagePct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${memUsagePct > 75 ? 'bg-amber-400' : 'bg-teal-400'}`}
                            style={{ width: `${memUsagePct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pods capacity */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                      <span>Sức chứa Pods:</span>
                      <span className="text-cyan-300 font-bold">{node.podCount} / {node.maxPods} pods</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cluster Autoscaler Event Feed */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Nhật Ký Tác Vụ Co Giãn (Cluster Autoscaler Activity Stream)
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Scale-Up Event [Auto-discovered]: worker-node-2 Ready</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Node pool <code>managed-nodepool-free-tier</code> đã mở rộng thành công sang zone asia-east1-b.
                  </p>
                </div>
                <span className="text-slate-500 text-[10px] whitespace-nowrap">Hôm nay 14:10</span>
              </div>

              {nodes.length > 2 && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-800/60 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Scale-Up Triggered: worker-node-3 Provisioned Successfully</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Phát hiện pods pending do tải lưu lượng tăng cao. Cluster Autoscaler đã cấp phát thêm 1 node instance trong 42 giây!
                    </p>
                  </div>
                  <span className="text-cyan-400 text-[10px] whitespace-nowrap">Vừa xong</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Resource Quotas View */}
      {activeSubTab === 'resource_quotas' && (
        <div className="space-y-6">
          {quotaToast && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{quotaToast}</span>
              </div>
              <button
                onClick={() => setQuotaToast(null)}
                className="text-emerald-400 hover:text-emerald-300 text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section Header & Namespace Selection */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> K8S ADMISSION CONTROL &amp; QUOTAS
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Status: Enforcing
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Quản Trị Resource Quotas &amp; Giới Hạn Tài Nguyên Cụm
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Thiết lập trần cứng (Hard Limit) ngăn chặn hiện tượng lạm dụng tài nguyên (Noisy Neighbors), tránh phát sinh chi phí ngoài dự kiến và đảm bảo cụm luôn vừa vặn trong ngân sách Free Tier.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                  {(['production', 'monitoring', 'kube-system'] as const).map((ns) => (
                    <button
                      key={ns}
                      onClick={() => setQuotaNamespace(ns)}
                      className={`px-3 py-1.5 rounded-lg font-mono transition-all ${
                        quotaNamespace === ns
                          ? 'bg-purple-600 text-white font-bold shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {ns}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowQuotaYamlModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Xuất YAML Quota</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Primary Resource Metric Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU Requests */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Requests
                </span>
                <span className={`font-mono text-xs font-bold ${cpuReqPercent > 80 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {cpuReqPercent}% Quota
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white">
                  {(actualCpuRequestsM / 1000).toFixed(2)} / {(quotaConfig.cpuRequestsHardM / 1000).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">vCPU Cores</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    cpuReqPercent > 80 ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${cpuReqPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Used: {actualCpuRequestsM}m</span>
                <span>Hard: {quotaConfig.cpuRequestsHardM}m</span>
              </div>
            </div>

            {/* CPU Limits */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU Limits (Trần Cực Đại)
                </span>
                <span className={`font-mono text-xs font-bold ${cpuLimitPercent > 80 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {cpuLimitPercent}% Quota
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white">
                  {(actualCpuLimitsM / 1000).toFixed(2)} / {(quotaConfig.cpuLimitsHardM / 1000).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">vCPU Cores</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    cpuLimitPercent > 80 ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${cpuLimitPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Used: {actualCpuLimitsM}m</span>
                <span>Hard: {quotaConfig.cpuLimitsHardM}m</span>
              </div>
            </div>

            {/* Memory Requests */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Memory Requests
                </span>
                <span className={`font-mono text-xs font-bold ${memReqPercent > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {memReqPercent}% Quota
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white">
                  {actualMemRequestsMi} / {quotaConfig.memoryRequestsHardMi}
                </span>
                <span className="text-xs text-slate-500 font-mono">MiB RAM</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    memReqPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${memReqPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Used: {(actualMemRequestsMi / 1024).toFixed(2)} GiB</span>
                <span>Hard: {(quotaConfig.memoryRequestsHardMi / 1024).toFixed(1)} GiB</span>
              </div>
            </div>

            {/* Memory Limits */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Memory Limits (OOM Ceiling)
                </span>
                <span className={`font-mono text-xs font-bold ${memLimitPercent > 80 ? 'text-rose-400' : 'text-purple-400'}`}>
                  {memLimitPercent}% Quota
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-mono font-bold text-white">
                  {actualMemLimitsMi} / {quotaConfig.memoryLimitsHardMi}
                </span>
                <span className="text-xs text-slate-500 font-mono">MiB RAM</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    memLimitPercent > 80 ? 'bg-rose-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${memLimitPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Used: {(actualMemLimitsMi / 1024).toFixed(2)} GiB</span>
                <span>Hard: {(quotaConfig.memoryLimitsHardMi / 1024).toFixed(1)} GiB</span>
              </div>
            </div>
          </div>

          {/* Secondary Quota Items Row: Pods, PVC, ConfigMaps, Secrets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">Max Pods Quota</span>
                <span className="text-base font-bold font-mono text-white">
                  {actualPodsCount} / {quotaConfig.maxPodsHard} <span className="text-xs text-slate-500 font-normal">pods</span>
                </span>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                podPercent > 80 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
              }`}>
                {podPercent}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">PVCs (Persistent Storage)</span>
                <span className="text-base font-bold font-mono text-white">
                  {actualPvcsCount} / {quotaConfig.pvcsHard} <span className="text-xs text-slate-500 font-normal">claims</span>
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {Math.round((actualPvcsCount / quotaConfig.pvcsHard) * 100)}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">ConfigMaps (Configs)</span>
                <span className="text-base font-bold font-mono text-white">
                  {actualConfigMapsCount} / {quotaConfig.configMapsHard} <span className="text-xs text-slate-500 font-normal">items</span>
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                {Math.round((actualConfigMapsCount / quotaConfig.configMapsHard) * 100)}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">Secrets (KMS Encrypted)</span>
                <span className="text-base font-bold font-mono text-white">
                  {actualSecretsCount} / {quotaConfig.secretsHard} <span className="text-xs text-slate-500 font-normal">secrets</span>
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {Math.round((actualSecretsCount / quotaConfig.secretsHard) * 100)}%
              </span>
            </div>
          </div>

          {/* Interactive Management Controls & LimitRange Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Quota Adjustment Form */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">
                    Hiệu Chỉnh Ngưỡng Quota ({quotaNamespace})
                  </h4>
                </div>
                <button
                  onClick={handleResetFreeTierQuota}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Chuẩn Free Tier</span>
                </button>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                {/* CPU Requests Hard Limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-300 font-medium">CPU Requests Limit (milli-cores):</label>
                    <span className="font-mono text-cyan-400 font-bold">
                      {quotaConfig.cpuRequestsHardM}m ({(quotaConfig.cpuRequestsHardM / 1000).toFixed(1)} vCPU)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="6000"
                    step="100"
                    value={quotaConfig.cpuRequestsHardM}
                    onChange={(e) => setQuotaConfig({ ...quotaConfig, cpuRequestsHardM: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>500m (0.5 core)</span>
                    <span>2000m (Khuyên dùng)</span>
                    <span>6000m (6 cores)</span>
                  </div>
                </div>

                {/* CPU Limits Hard Limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-300 font-medium">CPU Limits (Trần cực đại trước khi Throttle):</label>
                    <span className="font-mono text-blue-400 font-bold">
                      {quotaConfig.cpuLimitsHardM}m ({(quotaConfig.cpuLimitsHardM / 1000).toFixed(1)} vCPU)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="12000"
                    step="500"
                    value={quotaConfig.cpuLimitsHardM}
                    onChange={(e) => setQuotaConfig({ ...quotaConfig, cpuLimitsHardM: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1000m</span>
                    <span>4000m (Khuyên dùng)</span>
                    <span>12000m</span>
                  </div>
                </div>

                {/* Memory Requests Hard Limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-300 font-medium">Memory Requests Limit (MiB):</label>
                    <span className="font-mono text-emerald-400 font-bold">
                      {quotaConfig.memoryRequestsHardMi} MiB ({(quotaConfig.memoryRequestsHardMi / 1024).toFixed(1)} GiB)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={quotaConfig.memoryRequestsHardMi}
                    onChange={(e) => setQuotaConfig({ ...quotaConfig, memoryRequestsHardMi: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>512 MiB</span>
                    <span>2048 MiB (Khuyên dùng)</span>
                    <span>8192 MiB</span>
                  </div>
                </div>

                {/* Memory Limits Hard Limit */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <label className="text-slate-300 font-medium">Memory Limits (Trần OOM-Kill):</label>
                    <span className="font-mono text-purple-400 font-bold">
                      {quotaConfig.memoryLimitsHardMi} MiB ({(quotaConfig.memoryLimitsHardMi / 1024).toFixed(1)} GiB)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1024"
                    max="16384"
                    step="512"
                    value={quotaConfig.memoryLimitsHardMi}
                    onChange={(e) => setQuotaConfig({ ...quotaConfig, memoryLimitsHardMi: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1024 MiB</span>
                    <span>4096 MiB (Khuyên dùng)</span>
                    <span>16384 MiB</span>
                  </div>
                </div>

                {/* Pods & PVC Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-medium">Giới hạn số Pods:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="3"
                        max="30"
                        value={quotaConfig.maxPodsHard}
                        onChange={(e) => setQuotaConfig({ ...quotaConfig, maxPodsHard: Math.max(3, Number(e.target.value)) })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-purple-500 outline-none"
                      />
                      <span className="text-xs text-slate-400">pods</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 text-xs font-medium">Giới hạn PVCs:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={quotaConfig.pvcsHard}
                        onChange={(e) => setQuotaConfig({ ...quotaConfig, pvcsHard: Math.max(1, Number(e.target.value)) })}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-purple-500 outline-none"
                      />
                      <span className="text-xs text-slate-400">PVCs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setShowQuotaYamlModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Xem YAML</span>
                </button>

                <button
                  onClick={handleApplyQuota}
                  disabled={isApplyingQuota}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isApplyingQuota ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang áp dụng kubectl...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Áp Dụng Quota (kubectl apply)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 5 Cols: LimitRange Policy & Admission Control Rules */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Quy Chuẩn LimitRange Mặc Định
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Nếu một Pod được deploy mà không khai báo <code>resources.requests</code> hoặc <code>resources.limits</code>, Admission Webhook sẽ tự động gán giá trị mặc định sau để tránh tranh chấp CPU:
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Default Request CPU:</span>
                    <span className="text-cyan-300 font-bold">100m (0.1 core)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Default Request Memory:</span>
                    <span className="text-emerald-300 font-bold">128 MiB</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Default Limit CPU:</span>
                    <span className="text-blue-300 font-bold">300m (0.3 core)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Default Limit Memory:</span>
                    <span className="text-purple-300 font-bold">256 MiB</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Max Container CPU:</span>
                    <span className="text-amber-300 font-bold">1000m (1 core)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-400">Min Container CPU:</span>
                    <span className="text-slate-300 font-bold">50m (0.05 core)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    <span>Lợi ích cho Kiến trúc Free Tier</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bảo vệ hoàn toàn node pool không bị tràn bộ nhớ (Out-Of-Memory Panic) khi lưu lượng người dùng bùng nổ đột ngột.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Quota YAML Modal */}
      {showQuotaYamlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">
                  ResourceQuota &amp; LimitRange Manifest (k8s/resource-quota-{quotaNamespace}.yaml)
                </h3>
              </div>
              <button
                onClick={() => setShowQuotaYamlModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 overflow-x-auto max-h-96 leading-relaxed">
              <code>{generatedQuotaYaml}</code>
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">
                kubectl apply -f k8s/resource-quota-{quotaNamespace}.yaml
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyYaml}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {yamlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                  <span>{yamlCopied ? 'Đã sao chép' : 'Sao chép YAML'}</span>
                </button>
                <button
                  onClick={() => setShowQuotaYamlModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedPod && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Chi tiết Pod: {selectedPod.name}
              </h3>
              <button
                onClick={() => setSelectedPod(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Namespace:</span>
                <span className="text-slate-200">{selectedPod.namespace}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">IP nội bộ:</span>
                <span className="text-cyan-300">{selectedPod.ip}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Node gán:</span>
                <span className="text-slate-200">{selectedPod.node}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Thời gian chạy (Uptime):</span>
                <span className="text-emerald-400">{selectedPod.uptime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Số lần restart:</span>
                <span className="text-slate-200">{selectedPod.restarts} (Zero-failure)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-500">Giới hạn CPU:</span>
                <span className="text-amber-300">{selectedPod.cpuUsageM}m / {selectedPod.cpuLimitM}m</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Giới hạn Memory:</span>
                <span className="text-amber-300">{selectedPod.memUsageMi}Mi / {selectedPod.memLimitMi}Mi</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPod(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
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
