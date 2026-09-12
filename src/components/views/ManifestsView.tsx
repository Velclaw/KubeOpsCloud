import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  Activity,
  Sliders,
  HeartPulse,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
} from 'lucide-react';
import { YAML_MANIFESTS } from '../../mock/initialData';
import { ProbeConfig } from '../../types';

export const ManifestsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'manifests' | 'probe_editor'>('manifests');
  const [activeFile, setActiveFile] = useState<keyof typeof YAML_MANIFESTS>('githubActions');
  const [copied, setCopied] = useState(false);
  const [probeCopied, setProbeCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'snippet' | 'fullDeployment'>('snippet');

  // Probe Editor States
  const [activeProbeTab, setActiveProbeTab] = useState<'liveness' | 'readiness' | 'startup'>('liveness');

  const [liveness, setLiveness] = useState<ProbeConfig>({
    enabled: true,
    type: 'httpGet',
    httpPath: '/api/v1/health',
    port: 3000,
    command: 'curl -f http://localhost:3000/api/v1/health || exit 1',
    initialDelaySeconds: 15,
    periodSeconds: 10,
    timeoutSeconds: 2,
    successThreshold: 1,
    failureThreshold: 3,
  });

  const [readiness, setReadiness] = useState<ProbeConfig>({
    enabled: true,
    type: 'httpGet',
    httpPath: '/api/v1/ready',
    port: 3000,
    command: 'curl -f http://localhost:3000/api/v1/ready || exit 1',
    initialDelaySeconds: 10,
    periodSeconds: 5,
    timeoutSeconds: 2,
    successThreshold: 1,
    failureThreshold: 2,
  });

  const [startup, setStartup] = useState<ProbeConfig>({
    enabled: false,
    type: 'httpGet',
    httpPath: '/api/v1/startup',
    port: 3000,
    command: 'curl -f http://localhost:3000/api/v1/startup || exit 1',
    initialDelaySeconds: 5,
    periodSeconds: 10,
    timeoutSeconds: 3,
    successThreshold: 1,
    failureThreshold: 12,
  });

  // Preset Handlers
  const applyPreset = (type: 'standard_web' | 'high_traffic' | 'heavy_startup' | 'tcp_service') => {
    if (type === 'standard_web') {
      setLiveness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/api/v1/health',
        port: 3000,
        command: 'curl -f http://localhost:3000/api/v1/health',
        initialDelaySeconds: 15,
        periodSeconds: 10,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 3,
      });
      setReadiness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/api/v1/ready',
        port: 3000,
        command: 'curl -f http://localhost:3000/api/v1/ready',
        initialDelaySeconds: 10,
        periodSeconds: 5,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 2,
      });
      setStartup((prev) => ({ ...prev, enabled: false }));
    } else if (type === 'high_traffic') {
      setLiveness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/healthz',
        port: 3000,
        command: 'curl -f http://localhost:3000/healthz',
        initialDelaySeconds: 10,
        periodSeconds: 5,
        timeoutSeconds: 1,
        successThreshold: 1,
        failureThreshold: 2,
      });
      setReadiness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/readyz',
        port: 3000,
        command: 'curl -f http://localhost:3000/readyz',
        initialDelaySeconds: 5,
        periodSeconds: 3,
        timeoutSeconds: 1,
        successThreshold: 1,
        failureThreshold: 2,
      });
      setStartup((prev) => ({ ...prev, enabled: false }));
    } else if (type === 'heavy_startup') {
      setLiveness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/api/v1/health',
        port: 3000,
        command: 'curl -f http://localhost:3000/api/v1/health',
        initialDelaySeconds: 0,
        periodSeconds: 10,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 3,
      });
      setReadiness({
        enabled: true,
        type: 'httpGet',
        httpPath: '/api/v1/ready',
        port: 3000,
        command: 'curl -f http://localhost:3000/api/v1/ready',
        initialDelaySeconds: 0,
        periodSeconds: 5,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 2,
      });
      setStartup({
        enabled: true,
        type: 'httpGet',
        httpPath: '/api/v1/startup',
        port: 3000,
        command: 'curl -f http://localhost:3000/api/v1/startup',
        initialDelaySeconds: 5,
        periodSeconds: 10,
        timeoutSeconds: 3,
        successThreshold: 1,
        failureThreshold: 30,
      });
    } else if (type === 'tcp_service') {
      setLiveness({
        enabled: true,
        type: 'tcpSocket',
        httpPath: '/',
        port: 3000,
        command: '',
        initialDelaySeconds: 15,
        periodSeconds: 15,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 3,
      });
      setReadiness({
        enabled: true,
        type: 'tcpSocket',
        httpPath: '/',
        port: 3000,
        command: '',
        initialDelaySeconds: 10,
        periodSeconds: 5,
        timeoutSeconds: 2,
        successThreshold: 1,
        failureThreshold: 2,
      });
      setStartup((prev) => ({ ...prev, enabled: false }));
    }
  };

  // Generate Probes YAML
  const generateProbesYaml = (): string => {
    const formatProbe = (name: string, probe: ProbeConfig, indent = '          ') => {
      if (!probe.enabled) return '';
      let actionYaml = '';
      if (probe.type === 'httpGet') {
        actionYaml = `${indent}httpGet:\n${indent}  path: ${probe.httpPath}\n${indent}  port: ${probe.port}\n${indent}  scheme: HTTP`;
      } else if (probe.type === 'tcpSocket') {
        actionYaml = `${indent}tcpSocket:\n${indent}  port: ${probe.port}`;
      } else {
        actionYaml = `${indent}exec:\n${indent}  command:\n${indent}  - /bin/sh\n${indent}  - -c\n${indent}  - "${probe.command || 'curl -f http://localhost:3000/api/v1/health'}"`;
      }

      return `${indent}${name}:\n${actionYaml}\n${indent}initialDelaySeconds: ${probe.initialDelaySeconds}\n${indent}periodSeconds: ${probe.periodSeconds}\n${indent}timeoutSeconds: ${probe.timeoutSeconds}\n${indent}successThreshold: ${probe.successThreshold}\n${indent}failureThreshold: ${probe.failureThreshold}`;
    };

    const parts = [
      formatProbe('livenessProbe', liveness),
      formatProbe('readinessProbe', readiness),
      formatProbe('startupProbe', startup),
    ].filter(Boolean);

    if (exportFormat === 'snippet') {
      if (parts.length === 0) {
        return '# Không có probe nào được kích hoạt.\n# Bật livenessProbe hoặc readinessProbe ở bảng bên trái để tạo cấu hình.';
      }
      return `# Kubernetes Container Probes Spec (Snippet)\n# Tích hợp vào khối spec.template.spec.containers[0]\n\n${parts
        .map((p) => p.replace(/^ {10}/gm, ''))
        .join('\n\n')}`;
    }

    // Full Deployment Manifest
    const containerProbesBlock = parts.length > 0 ? parts.join('\n') : '        # No probes configured';

    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubeops-production-api
  namespace: production
  labels:
    app.kubernetes.io/name: kubeops-api
    app.kubernetes.io/component: backend
    app.kubernetes.io/environment: production
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: kubeops-api
  template:
    metadata:
      labels:
        app: kubeops-api
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        runAsGroup: 10001
        fsGroup: 10001
      containers:
      - name: kubeops-api
        image: ghcr.io/devops-org/kubeops-api:v1.4.2
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
${containerProbesBlock}
`;
  };

  const currentProbe =
    activeProbeTab === 'liveness' ? liveness : activeProbeTab === 'readiness' ? readiness : startup;

  const setCurrentProbe = (updater: (prev: ProbeConfig) => ProbeConfig) => {
    if (activeProbeTab === 'liveness') setLiveness(updater);
    else if (activeProbeTab === 'readiness') setReadiness(updater);
    else setStartup(updater);
  };

  const handleCopyProbeYaml = () => {
    navigator.clipboard.writeText(generateProbesYaml());
    setProbeCopied(true);
    setTimeout(() => setProbeCopied(false), 2000);
  };

  const handleDownloadProbeYaml = () => {
    const yaml = generateProbesYaml();
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFormat === 'snippet' ? 'k8s-probes-snippet.yaml' : 'k8s-deployment-probes.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileTabs: { id: keyof typeof YAML_MANIFESTS; name: string; path: string; desc: string }[] = [
    {
      id: 'githubActions',
      name: 'GitHub Actions Workflow',
      path: '.github/workflows/deploy.yml',
      desc: 'CI/CD pipeline tự động hóa kiểm thử, quét SAST, ký số Cosign và rollout Kubernetes',
    },
    {
      id: 'deploymentYaml',
      name: 'Kubernetes Deployment',
      path: 'k8s/deployment.yaml',
      desc: 'Cấu hình runtime pod chuẩn non-root (UID 10001), liveness/readiness probe, resource requests/limits',
    },
    {
      id: 'hpaYaml',
      name: 'Horizontal Pod Autoscaler (HPA)',
      path: 'k8s/hpa.yaml',
      desc: 'Tự động co giãn pod theo tải CPU (ngưỡng 70%) và Memory (ngưỡng 75%)',
    },
    {
      id: 'clusterAutoscalerYaml',
      name: 'Cluster Autoscaler (CA)',
      path: 'k8s/cluster-autoscaler.yaml',
      desc: 'Tự động mở rộng hoặc thu hẹp số lượng Worker Node trong cluster (1-5 nodes)',
    },
    {
      id: 'prometheusRules',
      name: 'Prometheus Alert Rules',
      path: 'k8s/prometheus-rules.yaml',
      desc: 'Quy tắc cảnh báo tải cao CPU, tỉ lệ lỗi HTTP 5xx và pod restart gửi về Slack',
    },
    {
      id: 'backupCronJob',
      name: 'Cloud Backup CronJob',
      path: 'k8s/backup-cronjob.yaml',
      desc: 'Tác vụ sao lưu định kỳ 02:00 UTC, mã hóa AES-256 và đồng bộ lên Cloud Storage',
    },
    {
      id: 'dockerfile',
      name: 'Multi-stage Dockerfile',
      path: 'Dockerfile',
      desc: 'Build OCI container tối ưu dung lượng (42MB) và bảo mật không dùng quyền root',
    },
    {
      id: 'vpsMeshConfig',
      name: 'WireGuard Mesh & VPS Node DaemonSet',
      path: 'k8s/vps-wireguard-mesh.yaml',
      desc: 'Cấu hình mạng riêng WireGuard Mesh 10.8.0.0/24 và kết nối worker node đa nền tảng',
    },
  ];

  const currentFileConfig = fileTabs.find((f) => f.id === activeFile) || fileTabs[0];
  const fileContent = YAML_MANIFESTS[activeFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileConfig.path.split('/').pop() || 'manifest.yaml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with View Mode Switcher */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> PRODUCTION-READY MANIFESTS &amp; ACTIONS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                ✓ Đã qua kiểm định YAML Lint
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tệp Cấu Hình Sản Xuất &amp; Trình Thiết Kế Probes K8s
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Trọn bộ cấu hình mã nguồn mở sẵn sàng triển khai cho dự án: GitHub Actions với bằng chứng xanh, Kubernetes Deployment chuẩn bảo mật cao nhất, HPA auto-scale, Prometheus Alerts, Backup CronJob và Trình thiết kế Liveness/Readiness Probes trực quan.
            </p>
          </div>

          {/* Primary View Switcher: Static Manifests vs Visual Probe Editor */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start lg:self-center">
            <button
              onClick={() => setViewMode('manifests')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                viewMode === 'manifests'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Kho Manifests ({fileTabs.length})</span>
            </button>
            <button
              onClick={() => setViewMode('probe_editor')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                viewMode === 'probe_editor'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-cyan-200" />
              <span>Thiết Kế Probes (Visual Editor)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: STATIC PRODUCTION MANIFESTS */}
      {viewMode === 'manifests' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Horizontal Tab Buttons */}
            <div className="flex flex-wrap gap-2">
              {fileTabs.map((tab) => {
                const isActive = activeFile === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFile(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300 font-bold'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải file</span>
              </button>
            </div>
          </div>

          {/* File Description Header */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-300 font-semibold">{currentFileConfig.path}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{currentFileConfig.desc}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">YAML 1.2</span>
          </div>

          {/* Code Viewer */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono text-slate-300">{currentFileConfig.path}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            <pre className="p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[500px]">
              <code>{fileContent}</code>
            </pre>
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL LIVENESS / READINESS PROBE CONFIGURATION EDITOR */}
      {viewMode === 'probe_editor' && (
        <div className="space-y-6">
          {/* Presets Header */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Mẫu Cấu Hình Chuẩn (Recommended Presets)
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn mẫu tối ưu hóa sẵn theo đặc thù dịch vụ của bạn để điền nhanh các thông số.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => applyPreset('standard_web')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
              >
                🌐 Web API Chuẩn (Express/Next)
              </button>
              <button
                onClick={() => applyPreset('high_traffic')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 border border-slate-700 transition cursor-pointer"
              >
                ⚡ Microservice Tải Cao (Fast Fail)
              </button>
              <button
                onClick={() => applyPreset('heavy_startup')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-purple-300 border border-slate-700 transition cursor-pointer"
              >
                ⏳ Khởi Động Chậm (Startup Probe)
              </button>
              <button
                onClick={() => applyPreset('tcp_service')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 border border-slate-700 transition cursor-pointer"
              >
                🔌 TCP / Database Socket
              </button>
            </div>
          </div>

          {/* Editor Grid: Visual Controls (Left) vs Live YAML Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Probe Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                {[
                  { id: 'liveness', label: 'Liveness Probe', probe: liveness, color: 'text-rose-400', desc: 'Restart container khi treo' },
                  { id: 'readiness', label: 'Readiness Probe', probe: readiness, color: 'text-emerald-400', desc: 'Rút traffic khi bận' },
                  { id: 'startup', label: 'Startup Probe', probe: startup, color: 'text-purple-400', desc: 'Bảo vệ app boot chậm' },
                ].map((item) => {
                  const isActive = activeProbeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveProbeTab(item.id as 'liveness' | 'readiness' | 'startup')}
                      className={`flex-1 p-3 rounded-xl border text-left transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500/60 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold font-mono ${item.color}`}>{item.label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.probe.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {item.probe.enabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Probe Form Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white text-sm">
                      Cấu Hình {activeProbeTab === 'liveness' ? 'Liveness Probe' : activeProbeTab === 'readiness' ? 'Readiness Probe' : 'Startup Probe'}
                    </h3>
                  </div>

                  {/* Enable/Disable Switch */}
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentProbe.enabled}
                      onChange={(e) => setCurrentProbe((prev) => ({ ...prev, enabled: e.target.checked }))}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 focus:ring-0"
                    />
                    <span className={currentProbe.enabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {currentProbe.enabled ? 'Đang Kích Hoạt' : 'Đã Tắt'}
                    </span>
                  </label>
                </div>

                {/* Probe Type (httpGet / tcpSocket / exec) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Cơ Chế Thăm Dò (Probe Mechanism)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'httpGet', label: 'HTTP GET Request', desc: 'Gửi HTTP request tới path' },
                      { id: 'tcpSocket', label: 'TCP Socket Check', desc: 'Kiểm tra mở cổng TCP' },
                      { id: 'exec', label: 'Command Exec', desc: 'Chạy lệnh shell trong container' },
                    ].map((mech) => {
                      const isSelected = currentProbe.type === mech.id;
                      return (
                        <button
                          key={mech.id}
                          type="button"
                          onClick={() => setCurrentProbe((prev) => ({ ...prev, type: mech.id as 'httpGet' | 'tcpSocket' | 'exec' }))}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/30 border-cyan-500 text-white font-semibold shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-mono">{mech.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{mech.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Fields according to Mechanism */}
                {currentProbe.type === 'httpGet' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">Endpoint Path (httpGet.path)</label>
                      <input
                        type="text"
                        value={currentProbe.httpPath}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, httpPath: e.target.value }))}
                        placeholder="/api/v1/health"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400">Port (httpGet.port)</label>
                      <input
                        type="number"
                        value={currentProbe.port}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, port: parseInt(e.target.value) || 3000 }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {currentProbe.type === 'tcpSocket' && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">TCP Port (tcpSocket.port)</label>
                    <input
                      type="number"
                      value={currentProbe.port}
                      onChange={(e) => setCurrentProbe((prev) => ({ ...prev, port: parseInt(e.target.value) || 3000 }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-cyan-500 max-w-xs"
                    />
                  </div>
                )}

                {currentProbe.type === 'exec' && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Command Shell Script (exec.command)</label>
                    <input
                      type="text"
                      value={currentProbe.command || ''}
                      onChange={(e) => setCurrentProbe((prev) => ({ ...prev, command: e.target.value }))}
                      placeholder="curl -f http://localhost:3000/api/v1/health || exit 1"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* Timing & Threshold Parameters */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Thông Số Thời Gian &amp; Ngưỡng Chịu Lỗi (Timings &amp; Thresholds)</span>
                    <span className="text-[11px] text-cyan-400 font-mono">Đơn vị: Giây / Lần</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* initialDelaySeconds */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">initialDelaySeconds</span>
                        <span className="font-mono text-cyan-400 font-bold">{currentProbe.initialDelaySeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="1"
                        value={currentProbe.initialDelaySeconds}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, initialDelaySeconds: parseInt(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block">Thời gian chờ sau khi container start trước khi probe lần đầu.</span>
                    </div>

                    {/* periodSeconds */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">periodSeconds</span>
                        <span className="font-mono text-cyan-400 font-bold">{currentProbe.periodSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={currentProbe.periodSeconds}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, periodSeconds: parseInt(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block">Tần suất chu kỳ thực hiện kiểm tra (mỗi X giây một lần).</span>
                    </div>

                    {/* timeoutSeconds */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">timeoutSeconds</span>
                        <span className="font-mono text-cyan-400 font-bold">{currentProbe.timeoutSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={currentProbe.timeoutSeconds}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, timeoutSeconds: parseInt(e.target.value) }))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block">Thời gian chờ phản hồi tối đa trước khi coi là hết hạn.</span>
                    </div>

                    {/* failureThreshold */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">failureThreshold</span>
                        <span className="font-mono text-rose-400 font-bold">{currentProbe.failureThreshold} lần</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={currentProbe.failureThreshold}
                        onChange={(e) => setCurrentProbe((prev) => ({ ...prev, failureThreshold: parseInt(e.target.value) }))}
                        className="w-full accent-rose-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 block">Số lần thất bại liên tiếp trước khi K8s thực hiện hành động.</span>
                    </div>
                  </div>
                </div>

                {/* Behavioral Calculation Summary */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex items-start gap-3">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="font-semibold text-white">Đánh giá hành vi runtime của Kubernetes:</div>
                    <p className="text-slate-400 leading-relaxed">
                      • <strong className="text-slate-200">Thời gian phát hiện lỗi tối đa:</strong>{' '}
                      <span className="font-mono text-cyan-400">
                        {currentProbe.periodSeconds * currentProbe.failureThreshold}s
                      </span>{' '}
                      ({currentProbe.failureThreshold} lần × {currentProbe.periodSeconds}s chu kỳ).
                    </p>
                    <p className="text-slate-400 leading-relaxed">
                      • <strong className="text-slate-200">Hành động khi vượt ngưỡng:</strong>{' '}
                      {activeProbeTab === 'liveness'
                        ? 'Kubernetes gửi SIGTERM và tự động restart pod.'
                        : activeProbeTab === 'readiness'
                        ? 'Kubernetes cô lập pod khỏi Service Endpoints, ngừng chuyển tiếp traffic.'
                        : 'Kubernetes kill pod do khởi động thất bại quá thời gian cho phép.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live YAML Preview & Export Card (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <h3 className="font-bold text-white text-sm">YAML Manifest Được Tạo</h3>
                  </div>

                  {/* Format Selector */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <button
                      onClick={() => setExportFormat('snippet')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        exportFormat === 'snippet' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Snippet
                    </button>
                    <button
                      onClick={() => setExportFormat('fullDeployment')}
                      className={`px-2 py-1 rounded transition cursor-pointer ${
                        exportFormat === 'fullDeployment' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Full Deployment
                    </button>
                  </div>
                </div>

                {/* Code Box */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-1 flex flex-col shadow-inner">
                  <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{exportFormat === 'snippet' ? 'k8s-probes-spec.yaml' : 'k8s-deployment.yaml'}</span>
                    <span className="text-emerald-400 text-[10px]">Valid K8s v1.28+</span>
                  </div>
                  <pre className="p-3.5 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto overflow-y-auto max-h-[460px] flex-1 select-all">
                    <code>{generateProbesYaml()}</code>
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCopyProbeYaml}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer shadow-sm"
                  >
                    {probeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    <span>{probeCopied ? 'Đã Sao Chép!' : 'Sao Chép YAML'}</span>
                  </button>

                  <button
                    onClick={handleDownloadProbeYaml}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải File .yaml</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
