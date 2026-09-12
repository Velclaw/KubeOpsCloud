import {
  CloudFreeTierInfo,
  PipelineStage,
  PipelineRun,
  KubernetesPod,
  KubernetesNode,
  ClusterAutoscalerConfig,
  CloudServiceComparisonItem,
  HpaConfig,
  AlertRule,
  SlackAlertEvent,
  BackupSnapshot,
  SecurityAuditItem,
  VpsServer,
} from '../types';

export const CLOUD_PROVIDERS: CloudFreeTierInfo[] = [
  {
    id: 'oracle',
    name: 'Oracle Cloud (OCI) Always Free',
    badge: '100% Free Forever (Best for K8s)',
    monthlyCost: 0.00,
    freeTierAllowance: '4 OCPU Ampere A1 ARM + 24 GB RAM + 200 GB NVMe Storage + 10 TB Egress/tháng',
    specs: {
      compute: '4 vCPU (ARM Ampere A1) Always Free',
      ram: '24 GB Memory vĩnh viễn',
      storage: '200 GB Block Storage (boot + data volume)',
      egress: '10 TB Outbound Data Transfer',
    },
    limitsNote: 'Lý tưởng nhất để dựng cụm Kubernetes k3s/MicroK8s 3-node hoàn toàn không mất 1 xu chi phí.',
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform (GCP) Free Tier',
    badge: '$300 Credit + GKE Free Cluster',
    monthlyCost: 0.00,
    freeTierAllowance: '1 GKE Zonal Cluster Free Management Fee + Cloud Run 2M reqs/tháng + Cloud Build 120 build-mins/ngày',
    specs: {
      compute: '1 e2-micro instance + GKE Free Tier fee ($74/tháng miễn phí)',
      ram: '1 GB (e2-micro) hoặc Cloud Run serverless scale to 0',
      storage: '5 GB Cloud Storage Standard (Backup bucket)',
      egress: '1 GB Network Egress miễn phí',
    },
    limitsNote: 'Tận dụng GKE Autopilot hoặc Cloud Run cho container serverless kết nối Artifact Registry miễn phí.',
  },
  {
    id: 'aws',
    name: 'AWS Free Tier (12 Months + Always Free)',
    badge: '750 Hours t4g/t3 + 5GB S3',
    monthlyCost: 0.00,
    freeTierAllowance: '750h t4g.small / t3.micro EC2 + 5GB S3 Standard + ECR 500MB/tháng + CloudWatch 10 metrics',
    specs: {
      compute: '750 giờ t4g.small hoặc t3.micro (1 vCPU, 2GB RAM)',
      ram: '2 GB RAM cho Single Node K3s',
      storage: '30 GB EBS General Purpose (SSD) Volume',
      egress: '100 GB Data Transfer Out per month',
    },
    limitsNote: 'Dùng K3s gọn nhẹ hoặc Docker Compose trên EC2 t4g.small kết hợp AWS CodePipeline / GitHub Actions.',
  },
];

