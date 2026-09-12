import React, { useState } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Plus,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Power,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Network,
  Download,
  Copy,
  Check,
  Lock,
  Search,
  Filter,
  ArrowRight,
  Database,
  Cloud,
  Globe,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  RotateCcw,
  X,
  AlertOctagon,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VpsServer, VpsProvider, VpsRole, VpsStatus } from '../../types';
import { VpsTerminalWidget } from '../vps/VpsTerminalWidget';

interface VpsViewProps {
  vpsList: VpsServer[];
  onAddVps: (vps: Omit<VpsServer, 'id' | 'cpuUsagePercent' | 'ramUsagePercent' | 'diskUsagePercent' | 'uptime' | 'loadAvg'>) => void;
  onToggleK8sAttach: (id: string) => void;
  onRebootVps: (id: string) => void;
  onDeleteVps: (id: string) => void;
  onBulkRebootVps?: (ids: string[]) => void;
  onBulkDeleteVps?: (ids: string[]) => void;
}

export const VpsView: React.FC<VpsViewProps> = ({
  vpsList,
  onAddVps,
  onToggleK8sAttach,
  onRebootVps,
  onDeleteVps,
  onBulkRebootVps,
  onBulkDeleteVps,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTerminalVpsId, setSelectedTerminalVpsId] = useState<string>(
    vpsList.length > 0 ? vpsList[0].id : ''
  );
  const [copiedBootstrap, setCopiedBootstrap] = useState(false);
  const [bootstrapModalOpen, setBootstrapModalOpen] = useState(false);

  // Multi-select & Bulk Actions State
  const [selectedVpsIds, setSelectedVpsIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkRebooting, setIsBulkRebooting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // New VPS Form State
  const [newName, setNewName] = useState('');
  const [newProvider, setNewProvider] = useState<VpsProvider>('oracle');
  const [newRole, setNewRole] = useState<VpsRole>('k8s-worker');
  const [newIpPublic, setNewIpPublic] = useState('');
  const [newRegion, setNewRegion] = useState('ap-singapore-1');
  const [newOs, setNewOs] = useState('Ubuntu 24.04 LTS (aarch64)');
  const [newCpuCores, setNewCpuCores] = useState(4);
  const [newArch, setNewArch] = useState<'arm64' | 'x86_64'>('arm64');
  const [newRamGb, setNewRamGb] = useState(24);
  const [newDiskGb, setNewDiskGb] = useState(100);
  const [newCost, setNewCost] = useState(0);
  const [newIsFreeTier, setNewIsFreeTier] = useState(true);
  const [newSshUser, setNewSshUser] = useState('ubuntu');
  const [newSshPort, setNewSshPort] = useState(22);

  // Totals calculations
  const totalCores = vpsList.reduce((acc, v) => acc + v.cpuCores, 0);
  const totalRam = vpsList.reduce((acc, v) => acc + v.ramGb, 0);
  const totalDisk = vpsList.reduce((acc, v) => acc + v.diskGb, 0);
  const totalCost = vpsList.reduce((acc, v) => acc + v.monthlyCostUsd, 0);
  const k8sAttachedCount = vpsList.filter((v) => v.k8sAttached).length;
  const freeTierCount = vpsList.filter((v) => v.isFreeTier).length;

  // Filtered list
  const filteredVps = vpsList.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ipPublic.includes(searchQuery) ||
      v.ipMesh.includes(searchQuery) ||
      v.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || v.role === roleFilter;
    const matchesProvider = providerFilter === 'ALL' || v.provider === providerFilter;
    return matchesSearch && matchesRole && matchesProvider;
  });

  // Multi-select helpers
  const handleToggleSelect = (id: string) => {
    setSelectedVpsIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected =
    filteredVps.length > 0 && filteredVps.every((v) => selectedVpsIds.includes(v.id));
  const isSomeFilteredSelected =
    filteredVps.some((v) => selectedVpsIds.includes(v.id)) && !isAllFilteredSelected;

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredVps.map((v) => v.id));
      setSelectedVpsIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const combined = new Set([...selectedVpsIds, ...filteredVps.map((v) => v.id)]);
      setSelectedVpsIds(Array.from(combined));
    }
  };

  const handleClearSelection = () => {
    setSelectedVpsIds([]);
  };

  // Bulk action: Reboot
  const handleExecuteBulkReboot = () => {
    if (selectedVpsIds.length === 0) return;
    setIsBulkRebooting(true);
    const count = selectedVpsIds.length;
    if (onBulkRebootVps) {
      onBulkRebootVps(selectedVpsIds);
    } else {
      selectedVpsIds.forEach((id) => onRebootVps(id));
    }
    showToast(`Đang đồng loạt khởi động lại ${count} máy chủ VPS... Hệ thống sẽ hoàn tất trong giây lát.`, 'info');
    setTimeout(() => {
      setIsBulkRebooting(false);
      showToast(`Đã khởi động lại thành công ${count} máy chủ VPS!`, 'success');
    }, 2500);
  };

  // Bulk action: Delete
  const handleExecuteBulkDelete = () => {
    if (selectedVpsIds.length === 0) return;
    const count = selectedVpsIds.length;
    if (onBulkDeleteVps) {
      onBulkDeleteVps(selectedVpsIds);
    } else {
      selectedVpsIds.forEach((id) => onDeleteVps(id));
    }
    setIsBulkDeleteModalOpen(false);
    setSelectedVpsIds([]);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    showToast(`Đã xóa vĩnh viễn ${count} máy chủ VPS khỏi cụm và gỡ kết nối WireGuard.`, 'warning');
  };

  // Selected VPS aggregations
  const selectedServers = vpsList.filter((v) => selectedVpsIds.includes(v.id));
  const selectedTotalCpu = selectedServers.reduce((acc, v) => acc + v.cpuCores, 0);
  const selectedTotalRam = selectedServers.reduce((acc, v) => acc + v.ramGb, 0);
  const selectedTotalDisk = selectedServers.reduce((acc, v) => acc + v.diskGb, 0);
  const selectedK8sCount = selectedServers.filter((v) => v.k8sAttached).length;
  const selectedTotalCost = selectedServers.reduce((acc, v) => acc + v.monthlyCostUsd, 0);

  const handleCreateVps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newIpPublic) return;

    // Generate mesh IP (e.g. 10.8.0.X)
    const nextMeshId = vpsList.length + 2;
    const meshIp = `10.8.0.${nextMeshId}`;

    onAddVps({
      name: newName.toLowerCase().replace(/\s+/g, '-'),
      provider: newProvider,
      role: newRole,
      status: 'running',
      ipPublic: newIpPublic,
      ipMesh: meshIp,
      region: newRegion,
      os: newOs,
      cpuCores: newCpuCores,
      cpuArchitecture: newArch,
      ramGb: newRamGb,
      diskGb: newDiskGb,
      monthlyCostUsd: newIsFreeTier ? 0 : newCost,
      isFreeTier: newIsFreeTier,
      k8sAttached: newRole === 'k8s-worker' || newRole === 'k8s-master',
      dockerVersion: '26.1.3',
      sshUser: newSshUser,
      sshPort: newSshPort,
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewIpPublic('');
  };

  const getProviderBadge = (provider: VpsProvider) => {
    switch (provider) {
      case 'oracle':
        return { label: 'Oracle Cloud (OCI)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'gcp':
        return { label: 'Google Cloud (GCP)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'aws':
        return { label: 'Amazon AWS', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
      case 'hetzner':
        return { label: 'Hetzner Cloud', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      case 'digitalocean':
        return { label: 'DigitalOcean', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      default:
        return { label: 'Self-Hosted / Custom', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
    }
  };

  const getRoleBadge = (role: VpsRole) => {
    switch (role) {
      case 'k8s-worker':
        return { label: 'K8s Worker Node', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      case 'k8s-master':
        return { label: 'K8s Control Plane', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
      case 'database':
        return { label: 'Database & Cache (PostgreSQL/Redis)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'ingress-proxy':
        return { label: 'Ingress & SSL Edge Proxy', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'cicd-runner':
        return { label: 'CI/CD GitHub Actions Runner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'monitoring':
        return { label: 'Prometheus & Loki Monitor', color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' };
    }
  };

  const bootstrapScript = `# 1. Cập nhật hệ thống & cài đặt WireGuard VPN Mesh Interconnect
sudo apt-get update && sudo apt-get install -y wireguard curl containerd

# 2. Cấu hình IP Mesh kết nối an toàn với Master K8s
sudo cat <<EOF > /etc/wireguard/wg0.conf
[Interface]
Address = 10.8.0.x/24
PrivateKey = <CLIENT_PRIVATE_KEY>
ListenPort = 51820

[Peer]
PublicKey = <MASTER_PUBLIC_KEY>
Endpoint = 140.238.12.89:51820
AllowedIPs = 10.8.0.0/24
PersistentKeepalive = 25
EOF

sudo systemctl enable --now wg-quick@wg0

# 3. Nạp K3s Agent kết nối máy chủ VPS vào Kubernetes Cluster
curl -sfL https://get.k3s.io | K3S_URL=https://10.8.0.1:6443 K3S_TOKEN=K109fa739b8214fa7sh9102481 sh -

# 4. Kiểm tra trạng thái Node
kubectl get nodes -o wide`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> HYBRID VPS FLEET MANAGEMENT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                ✓ WireGuard Mesh 10.8.0.0/24 Active
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {freeTierCount}/{vpsList.length} Always Free ($0.00/mo)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Quản Trị Cụm Máy Chủ VPS Đa Nền Tảng (Hybrid Cloud Fleet)
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Tích hợp và quản lý toàn bộ các máy chủ VPS (Oracle Cloud Ampere Free Tier, GCP Compute, AWS Lightsail, Hetzner, DigitalOcean) kết nối liên thông qua mạng bảo mật mã hóa WireGuard Mesh, gắn trực tiếp làm Worker Node cho Kubernetes hoặc chạy Database &amp; CI/CD Runner độc lập.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBootstrapModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer shadow-sm"
            >
              <Terminal className="w-4 h-4" />
              <span>Lệnh Bootstrap Join K8s</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Máy Chủ VPS Mới</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Tổng Số VPS</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>{vpsList.length} Nodes</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">100% Hoạt Động</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Tổng CPU Compute</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>{totalCores} Cores</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">ARM64 &amp; x86_64</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Tổng Bộ Nhớ RAM</span>
            <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>{totalRam} GB</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">ECC &amp; High-Speed</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Ổ Cứng NVMe/SSD</span>
            <div className="text-lg font-bold font-mono text-purple-400 mt-0.5 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              <span>{totalDisk} GB</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Storage Phân Tán</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Gắn Vào Kubernetes</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <Network className="w-4 h-4" />
              <span>{k8sAttachedCount}/{vpsList.length} Nodes</span>
            </div>
            <span className="text-[10px] text-cyan-400 mt-1 block">K3s Worker Cluster</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-mono">Chi Phí Hàng Tháng</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>${totalCost.toFixed(2)}/tháng</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">Tiết kiệm 95% phí Cloud</span>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono shadow-xl transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedVpsIds.length > 0 && (
        <div className="sticky top-2 z-30 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-950/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                <CheckSquare className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-xs sm:text-sm text-white font-mono block">
                  Đã chọn {selectedVpsIds.length} / {vpsList.length} máy chủ
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Thao tác đồng loạt trên các VPS đã chọn
                </span>
              </div>
            </div>

            {/* Selected Hardware Aggregation Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-300">
                {selectedTotalCpu} vCPU
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-blue-300">
                {selectedTotalRam} GB RAM
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-purple-300">
                {selectedTotalDisk} GB NVMe
              </span>
              {selectedK8sCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                  {selectedK8sCount} Node K8s
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300">
                ${selectedTotalCost.toFixed(2)}/tháng
              </span>
            </div>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExecuteBulkReboot}
              disabled={isBulkRebooting}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Khởi động lại đồng loạt các máy chủ đã chọn"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isBulkRebooting ? 'animate-spin text-amber-400' : ''}`} />
              <span>Khởi Động Lại ({selectedVpsIds.length})</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              title="Xóa đồng loạt các máy chủ đã chọn khỏi hệ thống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hàng Loạt ({selectedVpsIds.length})</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 max-w-md">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên máy chủ, IP Public, IP Mesh, Vùng..."
            className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Select All Filtered Toggle */}
          <button
            onClick={handleToggleSelectAll}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition cursor-pointer select-none ${
              isAllFilteredSelected
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                : isSomeFilteredSelected
                ? 'bg-slate-950 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Chọn hoặc bỏ chọn tất cả máy chủ trong danh sách đang lọc"
          >
            {isAllFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : isSomeFilteredSelected ? (
              <MinusSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Chọn tất cả ({filteredVps.length})</span>
          </button>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono outline-none"
          >
            <option value="ALL">Mọi Nhà Cung Cấp</option>
            <option value="oracle">Oracle Cloud (OCI)</option>
            <option value="gcp">Google Cloud (GCP)</option>
            <option value="aws">Amazon AWS</option>
            <option value="hetzner">Hetzner Cloud</option>
            <option value="digitalocean">DigitalOcean</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono outline-none"
          >
            <option value="ALL">Mọi Vai Trò (Roles)</option>
            <option value="k8s-worker">K8s Worker Node</option>
            <option value="database">Database & Redis</option>
            <option value="ingress-proxy">Ingress Edge Proxy</option>
            <option value="cicd-runner">CI/CD Runner</option>
            <option value="monitoring">Prometheus & Loki</option>
          </select>
        </div>
      </div>

      {/* VPS Server Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredVps.map((vps) => {
          const providerBadge = getProviderBadge(vps.provider);
          const roleBadge = getRoleBadge(vps.role);
          const isSelected = selectedVpsIds.includes(vps.id);

          return (
            <div
              key={vps.id}
              className={`p-5 rounded-2xl transition-all space-y-4 shadow-lg flex flex-col justify-between relative ${
                isSelected
                  ? 'bg-slate-900/95 border-2 border-cyan-500/80 ring-1 ring-cyan-500/30 shadow-cyan-950/40'
                  : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(vps.id);
                      }}
                      className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                          : 'bg-slate-950/80 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                      }`}
                      title={isSelected ? 'Bỏ chọn máy chủ này' : 'Chọn máy chủ này để thực hiện thao tác hàng loạt'}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-300" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${providerBadge.color}`}>
                      {providerBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vps.status === 'running'
                          ? 'bg-emerald-400 animate-pulse'
                          : vps.status === 'rebooting'
                          ? 'bg-amber-400 animate-spin'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="text-[11px] font-mono text-slate-300 capitalize">{vps.status}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                      {vps.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{vps.region}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      vps.isFreeTier
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {vps.isFreeTier ? 'Always Free $0.00' : `$${vps.monthlyCostUsd.toFixed(2)}/tháng`}
                  </span>
                </div>

                {/* Role Pill */}
                <div className="mt-2.5">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              {/* IP & System Info Box */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Public IP:</span>
                  <span className="text-cyan-300 font-semibold">{vps.ipPublic}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Mesh IP (WireGuard):</span>
                  <span className="text-emerald-400 font-semibold">{vps.ipMesh}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">HĐH / Kiến Trúc:</span>
                  <span className="text-slate-300 truncate max-w-[170px]" title={vps.os}>
                    {vps.os.split(' ')[0]} ({vps.cpuArchitecture})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Uptime / Load Avg:</span>
                  <span className="text-slate-400">{vps.uptime} • {vps.loadAvg.split(',')[0]}</span>
                </div>
              </div>

              {/* Specs & Resource Usage Bars */}
              <div className="space-y-2.5">
                {/* Hardware summary chips */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{vps.cpuCores} vCPU</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{vps.ramGb} GB RAM</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{vps.diskGb} GB NVMe</span>
                </div>

                {/* CPU Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">CPU Usage:</span>
                    <span className={vps.cpuUsagePercent > 80 ? 'text-rose-400 font-bold' : 'text-cyan-400'}>
                      {vps.cpuUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        vps.cpuUsagePercent > 80 ? 'bg-rose-500' : vps.cpuUsagePercent > 60 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${vps.cpuUsagePercent}%` }}
                    />
                  </div>
                </div>

                {/* RAM Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">RAM Usage:</span>
                    <span className={vps.ramUsagePercent > 80 ? 'text-rose-400 font-bold' : 'text-indigo-400'}>
                      {vps.ramUsagePercent}% ({((vps.ramGb * vps.ramUsagePercent) / 100).toFixed(1)} GB)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        vps.ramUsagePercent > 80 ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${vps.ramUsagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Disk Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">Disk Usage:</span>
                    <span className="text-purple-400">
                      {vps.diskUsagePercent}% ({Math.round((vps.diskGb * vps.diskUsagePercent) / 100)} GB)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{ width: `${vps.diskUsagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* K8s Toggle & Card Actions */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vps.k8sAttached ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-[11px] text-slate-300 font-medium">
                      {vps.k8sAttached ? 'Kubernetes Node (Active)' : 'Standalone Host'}
                    </span>
                  </div>

                  <button
                    onClick={() => onToggleK8sAttach(vps.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                      vps.k8sAttached
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {vps.k8sAttached ? 'Tách khỏi K8s' : 'Gắn vào K8s'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedTerminalVpsId(vps.id);
                      const el = document.getElementById('vps-ssh-terminal-widget');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 transition cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Web SSH</span>
                  </button>

                  <button
                    onClick={() => onRebootVps(vps.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                    title="Khởi động lại VPS (Reboot)"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteVps(vps.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
                    title="Xóa máy chủ khỏi hệ thống"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Browser-Based SSH Terminal Widget */}
      <VpsTerminalWidget
        vpsList={vpsList}
        selectedVpsId={selectedTerminalVpsId}
        onSelectVps={(id) => setSelectedTerminalVpsId(id)}
        onRebootVps={onRebootVps}
      />

      {/* WireGuard Hybrid Mesh Topology Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              Kiến Trúc Mạng WireGuard Hybrid Multi-Cloud Interconnect
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> ChaCha20-Poly1305 Encrypted (Zero Egress Cost)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
              <Globe className="w-4 h-4 text-cyan-400" /> 1. Đa Đám Mây Không Phụ Thuộc (Vendor Free)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tận dụng 4 vCPU / 24GB RAM miễn phí vĩnh viễn từ Oracle Cloud kết hợp máy chủ GCP và AWS. Không lo bị khóa chặt vào một nhà cung cấp duy nhất.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 font-mono">
              <Lock className="w-4 h-4 text-emerald-400" /> 2. Mạng Ảo Riêng Tư WireGuard (10.8.0.0/24)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Tất cả các VPS giao tiếp với nhau qua đường hầm mã hóa tốc độ cao ở kernel-level, các cổng K8s (6443, 10250) đóng hoàn toàn với Internet công cộng.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-bold text-purple-300 flex items-center gap-1.5 font-mono">
              <Layers className="w-4 h-4 text-purple-400" /> 3. Tự Động Failover &amp; HPA Co Giãn
            </div>
            <p className="text-slate-400 leading-relaxed">
              Khi lưu lượng tăng vọt, các Pod được điều phối sang máy chủ VPS còn rảnh bộ nhớ hoặc tự động bổ sung VPS mới vào Pool trong vòng 45 giây.
            </p>
          </div>
        </div>
      </div>

      {/* Modal 1: Add New VPS Server */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Thêm Máy Chủ VPS Mới Vào Hệ Thống</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVps} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Tên Máy Chủ (Hostname)</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="vps-oracle-worker-03"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Địa Chỉ Public IP</label>
                  <input
                    type="text"
                    required
                    value={newIpPublic}
                    onChange={(e) => setNewIpPublic(e.target.value)}
                    placeholder="140.238.25.101"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nhà Cung Cấp (Provider)</label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value as VpsProvider)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  >
                    <option value="oracle">Oracle Cloud (OCI Always Free)</option>
                    <option value="gcp">Google Cloud Platform (GCP)</option>
                    <option value="aws">Amazon Web Services (AWS)</option>
                    <option value="hetzner">Hetzner Cloud</option>
                    <option value="digitalocean">DigitalOcean Droplet</option>
                    <option value="custom">Self-Hosted / Private Datacenter</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Vai Trò Đảm Nhận (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as VpsRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  >
                    <option value="k8s-worker">Kubernetes Worker Node</option>
                    <option value="k8s-master">Kubernetes Control Plane</option>
                    <option value="database">Database &amp; Redis Cache</option>
                    <option value="ingress-proxy">Ingress Edge Reverse Proxy (TLS)</option>
                    <option value="cicd-runner">CI/CD GitHub Actions Self-Hosted Runner</option>
                    <option value="monitoring">Prometheus &amp; Grafana Server</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Khu Vực (Region / Datacenter)</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="ap-singapore-1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Hệ Điều Hành (OS)</label>
                  <select
                    value={newOs}
                    onChange={(e) => {
                      setNewOs(e.target.value);
                      if (e.target.value.includes('aarch64')) setNewArch('arm64');
                      else setNewArch('x86_64');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  >
                    <option value="Ubuntu 24.04 LTS (aarch64)">Ubuntu 24.04 LTS (ARM64 Ampere)</option>
                    <option value="Ubuntu 24.04 LTS (x86_64)">Ubuntu 24.04 LTS (x86_64)</option>
                    <option value="Debian 12 Bookworm (x86_64)">Debian 12 Bookworm (x86_64)</option>
                    <option value="Rocky Linux 9 (x86_64)">Rocky Linux 9 (x86_64)</option>
                    <option value="Amazon Linux 2023 (x86_64)">Amazon Linux 2023 (x86_64)</option>
                  </select>
                </div>
              </div>

              {/* Hardware Specs */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Số Cores (vCPU)</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={newCpuCores}
                    onChange={(e) => setNewCpuCores(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Bộ Nhớ RAM (GB)</label>
                  <input
                    type="number"
                    min="1"
                    max="512"
                    value={newRamGb}
                    onChange={(e) => setNewRamGb(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Ổ Cứng NVMe (GB)</label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    value={newDiskGb}
                    onChange={(e) => setNewDiskGb(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* SSH & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">SSH Username</label>
                  <input
                    type="text"
                    value={newSshUser}
                    onChange={(e) => setNewSshUser(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">SSH Port</label>
                  <input
                    type="number"
                    value={newSshPort}
                    onChange={(e) => setNewSshPort(parseInt(e.target.value) || 22)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Chi Phí Hàng Tháng ($)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      disabled={newIsFreeTier}
                      value={newIsFreeTier ? 0 : newCost}
                      onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                    <label className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsFreeTier}
                        onChange={(e) => setNewIsFreeTier(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      Free Tier
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20"
                >
                  Tạo &amp; Đăng Ký VPS Vào Hệ Thống
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bootstrap Script Modal */}
      {bootstrapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Lệnh Bootstrap Tự Động Kết Nối VPS Vào K8s</h3>
              </div>
              <button
                onClick={() => setBootstrapModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Chạy đoạn script sau trên bất kỳ máy chủ VPS nào (Ubuntu/Debian/CentOS). Script sẽ tự động cài đặt WireGuard Mesh, kết nối vào mạng riêng tư 10.8.0.x và nạp K3s Agent để biến VPS thành một Worker Node thực thụ trong cluster.
            </p>

            <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
              <pre>{bootstrapScript}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bootstrapScript);
                  setCopiedBootstrap(true);
                  setTimeout(() => setCopiedBootstrap(false), 2000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1 border border-slate-700"
              >
                {copiedBootstrap ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBootstrap ? 'Đã sao chép!' : 'Sao chép script'}</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setBootstrapModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Xác Nhận Xóa Hàng Loạt Máy Chủ
                  </h3>
                  <p className="text-xs text-rose-400/90 font-mono">
                    Hành động này sẽ xóa vĩnh viễn {selectedVpsIds.length} máy chủ VPS đã chọn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Cảnh báo ảnh hưởng hạ tầng mạng & Kubernetes:</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed pl-5 font-mono">
                Các máy chủ này sẽ bị thu hồi IP Mesh WireGuard, ngắt kết nối TLS và gỡ bỏ khỏi cụm Worker Node K3s. Mọi Pod đang chạy trên các node này sẽ được scheduler điều phối sang node khác.
              </p>
            </div>

            {/* List of servers to be deleted */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Danh sách {selectedVpsIds.length} máy chủ sẽ xóa:</span>
                <span>Tổng: {selectedTotalCpu} vCPU • {selectedTotalRam} GB RAM</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedServers.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white">{s.name}</span>
                        <span className="text-slate-500 text-[10px] block">
                          {s.ipPublic} • Mesh: {s.ipMesh}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.k8sAttached && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                          K8s Worker
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px]">
                        {s.cpuCores}C / {s.ramGb}G
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa {selectedVpsIds.length} Máy Chủ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
