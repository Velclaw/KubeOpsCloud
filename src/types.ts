export type CloudProvider = 'oracle' | 'gcp' | 'aws';

export interface CloudServiceComparisonItem {
  category: 'Compute' | 'Database' | 'Storage' | 'Networking & CDN' | 'CI/CD & Monitoring';
  serviceNameGcp: string;
  allowanceGcp: string;
  serviceNameAws: string;
  allowanceAws: string;
  recommendationForSmallProject: string;
  costSafetyTips: string;
}

export interface CloudFreeTierInfo {
  id: CloudProvider;
  name: string;
  badge: string;
  monthlyCost: number;
  freeTierAllowance: string;
  specs: {
    compute: string;
    ram: string;
    storage: string;
    egress: string;
  };
  limitsNote: string;
}

export interface KubernetesNode {
  id: string;
  name: string;
  role: 'control-plane' | 'worker';
  status: 'Ready' | 'Provisioning' | 'NotReady';
  instanceType: string;
  zone: string;
  cpuAllocatableM: number;
  cpuUsedM: number;
  memAllocatableMi: number;
  memUsedMi: number;
  podCount: number;
  maxPods: number;
  age: string;
  isAutoscaled?: boolean;
}

export interface ClusterAutoscalerConfig {
  enabled: boolean;
  minNodes: number;
  maxNodes: number;
  currentNodes: number;
  scaleDownUnneededTime: string; // e.g. 10m
  scaleDownDelayAfterAdd: string; // e.g. 10m
  expanderStrategy: 'least-waste' | 'priority' | 'random';
  nodeGroupType: string;
  lastEvent?: {
    type: 'scale-up' | 'scale-down' | 'idle';
    message: string;
    timestamp: string;
  };
}

export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  durationMs: number;
  status: PipelineStageStatus;
  logs: string[];
  evidence?: {
    type: string;
    hash?: string;
    artifactName?: string;
    auditPassed: boolean;
    score?: string;
  };
}

export interface PipelineRun {
  id: string;
  commitHash: string;
  branch: string;
  author: string;
  timestamp: string;
  status: 'running' | 'success' | 'failed';
  totalDurationMs: number;
  stages: PipelineStage[];
  evidenceVerified: boolean;
  slsaLevel: number;
  attestationSignature?: string;
}

export interface KubernetesPod {
  id: string;
  name: string;
  namespace: string;
  node: string;
  status: 'Running' | 'Pending' | 'Terminating' | 'CrashLoopBackOff';
  ready: string;
  restarts: number;
  cpuUsageM: number;
  cpuLimitM: number;
  memUsageMi: number;
  memLimitMi: number;
  uptime: string;
  ip: string;
}

export interface HpaConfig {
  enabled: boolean;
  minReplicas: number;
  maxReplicas: number;
  currentReplicas: number;
  targetCpuPercentage: number;
  currentCpuPercentage: number;
  targetMemPercentage: number;
  currentMemPercentage: number;
  scaleUpStabilizationSeconds: number;
  scaleDownStabilizationSeconds: number;
}

export interface MetricDataPoint {
  time: string;
  cpuPercent: number;
  memoryMb: number;
  rps: number;
  latencyMs: number;
  errorRatePercent: number;
  activePods: number;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: '>' | '<';
  threshold: number;
  unit: string;
  duration: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  enabled: boolean;
  channel: 'Slack #devops-alerts' | 'Email' | 'Webhook';
  lastTriggered?: string;
  isFiring: boolean;
}

export interface SlackAlertEvent {
  id: string;
  ruleId: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  value: string;
  target: string;
  timestamp: string;
  message: string;
  status: 'firing' | 'acknowledged' | 'resolved';
}

export interface BackupSnapshot {
  id: string;
  name: string;
  type: 'Automated Daily' | 'Pre-deployment Manual' | 'Weekly Full';
  timestamp: string;
  sizeMb: number;
  storageTarget: 'Google Cloud Storage (GCS Standard/Nearline)' | 'AWS S3 Glacier' | 'Oracle Object Storage';
  encryption: 'AES-GCM-256 (Cloud KMS)';
  checksumSha256: string;
  status: 'Completed' | 'In-Progress' | 'Failed';
  retentionDays: number;
  rpoMin: number;
  rtoMin: number;
}

export interface SecurityAuditItem {
  id: string;
  category: 'Encryption' | 'Authentication' | 'Vulnerability' | 'Compliance';
  title: string;
  status: 'Compliant' | 'Enforced' | 'Warning' | 'Pending';
  standard: 'SOC 2 Type II' | 'ISO/IEC 27001' | 'GDPR' | 'NIST-800';
  details: string;
}

export interface ResourceQuotaNamespaceConfig {
  namespace: string;
  status: 'Active' | 'Warning' | 'Exceeded';
  cpuRequestsHardM: number;
  cpuLimitsHardM: number;
  memoryRequestsHardMi: number;
  memoryLimitsHardMi: number;
  maxPodsHard: number;
  pvcsHard: number;
  configMapsHard: number;
  secretsHard: number;
}

export type LogSeverity = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface PodLogEntry {
  id: string;
  timestamp: string;
  podName: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  latencyMs?: number;
}

export interface ProbeConfig {
  enabled: boolean;
  type: 'httpGet' | 'tcpSocket' | 'exec';
  httpPath: string;
  port: number;
  command?: string;
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  successThreshold: number;
  failureThreshold: number;
}

export type VpsProvider = 'oracle' | 'aws' | 'gcp' | 'hetzner' | 'digitalocean' | 'custom';
export type VpsRole = 'k8s-worker' | 'k8s-master' | 'database' | 'ingress-proxy' | 'cicd-runner' | 'monitoring';
export type VpsStatus = 'running' | 'provisioning' | 'stopped' | 'rebooting' | 'warning';

export interface VpsServer {
  id: string;
  name: string;
  provider: VpsProvider;
  role: VpsRole;
  status: VpsStatus;
  ipPublic: string;
  ipMesh: string;
  region: string;
  os: string;
  cpuCores: number;
  cpuArchitecture: 'arm64' | 'x86_64';
  ramGb: number;
  diskGb: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  diskUsagePercent: number;
  uptime: string;
  monthlyCostUsd: number;
  isFreeTier: boolean;
  k8sAttached: boolean;
  dockerVersion: string;
  sshUser: string;
  sshPort: number;
  loadAvg: string;
}