export const CLOUD_FREE_TIER_MATRIX: CloudServiceComparisonItem[] = [
  {
    category: 'Compute',
    serviceNameGcp: 'Google Cloud Run + GKE Free Cluster + Compute Engine e2-micro',
    allowanceGcp: '• Cloud Run: 2,000,000 requests/tháng, 360,000 GB-giây RAM, 180,000 vCPU-giây (Always Free, scale-to-zero)\n• GKE: Miễn phí phí quản lý cụm (Cluster Management Fee) $74.40/tháng cho 1 Zonal/Autopilot Cluster\n• Compute Engine: 1 VM e2-micro (0.25-2 vCPU burstable, 1 GB RAM) vĩnh viễn tại US regions',
    serviceNameAws: 'AWS Lambda + EC2 Free Tier (t4g.small / t3.micro) + ECS / App Runner',
    allowanceAws: '• AWS Lambda: 1,000,000 requests/tháng + 3.2 triệu giây compute (Always Free)\n• Amazon EC2: 750 giờ/tháng instance t4g.small (Graviton ARM, 2GB RAM) hoặc t3.micro trong 12 tháng đầu\n• AWS App Runner: Hỗ trợ container web app tự scale theo request',
    recommendationForSmallProject: 'Khuyên dùng Google Cloud Run cho microservices/API stateless vì tự động scale về 0 khi không có người dùng, tiết kiệm tuyệt đối 100% ngân sách. Nếu cần Kubernetes cụm thật, dùng GKE Free Cluster tier hoặc EC2 t4g.small chạy K3s.',
    costSafetyTips: 'Đặt concurrency hợp lý và giới hạn max-instances = 3 để tránh bùng nổ chi phí khi bị DDoS.',
  },
  {
    category: 'Database',
    serviceNameGcp: 'Cloud Firestore (NoSQL) / Cloud Spanner evaluation / Neon / Supabase',
    allowanceGcp: '• Cloud Firestore: 1 GB dữ liệu lưu trữ, 50,000 lượt đọc (reads), 20,000 lượt ghi (writes), 20,000 lượt xóa (deletes) MỖI NGÀY hoàn toàn Always Free vĩnh viễn!\n• Cloud SQL: Không có gói Always Free (cần kết hợp Supabase/Neon free tier hoặc tự host Postgres trên e2-micro)',
    serviceNameAws: 'Amazon DynamoDB (NoSQL) + Amazon RDS Free Tier (PostgreSQL / MySQL)',
    allowanceAws: '• Amazon DynamoDB: 25 GB dung lượng lưu trữ + 25 WCU + 25 RCU Always Free vĩnh viễn (đủ xử lý tới 200M requests/tháng)\n• Amazon RDS: 750 giờ/tháng db.t3.micro hoặc db.t4g.micro (20 GB SSD storage + 20 GB backup) trong 12 tháng đầu',
    recommendationForSmallProject: 'Cho ứng dụng NoSQL: Cả DynamoDB và Firestore đều thuộc nhóm Always Free vô cùng hào phóng. Cho ứng dụng SQL cần quan hệ bảng: Nên dùng Amazon RDS trong 12 tháng đầu, hoặc kết nối Cloud SQL Free Evaluation / Neon serverless PostgreSQL.',
    costSafetyTips: 'Không bật multi-AZ hoặc Provisioned IOPS trong môi trường thử nghiệm; ưu tiên On-Demand capacity mode cho DynamoDB/Firestore.',
  },
  {
    category: 'Storage',
    serviceNameGcp: 'Google Cloud Storage (GCS Standard & Nearline)',
    allowanceGcp: '• 5 GB dung lượng lưu trữ Standard Cloud Storage mỗi tháng (tại các vùng us-east1, us-west1, us-central1)\n• 5,000 thao tác Class A (PUT, POST) + 50,000 thao tác Class B (GET) miễn phí hàng tháng',
    serviceNameAws: 'Amazon S3 (Simple Storage Service) + Amazon EFS',
    allowanceAws: '• 5 GB dung lượng Amazon S3 Standard Storage (12 tháng đầu)\n• 20,000 HTTP GET Requests + 2,000 HTTP PUT Requests\n• Amazon EFS: 5 GB General Purpose vĩnh viễn Always Free',
    recommendationForSmallProject: 'GCS của GCP có ưu điểm Always Free (vĩnh viễn) cho 5GB tại US regions, rất thích hợp lưu snapshot backup và assets. AWS S3 có hệ sinh thái công cụ rộng lớn nhất nhưng chỉ miễn phí trong 12 tháng đầu.',
    costSafetyTips: 'Bật Lifecycle Rule tự động xóa snapshot cũ sau 30 ngày để dung lượng không vượt ngưỡng 5 GB.',
  },
  {
    category: 'Networking & CDN',
    serviceNameGcp: 'Cloud CDN, Cloud DNS & Free Network Egress',
    allowanceGcp: '• 1 GB Network Egress miễn phí từ GCP ra Internet toàn cầu mỗi tháng\n• Miễn phí Google-managed SSL Certificates tự động cấp phát và gia hạn\n• Free Ingress (lưu lượng tải lên không tính phí)',
    serviceNameAws: 'Amazon CloudFront CDN + AWS Certificate Manager (ACM)',
    allowanceAws: '• Amazon CloudFront: 1 TB (1,000 GB) Data Transfer Out mỗi tháng vĩnh viễn Always Free!\n• 10,000,000 HTTP/HTTPS Requests miễn phí mỗi tháng\n• AWS Certificate Manager: Miễn phí 100% chứng chỉ SSL/TLS công khai',
    recommendationForSmallProject: 'Amazon CloudFront là &quot;nhà vô địch&quot; về CDN miễn phí với 1 TB data egress mỗi tháng vĩnh viễn. Kết hợp CloudFront làm lá chắn phía trước Cloud Run / Kubernetes giúp tiết kiệm 95% băng thông gốc.',
    costSafetyTips: 'Luôn bật bộ nhớ đệm (Cache) trên CDN cho static assets (JS, CSS, hình ảnh) với TTL tối thiểu 86400s.',
  },
  {
    category: 'CI/CD & Monitoring',
    serviceNameGcp: 'Cloud Build + Cloud Monitoring (Prometheus Integration) + Artifact Registry',
    allowanceGcp: '• Cloud Build: 120 build-minutes mỗi ngày hoàn toàn miễn phí\n• Artifact Registry: 0.5 GB lưu trữ container image miễn phí\n• Cloud Monitoring: 150 MB metrics log ingestion miễn phí hàng tháng',
    serviceNameAws: 'AWS CodePipeline + Amazon CloudWatch + Amazon ECR',
    allowanceAws: '• AWS CodePipeline: 1 active pipeline miễn phí mỗi tháng\n• Amazon ECR: 500 MB lưu trữ container image riêng tư mỗi tháng\n• Amazon CloudWatch: 10 custom metrics + 1,000,000 API requests miễn phí vĩnh viễn',
    recommendationForSmallProject: 'Dùng GitHub Actions cho CI/CD (2,000 phút miễn phí/tháng) kết hợp Prometheus & Grafana self-hosted trên cụm Kubernetes hoặc Cloud Run để kiểm soát toàn diện mà không phát sinh cước log cloud.',
    costSafetyTips: 'Thiết lập retention cho log không quá 7 ngày để tránh vượt dung lượng lưu trữ audit.',
  },
];

