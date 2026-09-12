import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Radio,
  ExternalLink,
  Cpu,
  Server,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Terminal,
  Download,
  Trash2,
  Filter,
  ArrowDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { MetricDataPoint, PodLogEntry, LogSeverity } from '../../types';

interface MonitoringViewProps {
  metrics: MetricDataPoint[];
  trafficRps: number;
}

const INITIAL_LOGS: PodLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '14:48:02.120',
    podName: 'kubeops-api-749bfd986-x8m2q',
    severity: 'INFO',
    method: 'GET',
    path: '/api/v1/health',
    statusCode: 200,
    latencyMs: 1.4,
    message: 'Health probe check succeeded. Readiness status: READY',
  },
  {
    id: 'log-2',
    timestamp: '14:48:03.450',
    podName: 'kubeops-api-749bfd986-p4l9a',
    severity: 'DEBUG',
    message: 'Redis cache hit for user_session_token=usr_88192a - latency 0.3ms',
  },
  {
    id: 'log-3',
    timestamp: '14:48:04.810',
    podName: 'kubeops-api-749bfd986-x8m2q',
    severity: 'INFO',
    method: 'POST',
    path: '/api/v1/checkout/intent',
    statusCode: 200,
    latencyMs: 24.6,
    message: 'Payment intent created successfully with TLS 1.3 AES-GCM',
  },
  {
    id: 'log-4',
    timestamp: '14:48:06.190',
    podName: 'kubeops-api-749bfd986-p4l9a',
    severity: 'WARN',
    message: 'PostgreSQL connection pool utilization reached 78% (39/50 active connections)',
  },
  {
    id: 'log-5',
    timestamp: '14:48:07.502',
    podName: 'ingress-nginx-controller-58f8b',
    severity: 'INFO',
    method: 'GET',
    path: '/static/js/bundle.min.js',
    statusCode: 304,
    latencyMs: 0.8,
    message: 'Static asset cache-control 304 Not Modified served from CloudFront CDN',
  },
  {
    id: 'log-6',
    timestamp: '14:48:09.114',
    podName: 'kubeops-api-749bfd986-x8m2q',
    severity: 'ERROR',
    method: 'POST',
    path: '/api/v1/auth/login',
    statusCode: 429,
    latencyMs: 2.1,
    message: 'Rate limit tripped for client IP 198.51.100.44 (exceeded 100 req/min token bucket)',
  },
  {
    id: 'log-7',
    timestamp: '14:48:10.740',
    podName: 'prometheus-k8s-0',
    severity: 'INFO',
    message: 'Scraped 4 endpoints in 12ms. Samples appended to TSDB: 1,420 metrics',
  },
  {
    id: 'log-8',
    timestamp: '14:48:12.300',
    podName: 'kubeops-api-749bfd986-p4l9a',
    severity: 'DEBUG',
    message: 'Garbage collection cycle completed: scavenged 14.2MB in 2.1ms',
  },
];

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  metrics,
  trafficRps,
}) => {
  const [promQlQuery, setPromQlQuery] = useState(
    'sum(rate(http_requests_total{job="kubeops-api"}[1m])) by (status)'
  );
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  // Pod Log Streaming Simulation State
  const [logs, setLogs] = useState<PodLogEntry[]>(INITIAL_LOGS);
  const [isStreaming, setIsStreaming] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<LogSeverity>('ALL');
  const [podFilter, setPodFilter] = useState<string>('ALL');
  const [searchLogText, setSearchLogText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [logDownloadFeedback, setLogDownloadFeedback] = useState(false);
  const logTerminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-stream ingestion simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const podsList = [
        'kubeops-api-749bfd986-x8m2q',
        'kubeops-api-749bfd986-p4l9a',
        'ingress-nginx-controller-58f8b',
        'prometheus-k8s-0',
      ];
      const randomPod = podsList[Math.floor(Math.random() * podsList.length)];
      const rand = Math.random();

      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;

      let newEntry: PodLogEntry;

      if (rand < 0.58) {
        // INFO log
        const paths = ['/api/v1/health', '/api/v1/metrics', '/api/v1/orders/summary', '/api/v1/users/me', '/api/v1/catalog'];
        const path = paths[Math.floor(Math.random() * paths.length)];
        const latency = (Math.random() * 22 + 1.1).toFixed(1);
        newEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          podName: randomPod,
          severity: 'INFO',
          method: 'GET',
          path,
          statusCode: 200,
          latencyMs: Number(latency),
          message: `HTTP GET ${path} 200 OK (${latency}ms) - gzip 1.8KB client=10.244.1.25`,
        };
      } else if (rand < 0.76) {
        // DEBUG log
        const debugMsgs = [
          'JWT authentication claim verification passed (sub=usr_4920, exp=3600)',
          'Postgres connection checkout from pool [active=12, idle=8, wait=0.2ms]',
          'Redis HGETALL session:token cache hit ratio=99.2%',
          'Prometheus scrape loop collected 1,480 series samples in 11.2ms',
        ];
        newEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          podName: randomPod,
          severity: 'DEBUG',
          message: debugMsgs[Math.floor(Math.random() * debugMsgs.length)],
        };
      } else if (rand < 0.90) {
        // WARN log
        const warnMsgs = [
          `P95 latency threshold exceeded on /api/v1/reports: ${(Math.random() * 80 + 130).toFixed(1)}ms (>120ms SLA)`,
          'Node CPU throttle warning: container app reached 88% of quota allocation',
          'Connection pool queue size grew to 4 pending queries',
          'Disk write burst detected on persistent volume /var/log/app (4.2 MB/s)',
        ];
        newEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          podName: randomPod,
          severity: 'WARN',
          message: warnMsgs[Math.floor(Math.random() * warnMsgs.length)],
        };
      } else {
        // ERROR log
        const errMsgs = [
          'HTTP 429 Too Many Requests: Client 198.51.100.73 exceeded burst rate of 120 req/m',
          'Database socket timeout after 2500ms on standby replica db-read-0.cluster.local',
          'Upstream circuit breaker tripped for notification service: fallback enabled',
        ];
        newEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          podName: randomPod,
          severity: 'ERROR',
          statusCode: rand > 0.95 ? 503 : 429,
          message: errMsgs[Math.floor(Math.random() * errMsgs.length)],
        };
      }

      setLogs((prev) => [...prev.slice(-70), newEntry]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Handle scroll to bottom when autoScroll enabled
  useEffect(() => {
    if (autoScroll && logTerminalEndRef.current) {
      logTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) return false;
    if (podFilter !== 'ALL' && log.podName !== podFilter) return false;
    if (searchLogText.trim()) {
      const q = searchLogText.toLowerCase();
      const matchesMsg = log.message.toLowerCase().includes(q);
      const matchesPod = log.podName.toLowerCase().includes(q);
      const matchesPath = log.path?.toLowerCase().includes(q) || false;
      const matchesCode = String(log.statusCode || '').includes(q);
      if (!matchesMsg && !matchesPod && !matchesPath && !matchesCode) return false;
    }
    return true;
  });

  const handleDownloadLogs = () => {
    const content = filteredLogs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.severity.padEnd(5)}] [${l.podName}] ${l.method ? l.method + ' ' : ''}${l.path ? l.path + ' ' : ''}${l.statusCode ? '(' + l.statusCode + ') ' : ''}${l.latencyMs ? l.latencyMs + 'ms ' : ''}- ${l.message}`
      )
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k8s-pod-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
    setLogDownloadFeedback(true);
    setTimeout(() => setLogDownloadFeedback(false), 2000);
  };

  const currentMetric = metrics[metrics.length - 1] || {
    time: '14:40',
    cpuPercent: 42,
    memoryMb: 360,
    rps: 320,
    latencyMs: 38,
    errorRatePercent: 0.08,
    activePods: 2,
  };

  const handleRunQuery = () => {
    setIsExecutingQuery(true);
    setTimeout(() => {
      setIsExecutingQuery(false);
      if (promQlQuery.includes('status')) {
        setQueryResult(
          JSON.stringify(
            {
              status: 'success',
              data: {
                resultType: 'vector',
                result: [
                  { metric: { status: '200' }, value: [Date.now() / 1000, `${trafficRps * 0.985}`] },
                  { metric: { status: '404' }, value: [Date.now() / 1000, `${(trafficRps * 0.012).toFixed(1)}`] },
                  { metric: { status: '500' }, value: [Date.now() / 1000, `${(trafficRps * 0.003).toFixed(1)}`] },
                ],
              },
            },
            null,
            2
          )
        );
      } else {
        setQueryResult(
          JSON.stringify(
            {
              status: 'success',
              data: {
                resultType: 'vector',
                result: [
                  {
                    metric: { container: 'app', pod: 'kubeops-api-749bfd986-x8m2q', namespace: 'production' },
                    value: [Date.now() / 1000, `${(currentMetric.cpuPercent / 100).toFixed(3)}`],
                  },
                ],
              },
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  const maxRps = Math.max(...metrics.map((m) => m.rps), 500);
  const maxLatency = Math.max(...metrics.map((m) => m.latencyMs), 150);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> PROMETHEUS v2.52 &amp; GRAFANA v10.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Scrape: 15s interval
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Giám Sát Thời Gian Thực &amp; Hiệu Suất Hệ Thống (Prometheus &amp; Grafana)
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Theo dõi liên tục các chỉ số quan trọng: CPU, Memory, RPS, P95 Latency và tỉ lệ lỗi HTTP. Tích hợp cảnh báo tự động phát hiện sớm sự cố và báo cáo trực quan cho quản trị viên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Scrape Targets: 4/4 UP
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CPU */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tải CPU (Cluster Avg)</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.cpuPercent}%
            </span>
            <span className="text-xs text-slate-500 font-mono">/ Ngưỡng 75%</span>
          </div>
          <div className="mt-3 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                currentMetric.cpuPercent > 75 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(currentMetric.cpuPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Memory */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Bộ nhớ RAM tiêu thụ</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {currentMetric.memoryMb} <span className="text-sm font-normal text-slate-400">MB</span>
            </span>
            <span className="text-xs text-emerald-400 font-mono">Free Tier OK</span>
          </div>
          <div className="mt-3 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min((currentMetric.memoryMb / 1024) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 3: RPS & Latency */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Lưu lượng &amp; P95 Latency</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                {currentMetric.rps}
              </span>
              <span className="text-xs text-slate-400 ml-1">req/s</span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold font-mono text-emerald-400">
                {currentMetric.latencyMs}ms
              </span>
              <span className="text-[10px] text-slate-500 block">P95 latency</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>P50: ~12ms</span>
            <span>P99: ~{currentMetric.latencyMs + 24}ms</span>
          </div>
        </div>

        {/* Card 4: Error Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tỉ lệ lỗi 5xx (SLO: &lt; 0.1%)</span>
            <AlertCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {currentMetric.errorRatePercent}%
            </span>
            <span className="text-xs text-slate-500 font-mono">0.00% 5xx</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">SLO Đạt 99.99% Availability</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Bars: Grafana Time-Series Emulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: RPS vs Time */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Grafana: Throughput (RPS) &amp; Traffic History
              </h3>
              <p className="text-xs text-slate-400">Số lượng request xử lý mỗi giây theo thời gian thực</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
              rate(http_requests_total[1m])
            </span>
          </div>

          {/* Render bar chart */}
          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-slate-800/80">
            {metrics.map((point, idx) => {
              const heightPercent = Math.max(Math.min((point.rps / maxRps) * 100, 100), 10);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded border border-slate-800 pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {point.time} • {point.rps} req/s • CPU {point.cpuPercent}%
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm transition-all duration-300 hover:brightness-125"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-500 truncate w-full text-center">
                    {point.time.split(':')[1]}s
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>10 điểm đo gần nhất</span>
            <span>Đỉnh: {maxRps} RPS</span>
          </div>
        </div>

        {/* Chart 2: Latency P95 (ms) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> Grafana: P95 Request Latency (ms)
              </h3>
              <p className="text-xs text-slate-400">Thời gian phản hồi P95 đo từ Ingress Gateway</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
              histogram_quantile(0.95)
            </span>
          </div>

          {/* Render bar chart */}
          <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-slate-800/80">
            {metrics.map((point, idx) => {
              const heightPercent = Math.max(Math.min((point.latencyMs / maxLatency) * 100, 100), 10);
              const isHigh = point.latencyMs > 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] font-mono px-2 py-1 rounded border border-slate-800 pointer-events-none z-10 whitespace-nowrap shadow-lg">
                    {point.time} • P95: {point.latencyMs}ms
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 hover:brightness-125 ${
                      isHigh
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                        : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-500 truncate w-full text-center">
                    {point.latencyMs}ms
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>Mục tiêu SLA: &lt; 200ms</span>
            <span>P95 Trung bình: {Math.round(metrics.reduce((a, b) => a + b.latencyMs, 0) / metrics.length)}ms</span>
          </div>
        </div>
      </div>

      {/* PromQL Query Runner & Scrape Target Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive PromQL Query Console (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" /> Trình Thực Thi Truy Vấn PromQL (Prometheus Explorer)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Prometheus v2.52 API</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={promQlQuery}
              onChange={(e) => setPromQlQuery(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
              placeholder="Nhập câu lệnh PromQL..."
            />
            <button
              onClick={handleRunQuery}
              disabled={isExecutingQuery}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecutingQuery ? 'Truy vấn...' : 'Execute'}</span>
            </button>
          </div>

          {/* Quick preset queries */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-500 py-0.5">Mẫu truy vấn:</span>
            <button
              onClick={() => {
                setPromQlQuery('sum(rate(http_requests_total[1m])) by (status)');
              }}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono"
            >
              http_requests_total
            </button>
            <button
              onClick={() => {
                setPromQlQuery('sum(container_cpu_usage_seconds_total{namespace="production"})');
              }}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono"
            >
              cpu_usage_seconds
            </button>
            <button
              onClick={() => {
                setPromQlQuery('histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))');
              }}
              className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 font-mono"
            >
              p95_latency
            </button>
          </div>

          {/* Result Output */}
          {queryResult && (
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
              {queryResult}
            </pre>
          )}
        </div>

        {/* Scrape Target Inventory (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" /> Scrape Targets (Prometheus Exporters)
            </h3>
            <span className="text-xs text-emerald-400 font-semibold font-mono">100% Healthy</span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: 'kubernetes-pods (kubeops-api)', endpoint: ':3000/metrics', interval: '15s', state: 'UP' },
              { name: 'kube-state-metrics', endpoint: ':8080/metrics', interval: '15s', state: 'UP' },
              { name: 'node-exporter (Ampere ARM)', endpoint: ':9100/metrics', interval: '30s', state: 'UP' },
              { name: 'ingress-nginx-controller', endpoint: ':10254/metrics', interval: '15s', state: 'UP' },
            ].map((tgt, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-mono font-medium text-white text-[11px]">{tgt.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{tgt.endpoint} • Scrape: {tgt.interval}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 font-mono">
                  {tgt.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Pod Log Streaming Simulation Widget */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> POD LOG STREAMING SIMULATOR
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono flex items-center gap-1.5 ${
                  isStreaming
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isStreaming ? 'LIVE INGESTION' : 'PAUSED'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Mô Phỏng Thu Thập &amp; Truy Vết Log Pod Trực Tiếp (Real-Time Ingestion)
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Thu thập luồng log từ các container đang chạy trong cụm Kubernetes. Hỗ trợ lọc tức thì theo cấp độ nghiêm trọng (Severity: INFO, WARN, ERROR, DEBUG), theo tên Pod và từ khóa tìm kiếm.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isStreaming
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isStreaming ? 'Tạm Dừng Stream' : 'Tiếp Tục Stream'}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Tự cuộn theo log</span>
            </label>

            <button
              onClick={() => setLogs([])}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Xóa màn hình log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa log</span>
            </button>

            <button
              onClick={handleDownloadLogs}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {logDownloadFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{logDownloadFeedback ? 'Đã tải!' : 'Tải file .log'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls: Severity Buttons, Pod Selector & Search Box */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {/* Severity Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Mức độ:
            </span>
            {(
              [
                { id: 'ALL', label: 'TẤT CẢ', count: logs.length, color: 'text-slate-300' },
                { id: 'INFO', label: 'INFO', count: logs.filter((l) => l.severity === 'INFO').length, color: 'text-cyan-400' },
                { id: 'WARN', label: 'WARN', count: logs.filter((l) => l.severity === 'WARN').length, color: 'text-amber-400' },
                { id: 'ERROR', label: 'ERROR', count: logs.filter((l) => l.severity === 'ERROR').length, color: 'text-rose-400' },
                { id: 'DEBUG', label: 'DEBUG', count: logs.filter((l) => l.severity === 'DEBUG').length, color: 'text-purple-400' },
              ] as const
            ).map((sev) => {
              const isActive = selectedSeverity === sev.id;
              return (
                <button
                  key={sev.id}
                  onClick={() => setSelectedSeverity(sev.id as LogSeverity)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className={sev.color}>{sev.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                    {sev.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pod Filter & Search Input */}
          <div className="flex items-center gap-2">
            <select
              value={podFilter}
              onChange={(e) => setPodFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono outline-none cursor-pointer focus:border-cyan-500"
            >
              <option value="ALL">Tất cả Pods ({logs.length})</option>
              {Array.from(new Set(logs.map((l) => l.podName))).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchLogText}
                onChange={(e) => setSearchLogText(e.target.value)}
                placeholder="Tìm từ khóa, path, code..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-cyan-500 w-48 lg:w-60"
              />
              {searchLogText && (
                <button
                  onClick={() => setSearchLogText('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mock Scrolling Terminal Viewport */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          {/* Terminal Title Bar */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-slate-400 ml-2">stdout/stderr • kubectl logs -f -n production -l app=kubeops-api</span>
            </div>
            <span className="text-slate-500 text-[11px]">
              Hiển thị {filteredLogs.length}/{logs.length} dòng
            </span>
          </div>

          {/* Log Lines Container */}
          <div className="p-3.5 font-mono text-xs overflow-y-auto max-h-80 space-y-1.5 select-text">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Không tìm thấy dòng log nào khớp với tiêu chí lọc của bạn.
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                if (log.severity === 'WARN') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                if (log.severity === 'ERROR') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/40 font-bold';
                if (log.severity === 'DEBUG') badgeClass = 'bg-purple-500/10 text-purple-400 border-purple-500/30';

                return (
                  <div
                    key={log.id}
                    className={`flex flex-wrap items-start gap-2 py-0.5 px-1.5 rounded transition ${
                      log.severity === 'ERROR' ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="text-slate-600 select-none text-[11px] shrink-0">{log.timestamp}</span>

                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${badgeClass}`}>
                      {log.severity}
                    </span>

                    <span className="text-slate-500 text-[11px] shrink-0 font-medium">
                      [{log.podName.replace('kubeops-api-', 'api-')}]
                    </span>

                    {log.statusCode && (
                      <span
                        className={`text-[11px] px-1 py-0.2 rounded font-bold shrink-0 ${
                          log.statusCode < 300
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : log.statusCode < 400
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-rose-400 bg-rose-500/20'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    )}

                    {log.latencyMs && (
                      <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                        {log.latencyMs}ms
                      </span>
                    )}

                    <span
                      className={`break-all ${
                        log.severity === 'ERROR'
                          ? 'text-rose-300 font-medium'
                          : log.severity === 'WARN'
                          ? 'text-amber-200'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={logTerminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
