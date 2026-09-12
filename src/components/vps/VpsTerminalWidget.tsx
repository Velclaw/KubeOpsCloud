import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Server,
  Play,
  Trash2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  Wifi,
  Lock,
  ChevronRight,
  HelpCircle,
  Activity,
  Cpu,
  HardDrive,
  Network,
} from 'lucide-react';
import { VpsServer } from '../../types';

interface VpsTerminalWidgetProps {
  vpsList: VpsServer[];
  selectedVpsId?: string;
  onSelectVps?: (id: string) => void;
  onRebootVps?: (id: string) => void;
}

interface TerminalEntry {
  id: string;
  timestamp: string;
  command: string;
  output: string;
  type?: 'stdout' | 'stderr' | 'system' | 'info';
  exitCode?: number;
}

export const VpsTerminalWidget: React.FC<VpsTerminalWidgetProps> = ({
  vpsList,
  selectedVpsId,
  onSelectVps,
  onRebootVps,
}) => {
  const [activeVpsId, setActiveVpsId] = useState<string>(
    selectedVpsId || (vpsList.length > 0 ? vpsList[0].id : '')
  );

  // Sync if selectedVpsId prop changes
  useEffect(() => {
    if (selectedVpsId && selectedVpsId !== activeVpsId) {
      setActiveVpsId(selectedVpsId);
    }
  }, [selectedVpsId]);

  const activeVps = vpsList.find((v) => v.id === activeVpsId) || vpsList[0];

  const [inputCommand, setInputCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sshLatencyMs, setSshLatencyMs] = useState(18);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial welcome message per VPS
  const getInitialEntries = (vps: VpsServer): TerminalEntry[] => [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      command: '',
      type: 'system',
      output: `Connected to ${vps.name} (${vps.ipPublic})\nAuthenticated with ed25519-sk key (via Mesh Gateway 10.8.0.1)\nLinux ${vps.name} 6.8.0-1011-generic #${vps.cpuArchitecture === 'arm64' ? 'Ampere A1 aarch64' : 'x86_64'} SMP\nSystem status: Healthy | WireGuard: ACTIVE (10.8.0.x)\nType 'help' to see list of available diagnostic and management commands.`,
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      command: 'uptime',
      type: 'stdout',
      output: ` ${new Date().toLocaleTimeString()} up ${vps.uptime}, 1 user, load average: ${vps.loadAvg}`,
      exitCode: 0,
    },
  ];

  // Storage of terminal histories for each VPS so user doesn't lose state when switching servers
  const [historiesByVps, setHistoriesByVps] = useState<Record<string, TerminalEntry[]>>(() => {
    const initialMap: Record<string, TerminalEntry[]> = {};
    vpsList.forEach((vps) => {
      initialMap[vps.id] = getInitialEntries(vps);
    });
    return initialMap;
  });

  // Current active history
  const activeHistory = historiesByVps[activeVps?.id] || (activeVps ? getInitialEntries(activeVps) : []);

  // Fluctuate SSH ping latency realistically
  useEffect(() => {
    const interval = setInterval(() => {
      setSshLatencyMs((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        return Math.max(12, Math.min(32, Math.round(prev + delta)));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeHistory, isExecuting]);

  const handleSelectServer = (vpsId: string) => {
    setActiveVpsId(vpsId);
    if (onSelectVps) {
      onSelectVps(vpsId);
    }
    // Initialize history if missing
    if (!historiesByVps[vpsId]) {
      const vps = vpsList.find((v) => v.id === vpsId);
      if (vps) {
        setHistoriesByVps((prev) => ({
          ...prev,
          [vpsId]: getInitialEntries(vps),
        }));
      }
    }
  };

  const handleClear = () => {
    if (!activeVps) return;
    setHistoriesByVps((prev) => ({
      ...prev,
      [activeVps.id]: [],
    }));
  };

  const handleCopyLogs = () => {
    if (!activeVps) return;
    const text = activeHistory
      .map((item) => (item.command ? `[${activeVps.sshUser}@${activeVps.name}:~]$ ${item.command}\n${item.output}` : item.output))
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLog = () => {
    if (!activeVps) return;
    const text = `# SSH Terminal Session Log - ${activeVps.name} (${activeVps.ipPublic})\n# Generated: ${new Date().toISOString()}\n\n` +
      activeHistory
        .map((item) => (item.command ? `[${item.timestamp}] [${activeVps.sshUser}@${activeVps.name}:~]$ ${item.command}\n${item.output}` : item.output))
        .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssh-session-${activeVps.name}-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate realistic shell outputs based on active VPS specs
  const executeCommandSimulation = (rawCmd: string, vps: VpsServer): { output: string; type?: 'stdout' | 'stderr' | 'system' | 'info'; exitCode?: number } => {
    const cmd = rawCmd.trim();
    const cmdLower = cmd.toLowerCase();

    if (cmdLower === 'help') {
      return {
        output: `Available diagnostic & management commands:
  • help                         - Hiển thị danh sách các lệnh hỗ trợ
  • docker ps                    - Xem danh sách container đang chạy trên VPS
  • kubectl get nodes -o wide    - Kiểm tra trạng thái node trong cụm Kubernetes
  • kubectl get pods -A          - Liệt kê các Pod đang chạy trên toàn hệ thống
  • wg show                      - Kiểm tra thông số kết nối mạng riêng WireGuard Mesh
  • systemctl status k3s-agent   - Trạng thái tiến trình K8s Worker Agent
  • journalctl -u k3s -n 15      - Xem 15 dòng nhật ký gần nhất của service
  • htop / top                   - Bảng điều khiển CPU, RAM và tiến trình hoạt động
  • free -h                      - Thống kê bộ nhớ RAM & Swap
  • df -h                        - Dung lượng các phân vùng ổ cứng NVMe/SSD
  • ip a / ifconfig              - Thông tin card mạng (eth0 Public IP & wg0 Mesh IP)
  • ping 10.8.0.1 -c 4           - Kiểm tra độ trễ đến Master K8s qua WireGuard Mesh
  • curl -I localhost:80         - Gửi truy vấn HTTP test port dịch vụ
  • uname -a                     - Thông tin nhân Linux & kiến trúc vi xử lý (ARM/x86)
  • uptime                       - Thời gian hoạt động liên tục & tải trung bình
  • cat /etc/os-release          - Phiên bản hệ điều hành Linux
  • reboot                       - Khởi động lại máy chủ và tái kết nối SSH
  • clear                        - Xóa màn hình terminal`,
        type: 'info',
        exitCode: 0,
      };
    }

    if (cmdLower === 'clear') {
      return { output: '', exitCode: 0 };
    }

    if (cmdLower.startsWith('docker ps') || cmdLower === 'docker') {
      if (vps.role === 'k8s-worker') {
        return {
          output: `CONTAINER ID   IMAGE                                COMMAND                  CREATED         STATUS         PORTS\n` +
            `f8a1294bd821   k8s.gcr.io/pause:3.9                 "/pause"                 14 days ago     Up 14 days     \n` +
            `3c7d9a114b01   ghcr.io/devops-org/kubeops-api:1.4   "node dist/server.cjs"   14 days ago     Up 14 days     0.0.0.0:3000->3000/tcp\n` +
            `91bca729e843   prom/node-exporter:v1.7.0            "/bin/node_exporter"     30 days ago     Up 30 days     0.0.0.0:9100->9100/tcp\n` +
            `d4e819ac4012   rancher/k3s-flannel:v0.25.1          "/opt/bin/flanneld"      45 days ago     Up 45 days     `,
          exitCode: 0,
        };
      } else if (vps.role === 'database') {
        return {
          output: `CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS\n` +
            `82c01fa91092   postgres:16-alpine    "docker-entrypoint.s…"   45 days ago     Up 45 days     0.0.0.0:5432->5432/tcp\n` +
            `a1b9201948ba   redis:7.2-alpine      "docker-entrypoint.s…"   45 days ago     Up 45 days     0.0.0.0:6379->6379/tcp\n` +
            `4d019ba2491a   prom/postgres-export  "/postgres_exporter"     45 days ago     Up 45 days     0.0.0.0:9187->9187/tcp`,
          exitCode: 0,
        };
      } else if (vps.role === 'ingress-proxy') {
        return {
          output: `CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS\n` +
            `11a8b92c4e01   traefik:v3.0.4        "/entrypoint.sh trae…"   60 days ago     Up 60 days     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp\n` +
            `99fa28104822   cert-manager:v1.14    "/cert-manager acme"     60 days ago     Up 60 days     `,
          exitCode: 0,
        };
      } else {
        return {
          output: `CONTAINER ID   IMAGE                                COMMAND                  CREATED         STATUS         PORTS\n` +
            `44fa819ac021   actions-runner:v2.316.0              "./run.sh"               10 days ago     Up 10 days     \n` +
            `91bca729e843   prom/node-exporter:v1.7.0            "/bin/node_exporter"     30 days ago     Up 30 days     0.0.0.0:9100->9100/tcp`,
          exitCode: 0,
        };
      }
    }

    if (cmdLower.startsWith('kubectl get nodes')) {
      return {
        output: `NAME                         STATUS   ROLES           AGE    VERSION        INTERNAL-IP   OS-IMAGE             KERNEL-VERSION\n` +
          `control-plane-master-01      Ready    control-plane   120d   v1.29.4+k3s1   10.8.0.1      Ubuntu 24.04 LTS     6.8.0-1011-generic\n` +
          `${vps.name.padEnd(28)} Ready    ${vps.role.padEnd(15)} ${vps.uptime.split(' ')[0]}    v1.29.4+k3s1   ${vps.ipMesh.padEnd(13)} ${vps.os.split(' ')[0]} ${vps.os.split(' ')[1] || ''}  ${vps.cpuArchitecture === 'arm64' ? '6.8.0-1011-oracle' : '6.8.0-31-generic'}\n` +
          `vps-oracle-ampere-k8s-01     Ready    worker          64d    v1.29.4+k3s1   10.8.0.2      Ubuntu 24.04 LTS     6.8.0-1011-oracle\n` +
          `vps-gcp-ingress-edge-01      Ready    worker,ingress  110d   v1.29.4+k3s1   10.8.0.4      Ubuntu 22.04 LTS     5.15.0-104-generic`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('kubectl get pods')) {
      return {
        output: `NAMESPACE     NAME                                      READY   STATUS    RESTARTS   AGE   IP           NODE\n` +
          `production    kubeops-api-deployment-7f89d4-x891         1/1     Running   0          12d   10.42.1.45   ${vps.name}\n` +
          `production    kubeops-frontend-proxy-54c2a1-m412        1/1     Running   0          12d   10.42.1.46   ${vps.name}\n` +
          `kube-system   wireguard-mesh-node-agent-9b14c           1/1     Running   0          64d   ${vps.ipMesh}     ${vps.name}\n` +
          `monitoring    prometheus-node-exporter-4f10a            1/1     Running   0          30d   ${vps.ipMesh}     ${vps.name}\n` +
          `kube-system   coredns-6799fc88d8-p48la                  1/1     Running   0          45d   10.42.0.12   control-plane-master-01`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'wg show' || cmdLower === 'wg' || cmdLower.startsWith('wireguard')) {
      return {
        output: `interface: wg0
  public key: 8vQ+gKf1u98Y7kXhN4M10A98F7Zp5Lm2WqX8aZb9=
  private key: (hidden)
  listening port: 51820

peer: hKl28N9F814Ma01NfZ7Xp6Wm1Qk8aZb901Ka871= (K8s Master Control Plane)
  endpoint: 140.238.12.89:51820
  allowed ips: 10.8.0.0/24, 10.42.0.0/16
  latest handshake: 14 seconds ago
  transfer: 2.84 GiB received, 1.18 GiB sent
  persistent keepalive: every 25 seconds`,
        exitCode: 0,
      };
    }

    if (cmdLower.includes('systemctl status')) {
      return {
        output: `● k3s-agent.service - Lightweight Kubernetes Agent
     Loaded: loaded (/etc/systemd/system/k3s-agent.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-07-08 09:14:02 UTC; ${vps.uptime} ago
   Main PID: 1105 (k3s-agent)
      Tasks: 22 (limit: 4915)
     Memory: 88.4M (peak: 104.2M)
        CPU: 4h 12min 33s
     CGroup: /system.slice/k3s-agent.service
             ├─1105 /usr/local/bin/k3s agent --server https://10.8.0.1:6443 --token [REDACTED] --node-ip ${vps.ipMesh}
             └─1240 containerd --config /var/lib/rancher/k3s/agent/etc/containerd/config.toml

${new Date().toLocaleDateString()} k3s-agent[1105]: I0912 14:48:02.102 node-syncer] Node ${vps.name} heartbeat OK
${new Date().toLocaleDateString()} k3s-agent[1105]: I0912 14:50:02.391 container-runtime] All Pod sandboxes running smoothly`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('journalctl')) {
      return {
        output: `-- Logs begin at Thu 2026-07-09 04:00:00 UTC, end at ${new Date().toLocaleTimeString()} UTC. --
Sep 12 14:40:01 ${vps.name} systemd[1]: Starting WireGuard Mesh Health Check...
Sep 12 14:40:01 ${vps.name} wg-mesh[2910]: WireGuard handshake OK with peer 10.8.0.1 (RTT 1.4ms)
Sep 12 14:45:10 ${vps.name} k3s-agent[1105]: Node status updated: CPU=${vps.cpuUsagePercent}%, Mem=${vps.ramUsagePercent}%
Sep 12 14:50:22 ${vps.name} sshd[8412]: Accepted publickey for ${vps.sshUser} from 10.8.0.1 port 48210 ssh2: ED25519-SK
Sep 12 14:52:00 ${vps.name} dockerd[1402]: Healthcheck passed for kubeops-api:1.4 container
Sep 12 14:55:00 ${vps.name} cron[782]: (root) CMD (test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily ))
Sep 12 15:00:01 ${vps.name} systemd[1]: Session c2 of User ${vps.sshUser} logged in.`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'htop' || cmdLower === 'top') {
      const cpuBars = Array.from({ length: vps.cpuCores }, (_, i) => {
        const pct = Math.round(vps.cpuUsagePercent + (Math.random() - 0.5) * 8);
        const filled = Math.round((pct / 100) * 20);
        const bar = '[' + '|'.repeat(Math.max(1, filled)) + ' '.repeat(Math.max(0, 20 - filled)) + ` ${pct}%]`;
        return `  ${i + 1}  ${bar}`;
      }).join('\n');

      return {
        output: `${cpuBars}
  Mem [|||||||||||||||                  ${((vps.ramGb * vps.ramUsagePercent) / 100).toFixed(1)}G/${vps.ramGb}.0G]
  Swp [                                0K/4.0G]

  Tasks: 98, 1 running, 97 sleeping; Load average: ${vps.loadAvg}
  Uptime: ${vps.uptime}

  PID USER      PRI  NI  VIRT   RES   SHR S CPU% MEM%   TIME+  Command
 1105 root       20   0 1420M  320M 45.2M S 14.2  ${(vps.ramUsagePercent * 0.25).toFixed(1)} 24:12.4 k3s-agent
 2910 kubeops    20   0  980M  195M 28.1M S  8.4  ${(vps.ramUsagePercent * 0.18).toFixed(1)} 16:45.1 node dist/server.cjs
 1402 root       20   0  480M   84M 18.0M S  3.1  ${(vps.ramUsagePercent * 0.08).toFixed(1)} 08:30.9 containerd
  984 root       20   0  145M   24M  9.1M S  1.0  0.2  02:11.4 /bin/node_exporter
  102 root       20   0     0     0     0 S  0.0  0.0  00:04.2 [wireguard]`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('free')) {
      const totalMb = vps.ramGb * 1024;
      const usedMb = Math.round(totalMb * (vps.ramUsagePercent / 100));
      const freeMb = totalMb - usedMb;
      const buffMb = Math.round(totalMb * 0.15);
      const availMb = freeMb + Math.round(buffMb * 0.7);

      return {
        output: `               total        used        free      shared  buff/cache   available
Mem:          ${(totalMb / 1024).toFixed(1)}Gi       ${(usedMb / 1024).toFixed(1)}Gi       ${(freeMb / 1024).toFixed(1)}Gi       142Mi       ${(buffMb / 1024).toFixed(1)}Gi       ${(availMb / 1024).toFixed(1)}Gi
Swap:          4.0Gi          0B       4.0Gi`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('df')) {
      const totalGb = vps.diskGb;
      const usedGb = Math.round(totalGb * (vps.diskUsagePercent / 100));
      const availGb = totalGb - usedGb;

      return {
        output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        ${totalGb}G   ${usedGb}G   ${availGb}G  ${vps.diskUsagePercent}% /
tmpfs           ${(vps.ramGb / 2).toFixed(1)}G  1.4M  ${(vps.ramGb / 2).toFixed(1)}G   1% /run
/dev/sda15      124M   12M  112M  10% /boot/efi
/dev/sdb1        40G  4.2G   34G  11% /var/lib/docker`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'ip a' || cmdLower === 'ip addr' || cmdLower === 'ifconfig') {
      return {
        output: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9000 qdisc mq state UP group default qlen 1000
    link/ether 02:00:17:01:4b:92 brd ff:ff:ff:ff:ff:ff
    inet ${vps.ipPublic}/24 metric 100 brd 140.238.12.255 scope global dynamic eth0
       valid_lft 85142sec preferred_lft 85142sec
3: wg0: <POINTOPOINT,NOARP,UP,LOWER_UP> mtu 1420 qdisc noqueue state UNKNOWN group default qlen 1000
    link/none 
    inet ${vps.ipMesh}/24 scope global wg0 (WireGuard Mesh Virtual Private Network)
       valid_lft forever preferred_lft forever`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('ping')) {
      const target = cmd.split(' ')[1] || '10.8.0.1';
      return {
        output: `PING ${target} (${target}) 56(84) bytes of data.
64 bytes from ${target}: icmp_seq=1 ttl=64 time=1.42 ms
64 bytes from ${target}: icmp_seq=2 ttl=64 time=1.28 ms
64 bytes from ${target}: icmp_seq=3 ttl=64 time=1.35 ms
64 bytes from ${target}: icmp_seq=4 ttl=64 time=1.31 ms

--- ${target} ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 1.280/1.340/1.420/0.051 ms`,
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('curl')) {
      return {
        output: `HTTP/2 200 OK
server: nginx/1.25.4 (Ubuntu)
date: ${new Date().toUTCString()}
content-type: application/json; charset=utf-8
content-length: 84
x-mesh-hop: wg0-singapore-01
access-control-allow-origin: *

{"status":"ok","node":"${vps.name}","region":"${vps.region}","healthy":true}`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'uname -a') {
      return {
        output: `Linux ${vps.name} 6.8.0-1011-generic #11-${vps.os.split(' ')[0]} SMP ${vps.cpuArchitecture === 'arm64' ? 'aarch64 GNU/Linux (Ampere Altra)' : 'x86_64 GNU/Linux'}`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'uptime') {
      return {
        output: ` ${new Date().toLocaleTimeString()} up ${vps.uptime}, 1 user, load average: ${vps.loadAvg}`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'cat /etc/os-release') {
      return {
        output: `PRETTY_NAME="${vps.os}"
NAME="${vps.os.split(' ')[0]}"
VERSION_ID="${vps.os.includes('24.04') ? '24.04' : vps.os.includes('12') ? '12' : '22.04'}"
ID_LIKE="debian"
HOME_URL="https://ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"`,
        exitCode: 0,
      };
    }

    if (cmdLower === 'reboot') {
      if (onRebootVps) {
        onRebootVps(vps.id);
      }
      return {
        output: `Broadcast message from root@${vps.name} (pts/0) (${new Date().toLocaleTimeString()}):
The system is going down for reboot NOW!
Connection to ${vps.ipPublic} closed by remote host.
[Reboot initiated. System will cycle in background...]`,
        type: 'system',
        exitCode: 0,
      };
    }

    if (cmdLower.startsWith('echo ')) {
      return {
        output: cmd.substring(5).replace(/["']/g, ''),
        exitCode: 0,
      };
    }

    if (cmdLower === 'history') {
      return {
        output: commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n') || '  1  help',
        exitCode: 0,
      };
    }

    // Default fallback
    return {
      output: `[${vps.sshUser}@${vps.name} ~]$ bash: command executed successfully (exit code 0)\nReturn code: 0 | Environment: ${vps.os.split(' ')[0]} ${vps.cpuArchitecture}`,
      exitCode: 0,
    };
  };

  const handleSubmitCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim() || !activeVps || isExecuting) return;

    const cmd = inputCommand.trim();
    setInputCommand('');
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd.toLowerCase() === 'clear') {
      handleClear();
      return;
    }

    setIsExecuting(true);

    // Simulated short realistic latency for command execution
    setTimeout(() => {
      const result = executeCommandSimulation(cmd, activeVps);

      const newEntry: TerminalEntry = {
        id: `cmd-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        command: cmd,
        output: result.output,
        type: result.type || 'stdout',
        exitCode: result.exitCode ?? 0,
      };

      setHistoriesByVps((prev) => ({
        ...prev,
        [activeVps.id]: [...(prev[activeVps.id] || []), newEntry],
      }));

      setIsExecuting(false);
    }, 80);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInputCommand('');
        } else {
          setHistoryIndex(nextIndex);
          setInputCommand(commandHistory[nextIndex]);
        }
      }
    }
  };

  const quickCommands = [
    { label: 'docker ps', cmd: 'docker ps' },
    { label: 'kubectl get nodes', cmd: 'kubectl get nodes -o wide' },
    { label: 'systemctl status', cmd: 'systemctl status k3s-agent' },
    { label: 'wg show (VPN)', cmd: 'wg show' },
    { label: 'htop stats', cmd: 'htop' },
    { label: 'free & df', cmd: 'free -h && df -h' },
    { label: 'journalctl -n 15', cmd: 'journalctl -u k3s -n 15' },
    { label: 'ping master', cmd: 'ping 10.8.0.1 -c 4' },
    { label: 'uname -a', cmd: 'uname -a' },
    { label: 'help', cmd: 'help' },
  ];

  if (!activeVps) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        Không tìm thấy máy chủ VPS nào trong hệ thống.
      </div>
    );
  }

  return (
    <div
      id="vps-ssh-terminal-widget"
      className={`rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl transition-all flex flex-col overflow-hidden font-mono ${
        isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'w-full'
      }`}
    >
      {/* 1. Terminal Top Control Bar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Window dots & Server Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-white font-bold">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Interactive Web SSH Terminal</span>
          </div>

          {/* Target Server Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400 font-sans hidden sm:inline">Máy chủ:</label>
            <select
              value={activeVps.id}
              onChange={(e) => handleSelectServer(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-400 cursor-pointer"
            >
              {vpsList.map((vps) => (
                <option key={vps.id} value={vps.id}>
                  {vps.name} ({vps.ipPublic} • {vps.provider.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Connection Info & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400">
            <Wifi className="w-3 h-3 animate-pulse" />
            <span className="hidden md:inline">SSH Encrypted ({sshLatencyMs}ms)</span>
            <span className="md:hidden">TLS OK</span>
          </div>

          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="Xóa màn hình (Clear Screen)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="Sao chép toàn bộ logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadLog}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="Tải file nhật ký SSH (.log)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Active Server Connection Details Banner */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span className="flex items-center gap-1 text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-white">{activeVps.sshUser}@{activeVps.name}</strong>
          </span>
          <span>•</span>
          <span>Public: <strong className="text-cyan-300">{activeVps.ipPublic}:{activeVps.sshPort}</strong></span>
          <span>•</span>
          <span>Mesh VPN: <strong className="text-emerald-400">{activeVps.ipMesh}</strong></span>
          <span>•</span>
          <span>HĐH: {activeVps.os.split(' ')[0]} ({activeVps.cpuArchitecture})</span>
          <span>•</span>
          <span>Load: {activeVps.loadAvg.split(',')[0]}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
            Uptime: {activeVps.uptime}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
            {activeVps.k8sAttached ? '✓ K8s Worker' : 'Standalone'}
          </span>
        </div>
      </div>

      {/* 3. Interactive Quick Command Buttons */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <span className="text-slate-500 shrink-0 font-sans text-[10px] uppercase font-bold tracking-wider mr-1">
          Lệnh nhanh:
        </span>
        {quickCommands.map((q) => (
          <button
            key={q.cmd}
            onClick={() => {
              setInputCommand(q.cmd);
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 transition cursor-pointer shrink-0 font-mono text-[11px]"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* 4. Terminal Output Display Screen */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`p-4 overflow-y-auto space-y-3 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950 select-text cursor-text ${
          isFullscreen ? 'flex-1' : 'h-[360px]'
        }`}
      >
        {activeHistory.length === 0 && (
          <div className="text-slate-600 text-xs italic">
            Màn hình đã được dọn sạch. Nhập lệnh hoặc chọn 'Lệnh nhanh' phía trên để thực thi.
          </div>
        )}

        {activeHistory.map((item) => (
          <div key={item.id} className="space-y-1">
            {item.command && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-emerald-400 font-bold">
                  {activeVps.sshUser}@{activeVps.name}:~$
                </span>
                <span className="text-white font-bold">{item.command}</span>
                <span className="text-[10px] text-slate-600 ml-auto font-sans">{item.timestamp}</span>
              </div>
            )}

            <pre
              className={`whitespace-pre-wrap font-mono text-[11px] pl-2 border-l-2 leading-relaxed ${
                item.type === 'system'
                  ? 'border-cyan-500/50 text-cyan-300'
                  : item.type === 'stderr'
                  ? 'border-rose-500 text-rose-300'
                  : item.type === 'info'
                  ? 'border-amber-500/50 text-amber-200'
                  : 'border-slate-800 text-slate-300'
              }`}
            >
              {item.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Executing command on {activeVps.name}...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* 5. Terminal Interactive Command Input Form */}
      <form
        onSubmit={handleSubmitCommand}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <span className="text-emerald-400 font-bold text-xs shrink-0 select-none">
          {activeVps.sshUser}@{activeVps.name}:~$
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputCommand}
          onChange={(e) => setInputCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập lệnh shell (ví dụ: docker ps, kubectl get nodes, wg show, htop, df -h, help)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none focus:border-cyan-500 placeholder:text-slate-600 transition"
        />
        <button
          type="submit"
          disabled={isExecuting || !inputCommand.trim()}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Chạy</span>
        </button>
      </form>
    </div>
  );
};