export const FREE_TIER_BLUEPRINTS = [
  {
    id: 'blueprint-gcp-serverless',
    title: 'Kiến Trúc 1: Google Cloud Zero-Cost Container (Khuyên Dùng Cho Web App)',
    cloud: 'Google Cloud Platform (GCP)',
    badge: 'Chi phí: $0.00 / tháng',
    description: 'Dành cho các ứng dụng web, REST API, Microservices của dự án nhỏ. Triển khai hoàn toàn Serverless không cần quản lý máy chủ.',
    stack: [
      { name: 'Compute: Google Cloud Run', note: 'Tự scale từ 0 đến N container, miễn phí 2 triệu requests/tháng' },
      { name: 'Database: Cloud Firestore (NoSQL)', note: 'Miễn phí vĩnh viễn 1GB + 50k reads, 20k writes mỗi ngày' },
      { name: 'Storage: Cloud Storage Standard', note: '5GB lưu trữ hình ảnh, backup database định kỳ' },
      { name: 'CI/CD: GitHub Actions', note: 'Build, test tự động và deploy thẳng lên Cloud Run qua Workload Identity' },
    ],
    pros: ['Tuyệt đối $0.00 khi không có lưu lượng truy cập', 'Bảo mật đỉnh cao, không cần vá lỗi OS', 'Triển khai cực nhanh chỉ với 1 lệnh gcloud'],
    cons: ['Có cold-start nhẹ (~1-2s) nếu lâu không có request'],
  },
  {
    id: 'blueprint-aws-hybrid',
    title: 'Kiến Trúc 2: AWS Elastic Free Tier (Lý Tưởng Cho Dự Án Kèm CDN Lớn)',
    cloud: 'Amazon Web Services (AWS)',
    badge: 'Chi phí: $0.00 / tháng (12 tháng đầu)',
    description: 'Tận dụng gói 12 tháng đầu của AWS EC2 t4g.small kết hợp kho tài nguyên vĩnh viễn DynamoDB và CloudFront 1TB.',
    stack: [
      { name: 'Compute: Amazon EC2 t4g.small', note: 'Chạy cụm Kubernetes K3s nhỏ gọn (1 vCPU ARM, 2GB RAM, 750 giờ/tháng)' },
      { name: 'Database: Amazon DynamoDB', note: 'Always Free 25GB, 25 WCU/RCU gánh hàng chục triệu queries' },
      { name: 'CDN & SSL: Amazon CloudFront', note: 'Miễn phí 1TB băng thông egress ra Internet + SSL miễn phí' },
      { name: 'Storage: Amazon S3', note: '5GB lưu trữ tĩnh và file sao lưu mã hóa AES-256' },
    ],
    pros: ['Băng thông CDN 1TB khổng lồ miễn phí vĩnh viễn', 'Kiểm soát toàn quyền máy chủ Linux và Docker'],
    cons: ['EC2 miễn phí trong 12 tháng đầu; sau 12 tháng chuyển sang Lambda hoặc OCI Free Tier'],
  },
  {
    id: 'blueprint-oci-k8s',
    title: 'Kiến Trúc 3: Cụm Kubernetes Độc Lập Vĩnh Viễn (Oracle OCI Always Free)',
    cloud: 'Oracle Cloud (OCI)',
    badge: 'Chi phí: $0.00 Vĩnh Viễn (Full K8s)',
    description: 'Lựa chọn tối thượng nếu bạn bắt buộc phải có một cụm Kubernetes nhiều node thật sự với HPA và Cluster Autoscaler.',
    stack: [
      { name: 'Compute: 4 OCPU ARM Ampere A1', note: 'Phân chia thành cụm 2-3 Worker Nodes với 24GB RAM cực mạnh' },
      { name: 'Storage: 200GB Block Volume NVMe', note: 'Thoải mái cho Persistent Volume (Postgres, Prometheus, Grafana)' },
      { name: 'Network: 10TB Egress/tháng', note: 'Hào phóng gấp 10 lần so với các cloud khác' },
    ],
    pros: ['Cụm K8s đa node mạnh nhất trong tất cả các Free Tier', 'Không giới hạn 12 tháng'],
    cons: ['Đăng ký tài khoản OCI đôi khi cần thẻ tín dụng xác minh nghiêm ngặt'],
  },
];

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'lint_check',
    name: 'Lint & Type Safety Validation',
    description: 'Chạy ESLint, TypeScript compiler --noEmit và Prettier format audit',
    durationMs: 4200,
    status: 'success',
    logs: [
      '[INIT] Checking git workspace sha: 7f3b90a...',
      '[EXEC] npm run lint: checking 48 source files...',
      '[PASS] TypeScript compilation completed with 0 errors.',
      '[PASS] ESLint rule checks: clean (0 warnings, 0 errors).',
      '[RESULT] Lint & Code Quality gate: PASSED.'
    ],
    evidence: {
      type: 'Static Code Analysis Report (SARIF)',
      hash: 'sha256:4a8e23f009b1cd45903b12398fa98892',
      artifactName: 'sarif-lint-results.json',
      auditPassed: true,
      score: '100/100',
    },
  },
  {
    id: 'unit_tests',
    name: 'Unit & Contract Test Suite',
    description: 'Thực thi Jest/Vitest test runner với code coverage gate > 85%',
    durationMs: 8700,
    status: 'success',
    logs: [
      '[INIT] Booting test container with Node.js 22 LTS...',
      '[RUN] 32 test suites, 148 test cases running...',
      '[PASS] auth.controller.spec.ts: 12 tests passed',
      '[PASS] kubernetes.hpa.spec.ts: 8 tests passed',
      '[PASS] backup.restore.spec.ts: 16 tests passed',
      '[COVERAGE] Stmts: 91.4% | Branch: 88.2% | Funcs: 94.0% | Lines: 92.1%',
      '[RESULT] Test gate: ALL GREEN (148/148 passed).'
    ],
    evidence: {
      type: 'JUnit Test & Istanbul Coverage XML',
      hash: 'sha256:d898a87b1c34aef99102454efb567a12',
      artifactName: 'junit-test-evidence.xml',
      auditPassed: true,
      score: '92.1% Coverage',
    },
  },
  {
    id: 'security_sast',
    name: 'SAST & Secret Leak Detection',
    description: 'Quét lỗ hổng tĩnh Trivy, Gitleaks và kiểm tra Dependency Check (CVE audit)',
    durationMs: 6500,
    status: 'success',
    logs: [
      '[INIT] Fetching latest CVE National Vulnerability Database...',
      '[EXEC] Gitleaks scanning git commit history for API keys / tokens...',
      '[PASS] No hardcoded credentials or secret leaks detected.',
      '[EXEC] Trivy filesystem scan on dependencies...',
      '[PASS] 0 Critical, 0 High vulnerabilities found in npm tree.',
      '[RESULT] Security SAST gate: PASSED (Zero High/Critical).'
    ],
    evidence: {
      type: 'Trivy SAST Security Attestation',
      hash: 'sha256:91efaa447812bc890014aef788234190',
      artifactName: 'trivy-security-audit.json',
      auditPassed: true,
      score: '0 Vulnerabilities',
    },
  },
  {
    id: 'docker_build',
    name: 'Multi-stage Container Build',
    description: 'Build OCI compliant container image với Alpine non-root distroless',
    durationMs: 14200,
    status: 'success',
    logs: [
      '[DOCKER] Target: ghcr.io/org/kubeops-runtime:v1.4.2',
      '[BUILD] Stage 1: Build binary using node:22-alpine (cached)',
      '[BUILD] Stage 2: Packaging into distroless non-root (UID 10001)',
      '[OPTIMIZE] Image compressed to 42.8 MB (Free Tier friendly)',
      '[IMAGE] SHA: sha256:ee8901235bcaef89024512...',
      '[RESULT] Container Build: SUCCESS.'
    ],
    evidence: {
      type: 'OCI Image Digest Manifest',
      hash: 'sha256:ee8901235bcaef890245126781290345',
      artifactName: 'image-digest.json',
      auditPassed: true,
      score: '42.8 MB Size',
    },
  },
  {
    id: 'cosign_sign',
    name: 'Cosign Image Signing & SLSA Provenance',
    description: 'Ký số mật mã container image qua Sigstore Cosign với OIDC Fulcio/Rekor',
    durationMs: 5100,
    status: 'success',
    logs: [
      '[COSIGN] Requesting short-lived OIDC keyless certificate from Fulcio...',
      '[COSIGN] Attaching SLSA Level 3 Build Provenance to Rekor Transparency Log...',
      '[VERIFY] Signature validated against transparency log uuid: 242960...',
      '[CERT] Green Evidence Certificate created and sealed cryptographically.',
      '[RESULT] Supply Chain Security: VERIFIED GREEN.'
    ],
    evidence: {
      type: 'Cosign Rekor SLSA-3 Attestation Bundle',
      hash: 'sha256:ff0132890aef78129082345678912345',
      artifactName: 'cosign-attestation.bundle',
      auditPassed: true,
      score: 'SLSA Level 3 Certified',
    },
  },
  {
    id: 'k8s_deploy',
    name: 'Zero-Downtime Rollout to Kubernetes',
    description: 'Áp dụng RollingUpdate Deployment, cập nhật Pods và kiểm tra Readiness Probe',
    durationMs: 9800,
    status: 'success',
    logs: [
      '[K8S] Connecting to cluster: production-k8s-free-tier (namespace: default)...',
      '[APPLY] kubectl apply -f k8s/deployment.yaml',
      '[ROLLOUT] deployment "kubeops-api" successfully rolled out.',
      '[HEALTHCHECK] Readiness probe /api/health returned HTTP 200 OK.',
      '[TRAFFIC] Traffic shifted safely via Ingress Nginx.',
      '[RESULT] Production Deployment: LIVE & STABLE.'
    ],
    evidence: {
      type: 'Kubernetes Rollout Audit Log',
      hash: 'sha256:671289abcedf90124567890123456789',
      artifactName: 'k8s-rollout-evidence.log',
      auditPassed: true,
      score: 'Zero Downtime (100% Availability)',
    },
  },
];

export const INITIAL_PIPELINE_RUN: PipelineRun = {
  id: 'run-9842',
  commitHash: '8b19e42',
  branch: 'main',
  author: 'SRE DevOps Lead <huynhthuong.xyz@gmail.com>',
  timestamp: 'Vừa xong (12/09/2026 14:38:22)',
  status: 'success',
  totalDurationMs: 48500,
  stages: INITIAL_PIPELINE_RUN_STAGES(),
  evidenceVerified: true,
  slsaLevel: 3,
  attestationSignature: 'sig_ecdsa_p256_rekor_9f81a7002bc...',
};

function INITIAL_PIPELINE_RUN_STAGES(): PipelineStage[] {
  return JSON.parse(JSON.stringify(INITIAL_PIPELINE_STAGES));
}

export const INITIAL_PODS: KubernetesPod[] = [
  {
    id: 'pod-1',
    name: 'kubeops-api-749bfd986-x8m2q',
    namespace: 'production',
    node: 'worker-node-1 (ampere-a1)',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    cpuUsageM: 110,
    cpuLimitM: 300,
    memUsageMi: 184,
    memLimitMi: 384,
    uptime: '14d 6h',
    ip: '10.244.1.42',
  },
  {
    id: 'pod-2',
    name: 'kubeops-api-749bfd986-p4l9a',
    namespace: 'production',
    node: 'worker-node-2 (ampere-a1)',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    cpuUsageM: 95,
    cpuLimitM: 300,
    memUsageMi: 172,
    memLimitMi: 384,
    uptime: '14d 6h',
    ip: '10.244.2.18',
  },
  {
    id: 'pod-3',
    name: 'prometheus-k8s-0',
    namespace: 'monitoring',
    node: 'worker-node-1 (ampere-a1)',
    status: 'Running',
    ready: '2/2',
    restarts: 0,
    cpuUsageM: 140,
    cpuLimitM: 500,
    memUsageMi: 420,
    memLimitMi: 800,
    uptime: '30d 12h',
    ip: '10.244.1.12',
  },
  {
    id: 'pod-4',
    name: 'grafana-core-599fd8cf5-7b8zx',
    namespace: 'monitoring',
    node: 'worker-node-2 (ampere-a1)',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    cpuUsageM: 45,
    cpuLimitM: 200,
    memUsageMi: 118,
    memLimitMi: 256,
    uptime: '30d 12h',
    ip: '10.244.2.25',
  },
  {
    id: 'pod-5',
    name: 'ingress-nginx-controller-v9k2',
    namespace: 'ingress-nginx',
    node: 'worker-node-1 (ampere-a1)',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    cpuUsageM: 65,
    cpuLimitM: 300,
    memUsageMi: 145,
    memLimitMi: 300,
    uptime: '45d',
    ip: '10.244.1.8',
  },
];

export const INITIAL_NODES: KubernetesNode[] = [
  {
    id: 'node-1',
    name: 'worker-node-1',
    role: 'worker',
    status: 'Ready',
    instanceType: 'e2-micro / t4g.small (Free Tier)',
    zone: 'asia-east1-a',
    cpuAllocatableM: 1000,
    cpuUsedM: 380,
    memAllocatableMi: 2048,
    memUsedMi: 890,
    podCount: 3,
    maxPods: 110,
    age: '45d',
    isAutoscaled: false,
  },
  {
    id: 'node-2',
    name: 'worker-node-2',
    role: 'worker',
    status: 'Ready',
    instanceType: 'e2-micro / t4g.small (Free Tier)',
    zone: 'asia-east1-b',
    cpuAllocatableM: 1000,
    cpuUsedM: 260,
    memAllocatableMi: 2048,
    memUsedMi: 680,
    podCount: 2,
    maxPods: 110,
    age: '45d',
    isAutoscaled: false,
  },
  {
    id: 'node-vps-oci-ampere-01',
    name: 'vps-oracle-ampere-k8s-01',
    role: 'worker',
    status: 'Ready',
    instanceType: 'Oracle Ampere A1 4 vCPU / 24GB (VPS)',
    zone: 'ap-singapore-1 (WireGuard Mesh)',
    cpuAllocatableM: 4000,
    cpuUsedM: 1520,
    memAllocatableMi: 24576,
    memUsedMi: 10813,
    podCount: 4,
    maxPods: 110,
    age: '64d',
    isAutoscaled: false,
  },
  {
    id: 'node-vps-gcp-f1-proxy',
    name: 'vps-gcp-ingress-edge-01',
    role: 'worker',
    status: 'Ready',
    instanceType: 'GCP e2-micro 1 vCPU / 1GB (VPS)',
    zone: 'asia-east1-a (WireGuard Mesh)',
    cpuAllocatableM: 1000,
    cpuUsedM: 180,
    memAllocatableMi: 1024,
    memUsedMi: 358,
    podCount: 1,
    maxPods: 60,
    age: '110d',
    isAutoscaled: false,
  },
];

export const INITIAL_CLUSTER_AUTOSCALER: ClusterAutoscalerConfig = {
  enabled: true,
  minNodes: 1,
  maxNodes: 8,
  currentNodes: 4,
  scaleDownUnneededTime: '10m',
  scaleDownDelayAfterAdd: '10m',
  expanderStrategy: 'least-waste',
  nodeGroupType: 'managed-nodepool-hybrid-vps',
  lastEvent: {
    type: 'idle',
    message: 'Cụm đang hoạt động ổn định với 4 Nodes (bao gồm VPS Oracle Ampere & GCP Edge qua WireGuard Mesh).',
    timestamp: '14:35:00',
  },
};

export const INITIAL_HPA: HpaConfig = {
  enabled: true,
  minReplicas: 1,
  maxReplicas: 6,
  currentReplicas: 2,
  targetCpuPercentage: 70,
  currentCpuPercentage: 35,
  targetMemPercentage: 75,
  currentMemPercentage: 46,
  scaleUpStabilizationSeconds: 0,
  scaleDownStabilizationSeconds: 300,
};

export const INITIAL_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-cpu',
    name: 'KubePodHighCpuUsage',
    metric: 'container_cpu_usage_percentage',
    condition: '>',
    threshold: 75,
    unit: '%',
    duration: '2m',
    severity: 'CRITICAL',
    enabled: true,
    channel: 'Slack #devops-alerts',
    lastTriggered: 'Hôm qua lúc 19:42',
    isFiring: false,
  },
  {
    id: 'rule-err',
    name: 'HighHttpErrorRate5xx',
    metric: 'http_requests_5xx_rate',
    condition: '>',
    threshold: 2.0,
    unit: '%',
    duration: '1m',
    severity: 'CRITICAL',
    enabled: true,
    channel: 'Slack #devops-alerts',
    lastTriggered: '3 ngày trước',
    isFiring: false,
  },
  {
    id: 'rule-lat',
    name: 'HighRequestLatencyP95',
    metric: 'http_request_duration_p95_ms',
    condition: '>',
    threshold: 350,
    unit: 'ms',
    duration: '3m',
    severity: 'WARNING',
    enabled: true,
    channel: 'Slack #devops-alerts',
    lastTriggered: '5 ngày trước',
    isFiring: false,
  },
  {
    id: 'rule-pod-restart',
    name: 'PodCrashLoopBackOffDetected',
    metric: 'kube_pod_container_status_restarts_total',
    condition: '>',
    threshold: 3,
    unit: 'restarts',
    duration: '5m',
    severity: 'CRITICAL',
    enabled: true,
    channel: 'Slack #devops-alerts',
    isFiring: false,
  },
  {
    id: 'rule-backup',
    name: 'BackupJobFailedOrMissed',
    metric: 'backup_last_success_timestamp_seconds',
    condition: '>',
    threshold: 26,
    unit: 'hours',
    duration: '10m',
    severity: 'WARNING',
    enabled: true,
    channel: 'Slack #devops-alerts',
    isFiring: false,
  },
];

export const INITIAL_SLACK_EVENTS: SlackAlertEvent[] = [
  {
    id: 'slack-evt-1',
    ruleId: 'rule-cpu',
    title: '🚨 KubePodHighCpuUsage Fired on deployment/kubeops-api',
    severity: 'CRITICAL',
    value: 'CPU 84.6% (> 75% ngưỡng thiết lập)',
    target: 'production / deployment/kubeops-api',
    timestamp: '12/09/2026 14:15:30',
    message: 'Lưu lượng tăng đột biến từ chiến dịch khuyến mãi. HPA đã tự động kích hoạt scale từ 2 pods lên 4 pods để giảm tải.',
    status: 'resolved',
  },
  {
    id: 'slack-evt-2',
    ruleId: 'rule-lat',
    title: '⚠️ HighRequestLatencyP95 Exceeded Threshold',
    severity: 'WARNING',
    value: 'P95 Latency 380ms (> 350ms)',
    target: 'ingress / service/api-gateway',
    timestamp: '12/09/2026 11:20:12',
    message: 'Cụm Database tạm thời bận do tác vụ vacuum phân vùng. Đã phục hồi sau 2 phút.',
    status: 'resolved',
  },
];

export const INITIAL_BACKUPS: BackupSnapshot[] = [
  {
    id: 'bk-20260912-daily',
    name: 'prod-k8s-daily-snapshot-20260912-020000',
    type: 'Automated Daily',
    timestamp: 'Hôm nay lúc 02:00 UTC (Định kỳ)',
    sizeMb: 684.2,
    storageTarget: 'Google Cloud Storage (GCS Standard/Nearline)',
    encryption: 'AES-GCM-256 (Cloud KMS)',
    checksumSha256: '9f041b3489eac0032ba8912ef57b89a01239845761829034',
    status: 'Completed',
    retentionDays: 30,
    rpoMin: 5,
    rtoMin: 1.8,
  },
  {
    id: 'bk-20260911-daily',
    name: 'prod-k8s-daily-snapshot-20260911-020000',
    type: 'Automated Daily',
    timestamp: 'Hôm qua lúc 02:00 UTC',
    sizeMb: 672.8,
    storageTarget: 'Google Cloud Storage (GCS Standard/Nearline)',
    encryption: 'AES-GCM-256 (Cloud KMS)',
    checksumSha256: '4489aef781290382348912ba09148efbc347890123456789',
    status: 'Completed',
    retentionDays: 30,
    rpoMin: 5,
    rtoMin: 2.1,
  },
  {
    id: 'bk-20260905-weekly',
    name: 'prod-k8s-weekly-full-20260905-000000',
    type: 'Weekly Full',
    timestamp: '05/09/2026 00:00 UTC',
    sizeMb: 2410.5,
    storageTarget: 'Oracle Object Storage',
    encryption: 'AES-GCM-256 (Cloud KMS)',
    checksumSha256: '778901248901234efac1298401923489bcdaeef781203948',
    status: 'Completed',
    retentionDays: 90,
    rpoMin: 15,
    rtoMin: 4.5,
  },
];

export const INITIAL_SECURITY_ITEMS: SecurityAuditItem[] = [
  {
    id: 'sec-1',
    category: 'Encryption',
    title: 'End-to-End TLS 1.3 In-Transit Encryption',
    status: 'Enforced',
    standard: 'ISO/IEC 27001',
    details: 'Mọi Ingress endpoint đều được cấp phát chứng chỉ tự động qua cert-manager Let\'s Encrypt với giao thức TLS 1.3, ciphersuite an toàn tuyệt đối.',
  },
  {
    id: 'sec-2',
    category: 'Encryption',
    title: 'AES-256 Data-at-Rest Storage & Backup Sealing',
    status: 'Enforced',
    standard: 'SOC 2 Type II',
    details: 'Dữ liệu Persistent Volume (PV), Database WAL và các bản snapshot đẩy lên Cloud Storage đều mã hóa bằng khóa AES-GCM-256.',
  },
  {
    id: 'sec-3',
    category: 'Authentication',
    title: 'Multi-Factor Authentication (MFA/2FA) Enforcement',
    status: 'Enforced',
    standard: 'NIST-800',
    details: 'Bắt buộc xác thực đa yếu tố TOTP/FIDO2 WebAuthn cho toàn bộ tài khoản có quyền truy cập kubectl, CI/CD secrets và bảng điều khiển Cloud.',
  },
  {
    id: 'sec-4',
    category: 'Authentication',
    title: 'Kubernetes RBAC (Role-Based Access Control)',
    status: 'Compliant',
    standard: 'SOC 2 Type II',
    details: 'Áp dụng nguyên tắc đặc quyền tối thiểu (Least Privilege). Pods chạy bằng ServiceAccount không có quyền cluster-admin.',
  },
  {
    id: 'sec-5',
    category: 'Compliance',
    title: 'GDPR & Privacy Compliance (Right to Erasure & Export)',
    status: 'Compliant',
    standard: 'GDPR',
    details: 'Đã xây dựng cơ chế ẩn danh hóa log, xóa dữ liệu theo yêu cầu và báo cáo luồng di chuyển dữ liệu theo quy chuẩn EU GDPR.',
  },
  {
    id: 'sec-6',
    category: 'Vulnerability',
    title: 'Non-Root Distroless Container Runtime',
    status: 'Compliant',
    standard: 'ISO/IEC 27001',
    details: 'Tất cả container image chạy dưới User ID 10001 (non-root), readOnlyRootFilesystem: true, drop ALL Linux capabilities.',
  },
];

export const YAML_MANIFESTS = {
  githubActions: `name: Production CI/CD Pipeline (Evidence Xanh)

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  verify-and-attest:
    name: Lint, Test & Generate Green Evidence
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write # Cần thiết cho Cosign keyless signing
      security-events: write

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: 1. Code Quality & Type Check
        run: |
          npm run lint
          npx tsc --noEmit

      - name: 2. Run Test Suite with Coverage
        run: |
          npm test -- --coverage --ci --json --outputFile=test-report.json

      - name: 3. Security Scan (Trivy SAST & Secrets)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: 4. Build Multi-Stage Docker Image
        run: |
          docker build -t ghcr.io/\${{ github.repository }}:\${{ github.sha }} .

      - name: 5. Sign Container Image with Cosign (Keyless)
        uses: sigstore/cosign-installer@v3.5.0
      - run: |
          cosign sign --yes ghcr.io/\${{ github.repository }}:\${{ github.sha }}

      - name: 6. Publish Evidence & Green Audit Report
        uses: actions/upload-artifact@v4
        with:
          name: green-evidence-bundle-\${{ github.sha }}
          path: |
            test-report.json
            trivy-results.sarif

  deploy-kubernetes:
    needs: verify-and-attest
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Kubeconfig (Free Tier Cluster)
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: \${{ secrets.KUBECONFIG_FREE_TIER }}

      - name: Rolling Deploy to Kubernetes
        run: |
          kubectl set image deployment/kubeops-api \\
            app=ghcr.io/\${{ github.repository }}:\${{ github.sha }} -n production
          kubectl rollout status deployment/kubeops-api -n production --timeout=120s

      - name: Notify Slack on Success
        uses: slackapi/slack-github-action@v1.26.0
        with:
          payload: |
            {"text": "✅ Production CI/CD Deployed Successfully! Commit \${{ github.sha }}"}
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}`,

  deploymentYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubeops-api
  namespace: production
  labels:
    app: kubeops-api
    tier: backend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
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
        - name: app
          image: ghcr.io/org/kubeops-api:v1.4.2
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
              name: http
          # Tối ưu Free Tier: Request nhỏ để node nhẹ gánh
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 400m
              memory: 384Mi
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]`,

  hpaYaml: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kubeops-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kubeops-api
  minReplicas: 1 # Tiết kiệm tài nguyên Free Tier khi rảnh
  maxReplicas: 5 # Tự động tăng khi lưu lượng tăng đột biến
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300 # Chống flapping (co giãn liên tục)`,

  prometheusRules: `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kubeops-alert-rules
  namespace: monitoring
  labels:
    role: alert-rules
spec:
  groups:
    - name: kubeops.rules
      rules:
        # 1. Cảnh báo CPU vượt 75%
        - alert: KubePodHighCpuUsage
          expr: sum(rate(container_cpu_usage_seconds_total{namespace="production", pod=~"kubeops-api.*"}[2m])) by (pod) / sum(kube_pod_container_resource_limits{resource="cpu", namespace="production"}) by (pod) * 100 > 75
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{ $labels.pod }} CPU usage is over 75%"
            description: "High CPU usage detected. Current value: {{ $value }}%. HPA should scale automatically."

        # 2. Cảnh báo Lỗi 5xx
        - alert: HighHttpErrorRate5xx
          expr: sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100 > 2
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "HTTP 5xx error rate is exceeding 2%"

        # 3. Cảnh báo Pod CrashLoop
        - alert: PodCrashLooping
          expr: rate(kube_pod_container_status_restarts_total[5m]) * 60 > 2
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{ $labels.pod }} is restarting frequently"`,

  backupCronJob: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: cloud-backup-scheduler
  namespace: production
spec:
  # Chạy tự động lúc 02:00 sáng mỗi ngày (UTC)
  schedule: "0 2 * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup-worker
              image: google/cloud-sdk:alpine
              command:
                - /bin/sh
                - -c
                - |
                  set -e
                  echo "==> Khởi chạy sao lưu cơ sở dữ liệu định kỳ..."
                  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                  BACKUP_FILE="backup_\${TIMESTAMP}.tar.gz"
                  
                  # 1. Export DB & PV snapshot
                  pg_dumpall -h postgres-db -U postgres | gzip -c > /tmp/\${BACKUP_FILE}
                  
                  # 2. Mã hóa AES-256 bằng Cloud KMS
                  echo "==> Mã hóa tệp sao lưu bằng chuẩn AES-GCM-256..."
                  openssl enc -aes-256-cbc -salt -in /tmp/\${BACKUP_FILE} -out /tmp/\${BACKUP_FILE}.enc -pass env:BACKUP_KEY
                  
                  # 3. Đồng bộ lên Cloud Storage miễn phí (GCS Bucket / AWS S3)
                  echo "==> Tải lên Cloud Bucket..."
                  gsutil cp /tmp/\${BACKUP_FILE}.enc gs://my-free-tier-backup-bucket/daily/
                  
                  echo "==> Sao lưu thành công! SHA256: $(sha256sum /tmp/\${BACKUP_FILE}.enc)"
              env:
                - name: BACKUP_KEY
                  valueFrom:
                    secretKeyRef:
                      name: backup-encryption-secret
                      key: aes-key`,

  dockerfile: `# Multi-stage Dockerfile chuẩn Non-Root & Tối ưu Dung lượng cho Cloud Free Tier
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

# Production Runtime Image (Siêu nhẹ, bảo mật tối đa)
FROM node:22-alpine AS runner
WORKDIR /app

# Thiết lập user không có quyền root (UID 10001)
RUN addgroup -g 10001 appgroup && \\
    adduser -u 10001 -G appgroup -s /bin/sh -D appuser

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]`,

  clusterAutoscalerYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8085'
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
        - image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.30.0
          name: cluster-autoscaler
          resources:
            limits:
              cpu: 100m
              memory: 300Mi
            requests:
              cpu: 50m
              memory: 100Mi
          command:
            - ./cluster-autoscaler
            - --v=4
            - --stderrthreshold=info
            - --cloud-provider=gce # hoặc aws / oci
            - --skip-nodes-with-local-storage=false
            - --expander=least-waste # Thuật toán chọn node tiết kiệm tài nguyên nhất
            # Cấu hình Min: 1 node (khi rảnh $0.00), Max: 5 nodes (khi spike tải cao)
            - --nodes=1:5:k8s-worker-nodepool-free-tier
            - --scale-down-unneeded-time=10m
            - --scale-down-delay-after-add=10m
            - --scale-down-utilization-threshold=0.5
            - --balance-similar-node-groups=true
          env:
            - name: AWS_REGION
              value: ap-southeast-1
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 10001
            capabilities:
              drop: ["ALL"]`,
  vpsMeshConfig: `# ==============================================================================
# WireGuard Hybrid Mesh & K3s Multi-Cloud Worker Node Join Configuration
# Kết nối an toàn VPS (Oracle, AWS, GCP, Hetzner) vào cụm K8s qua VPN kernel-level
# ==============================================================================

# --- 1. /etc/wireguard/wg0.conf (Trên từng máy chủ VPS Worker) ---
# [Interface]
# Address = 10.8.0.2/24 # IP riêng biệt cho từng VPS
# PrivateKey = <VPS_CLIENT_PRIVATE_KEY>
# ListenPort = 51820
# PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
#
# [Peer]
# # Thông tin K8s Control Plane Master
# PublicKey = <MASTER_SERVER_PUBLIC_KEY>
# Endpoint = 140.238.12.89:51820
# AllowedIPs = 10.8.0.0/24, 10.42.0.0/16 # K8s Pod CIDR
# PersistentKeepalive = 25

# --- 2. Systemd Service K3s Agent qua WireGuard Mesh ---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: wireguard-mesh-node-agent
  namespace: kube-system
  labels:
    tier: node-networking
    app: wireguard-mesh
spec:
  selector:
    matchLabels:
      name: wireguard-mesh
  template:
    metadata:
      labels:
        name: wireguard-mesh
    spec:
      hostNetwork: true
      containers:
        - name: wg-mesh-healthcheck
          image: ghcr.io/devops-org/wg-mesh-probe:v1.2.0
          securityContext:
            capabilities:
              add: ["NET_ADMIN"]
          env:
            - name: MESH_SUBNET
              value: "10.8.0.0/24"
            - name: PROMETHEUS_PORT
              value: "9586"
          resources:
            limits:
              cpu: 50m
              memory: 64Mi
            requests:
              cpu: 10m
              memory: 32Mi`,
};

export const INITIAL_VPS_SERVERS: VpsServer[] = [
  {
    id: 'vps-oci-ampere-01',
    name: 'vps-oracle-ampere-k8s-01',
    provider: 'oracle',
    role: 'k8s-worker',
    status: 'running',
    ipPublic: '140.238.12.89',
    ipMesh: '10.8.0.2',
    region: 'ap-singapore-1 (OCI Free Tier)',
    os: 'Ubuntu 24.04 LTS (aarch64)',
    cpuCores: 4,
    cpuArchitecture: 'arm64',
    ramGb: 24,
    diskGb: 100,
    cpuUsagePercent: 38,
    ramUsagePercent: 44,
    diskUsagePercent: 28,
    uptime: '64d 18h',
    monthlyCostUsd: 0.0,
    isFreeTier: true,
    k8sAttached: true,
    dockerVersion: '26.1.3 / containerd v1.7.15',
    sshUser: 'ubuntu',
    sshPort: 2222,
    loadAvg: '0.42, 0.35, 0.28',
  },
  {
    id: 'vps-oci-ampere-02',
    name: 'vps-oracle-db-redis-02',
    provider: 'oracle',
    role: 'database',
    status: 'running',
    ipPublic: '140.238.12.92',
    ipMesh: '10.8.0.3',
    region: 'ap-singapore-1 (OCI Free Tier)',
    os: 'Debian 12 Bookworm (aarch64)',
    cpuCores: 2,
    cpuArchitecture: 'arm64',
    ramGb: 12,
    diskGb: 80,
    cpuUsagePercent: 29,
    ramUsagePercent: 52,
    diskUsagePercent: 41,
    uptime: '92d 04h',
    monthlyCostUsd: 0.0,
    isFreeTier: true,
    k8sAttached: false,
    dockerVersion: '26.0.2',
    sshUser: 'debian',
    sshPort: 2222,
    loadAvg: '0.31, 0.28, 0.25',
  },
  {
    id: 'vps-gcp-f1-proxy',
    name: 'vps-gcp-ingress-edge-01',
    provider: 'gcp',
    role: 'ingress-proxy',
    status: 'running',
    ipPublic: '34.142.188.45',
    ipMesh: '10.8.0.4',
    region: 'asia-east1-a (Taiwan Free Tier)',
    os: 'Ubuntu 22.04 LTS (x86_64)',
    cpuCores: 1,
    cpuArchitecture: 'x86_64',
    ramGb: 1,
    diskGb: 30,
    cpuUsagePercent: 18,
    ramUsagePercent: 35,
    diskUsagePercent: 22,
    uptime: '110d 12h',
    monthlyCostUsd: 0.0,
    isFreeTier: true,
    k8sAttached: true,
    dockerVersion: '25.0.4',
    sshUser: 'gcp-ops',
    sshPort: 22,
    loadAvg: '0.15, 0.12, 0.09',
  },
  {
    id: 'vps-aws-lightsail-runner',
    name: 'vps-aws-cicd-runner-01',
    provider: 'aws',
    role: 'cicd-runner',
    status: 'running',
    ipPublic: '13.250.84.110',
    ipMesh: '10.8.0.5',
    region: 'ap-southeast-1 (Singapore Free Tier 3M)',
    os: 'Amazon Linux 2023 (x86_64)',
    cpuCores: 2,
    cpuArchitecture: 'x86_64',
    ramGb: 4,
    diskGb: 60,
    cpuUsagePercent: 22,
    ramUsagePercent: 38,
    diskUsagePercent: 34,
    uptime: '31d 08h',
    monthlyCostUsd: 0.0,
    isFreeTier: true,
    k8sAttached: false,
    dockerVersion: '25.0.5',
    sshUser: 'ec2-user',
    sshPort: 22,
    loadAvg: '0.18, 0.16, 0.14',
  },
  {
    id: 'vps-hetzner-backup',
    name: 'vps-hetzner-backup-loki-01',
    provider: 'hetzner',
    role: 'monitoring',
    status: 'running',
    ipPublic: '65.108.72.19',
    ipMesh: '10.8.0.6',
    region: 'fsn1-dc14 (Falkenstein, DE)',
    os: 'Debian 12 Bookworm (x86_64)',
    cpuCores: 2,
    cpuArchitecture: 'x86_64',
    ramGb: 4,
    diskGb: 40,
    cpuUsagePercent: 25,
    ramUsagePercent: 48,
    diskUsagePercent: 39,
    uptime: '54d 21h',
    monthlyCostUsd: 4.15,
    isFreeTier: false,
    k8sAttached: true,
    dockerVersion: '26.1.1',
    sshUser: 'root',
    sshPort: 2222,
    loadAvg: '0.24, 0.22, 0.19',
  },
];
