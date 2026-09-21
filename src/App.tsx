/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { CiCdView } from './components/views/CiCdView';
import { KubernetesView } from './components/views/KubernetesView';
import { MonitoringView } from './components/views/MonitoringView';
import { AlertsView } from './components/views/AlertsView';
import { BackupDrView } from './components/views/BackupDrView';
import { SecurityComplianceView } from './components/views/SecurityComplianceView';
import { ManifestsView } from './components/views/ManifestsView';
import { AiSreCopilotView } from './components/views/AiSreCopilotView';
import { VpsView } from './components/views/VpsView';

import {
  CloudProvider,
  PipelineRun,
  KubernetesPod,
  KubernetesNode,
  ClusterAutoscalerConfig,
  HpaConfig,
  MetricDataPoint,
  AlertRule,
  SlackAlertEvent,
  BackupSnapshot,
  VpsServer,
} from './types';

import {
  INITIAL_PIPELINE_RUN,
  INITIAL_PIPELINE_STAGES,
  INITIAL_PODS,
  INITIAL_NODES,
  INITIAL_CLUSTER_AUTOSCALER,
  INITIAL_HPA,
  INITIAL_ALERT_RULES,
  INITIAL_SLACK_EVENTS,
  INITIAL_BACKUPS,
  INITIAL_SECURITY_ITEMS,
  INITIAL_VPS_SERVERS,
} from './mock/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('evidence');
  const [currentProvider] = useState<CloudProvider>('self-hosted');
  const [pipeline, setPipeline] = useState<PipelineRun>(INITIAL_PIPELINE_RUN);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);

  // Traffic & Autoscaling (HPA & Cluster Autoscaler)
  const [trafficRps, setTrafficRps] = useState<number>(320);
  const [hpa, setHpa] = useState<HpaConfig>(INITIAL_HPA);
  const [pods, setPods] = useState<KubernetesPod[]>(INITIAL_PODS);
  const [nodes, setNodes] = useState<KubernetesNode[]>(INITIAL_NODES);
  const [clusterAutoscaler, setClusterAutoscaler] = useState<ClusterAutoscalerConfig>(INITIAL_CLUSTER_AUTOSCALER);
  const [isNodeProvisioning, setIsNodeProvisioning] = useState(false);

  // Metrics (Grafana & Prometheus)
  const [metrics, setMetrics] = useState<MetricDataPoint[]>([
    { time: '14:31:00', cpuPercent: 32, memoryMb: 340, rps: 280, latencyMs: 34, errorRatePercent: 0.05, activePods: 2 },
    { time: '14:32:00', cpuPercent: 35, memoryMb: 345, rps: 300, latencyMs: 36, errorRatePercent: 0.06, activePods: 2 },
    { time: '14:33:00', cpuPercent: 38, memoryMb: 350, rps: 310, latencyMs: 35, errorRatePercent: 0.06, activePods: 2 },
    { time: '14:34:00', cpuPercent: 44, memoryMb: 360, rps: 340, latencyMs: 40, errorRatePercent: 0.08, activePods: 2 },
    { time: '14:35:00', cpuPercent: 42, memoryMb: 358, rps: 320, latencyMs: 38, errorRatePercent: 0.07, activePods: 2 },
    { time: '14:36:00', cpuPercent: 48, memoryMb: 370, rps: 360, latencyMs: 42, errorRatePercent: 0.08, activePods: 2 },
    { time: '14:37:00', cpuPercent: 55, memoryMb: 385, rps: 420, latencyMs: 46, errorRatePercent: 0.09, activePods: 2 },
    { time: '14:38:00', cpuPercent: 45, memoryMb: 365, rps: 330, latencyMs: 37, errorRatePercent: 0.07, activePods: 2 },
    { time: '14:39:00', cpuPercent: 40, memoryMb: 355, rps: 315, latencyMs: 36, errorRatePercent: 0.06, activePods: 2 },
    { time: '14:40:00', cpuPercent: 42, memoryMb: 360, rps: 320, latencyMs: 38, errorRatePercent: 0.08, activePods: 2 },
  ]);

  // Alerts
  const [rules, setRules] = useState<AlertRule[]>(INITIAL_ALERT_RULES);
  const [slackEvents, setSlackEvents] = useState<SlackAlertEvent[]>(INITIAL_SLACK_EVENTS);

  // Backup & DR
  const [backups, setBackups] = useState<BackupSnapshot[]>(INITIAL_BACKUPS);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // VPS Servers Fleet
  const [vpsList, setVpsList] = useState<VpsServer[]>(INITIAL_VPS_SERVERS);

  // Header state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Re-calculate Pods and HPA when trafficRps changes
  useEffect(() => {
    let desiredReplicas = 2;
    if (trafficRps <= 150) desiredReplicas = 1;
    else if (trafficRps <= 600) desiredReplicas = 2;
    else if (trafficRps <= 1200) desiredReplicas = 3;
    else if (trafficRps <= 1800) desiredReplicas = 4;
    else desiredReplicas = 5;

    // Bound by HPA min/max
    desiredReplicas = Math.max(hpa.minReplicas, Math.min(desiredReplicas, hpa.maxReplicas));

    // Calculate approximate CPU and RAM per pod
    const totalCpuNeeded = trafficRps * 0.45; // in millicores
    const cpuPerPod = Math.round(totalCpuNeeded / desiredReplicas);
    const cpuPercentage = Math.round((cpuPerPod / 300) * 100);
    const memPercentage = Math.round(35 + (trafficRps / 2500) * 45);

    // Update HPA state
    setHpa((prev) => ({
      ...prev,
      currentReplicas: desiredReplicas,
      currentCpuPercentage: Math.min(cpuPercentage, 98),
      currentMemPercentage: Math.min(memPercentage, 95),
    }));

    // Dynamic Cluster Autoscaler trigger when traffic spikes
    if (desiredReplicas >= 4) {
      setNodes((prevNodes) => {
        if (prevNodes.length < 3) {
          const newNode: KubernetesNode = {
            id: 'node-3',
            name: 'worker-node-3',
            role: 'worker',
            status: 'Ready',
            instanceType: 'e2-micro / t4g.small (Free Tier)',
            zone: 'asia-east1-c',
            cpuAllocatableM: 1000,
            cpuUsedM: 280,
            memAllocatableMi: 2048,
            memUsedMi: 650,
            podCount: 2,
            maxPods: 110,
            age: 'Vừa xong',
            isAutoscaled: true,
          };
          setClusterAutoscaler((ca) => ({
            ...ca,
            currentNodes: 3,
            lastEvent: {
              type: 'scale-up',
              message: 'Lưu lượng cao (>1,200 RPS) kích hoạt Cluster Autoscaler: cấp phát worker-node-3.',
              timestamp: new Date().toLocaleTimeString('vi-VN'),
            },
          }));
          return [...prevNodes, newNode];
        }
        return prevNodes;
      });
    }

    // Update Pods array
    setPods((prev) => {
      // Keep static infra pods (prometheus, grafana, ingress)
      const infraPods = prev.filter((p) => !p.name.includes('kubeops-api'));
      const apiPods: KubernetesPod[] = [];

      for (let i = 1; i <= desiredReplicas; i++) {
        const hash = ['x8m2q', 'p4l9a', 'v2k8w', 'm9q3t', 'z5n1r'][i - 1] || `rep${i}`;
        const nodeIndex = (i % (nodes.length || 2)) + 1;
        const node = `worker-node-${nodeIndex} (ampere-a1)`;
        apiPods.push({
          id: `pod-${i}`,
          name: `kubeops-api-749bfd986-${hash}`,
          namespace: 'production',
          node,
          status: 'Running',
          ready: '1/1',
          restarts: 0,
          cpuUsageM: Math.max(cpuPerPod, 60),
          cpuLimitM: 300,
          memUsageMi: 160 + i * 8,
          memLimitMi: 384,
          uptime: '14d 6h',
          ip: `10.244.${nodeIndex}.${40 + i}`,
        });
      }

      return [...apiPods, ...infraPods];
    });

    // Check alert rule firing
    setRules((prevRules) =>
      prevRules.map((rule) => {
        if (rule.id === 'rule-cpu') {
          const isFiring = cpuPercentage > rule.threshold;
          return { ...rule, isFiring };
        }
        return rule;
      })
    );
  }, [trafficRps, hpa.minReplicas, hpa.maxReplicas, nodes.length]);

  // Periodic metrics heartbeat simulator
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const jitter = (Math.random() - 0.5) * 20;
      const currentRps = Math.max(Math.round(trafficRps + jitter), 20);
      const latency = Math.round(18 + currentRps * 0.05 + Math.random() * 8);
      const cpu = Math.min(Math.round(25 + currentRps * 0.08), 95);

      setMetrics((prev) => {
        const next = [
          ...prev.slice(1),
          {
            time: timeStr,
            cpuPercent: cpu,
            memoryMb: Math.round(340 + currentRps * 0.08),
            rps: currentRps,
            latencyMs: latency,
            errorRatePercent: 0.05 + Number((Math.random() * 0.03).toFixed(2)),
            activePods: pods.length,
          },
        ];
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [trafficRps, pods.length]);

  // Rerun pipeline simulation
  const handleRerunPipeline = useCallback((simulateFailure = false) => {
    setIsPipelineRunning(true);
    setPipeline((prev) => ({
      ...prev,
      status: 'running',
      evidenceVerified: false,
      stages: prev.stages.map((st) => ({
        ...st,
        status: 'pending',
      })),
    }));

    let currentStageIndex = 0;
    const stageIds = ['lint_check', 'unit_tests', 'security_sast', 'docker_build', 'cosign_sign', 'k8s_deploy'];

    const advanceStage = () => {
      if (currentStageIndex >= stageIds.length) {
        setIsPipelineRunning(false);
        setPipeline((prev) => ({
          ...prev,
          status: 'success',
          evidenceVerified: true,
          timestamp: 'Vừa xong',
        }));
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
        return;
      }

      const stageId = stageIds[currentStageIndex];
      const shouldFailThisStage = simulateFailure && currentStageIndex === 1;

      setPipeline((prev) => ({
        ...prev,
        stages: prev.stages.map((st, idx) => {
          if (idx === currentStageIndex) {
            return { ...st, status: 'running' };
          }
          return st;
        }),
      }));

      setTimeout(() => {
        setPipeline((prev) => ({
          ...prev,
          stages: prev.stages.map((st, idx) => {
            if (idx === currentStageIndex) {
              return {
                ...st,
                status: shouldFailThisStage ? 'failed' : 'success',
                logs: shouldFailThisStage
                  ? [...st.logs, '[FAIL] Flaky unit test simulated. Auto-healing triggered...']
                  : st.logs,
              };
            }
            return st;
          }),
        }));

        if (shouldFailThisStage) {
          setIsPipelineRunning(false);
          setPipeline((prev) => ({
            ...prev,
            status: 'failed',
            evidenceVerified: false,
          }));
        } else {
          currentStageIndex++;
          advanceStage();
        }
      }, 700);
    };

    advanceStage();
  }, []);

  // Alert Rule actions
  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleUpdateThreshold = (ruleId: string, newThreshold: number) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, threshold: newThreshold } : r))
    );
  };

  const handleSimulateAlert = (rule: AlertRule) => {
    const newEvent: SlackAlertEvent = {
      id: `evt-${Date.now()}`,
      ruleId: rule.id,
      title: `🚨 ${rule.name} Fired: Ngưỡng ${rule.threshold}${rule.unit} bị vượt quá!`,
      severity: rule.severity,
      value: `${rule.metric} đạt ${(rule.threshold * 1.15).toFixed(1)}${rule.unit}`,
      target: 'production / cluster-k8s',
      timestamp: new Date().toLocaleString('vi-VN'),
      message: `Cảnh báo phát hiện từ Prometheus Alertmanager. Hệ thống tự động đẩy thông báo sang kênh Slack #devops-alerts.`,
      status: 'firing',
    };

    setSlackEvents((prev) => [newEvent, ...prev]);
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isFiring: true, lastTriggered: 'Vừa xong' } : r))
    );
  };

  const handleAcknowledgeEvent = (eventId: string) => {
    setSlackEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: 'acknowledged' } : e))
    );
  };

  // Node Autoscaling action
  const handleTriggerNodeScaleUp = () => {
    setIsNodeProvisioning(true);
    setTimeout(() => {
      setNodes((prev) => {
        const nextId = prev.length + 1;
        const newNode: KubernetesNode = {
          id: `node-${nextId}`,
          name: `worker-node-${nextId}`,
          role: 'worker',
          status: 'Ready',
          instanceType: 'e2-micro / t4g.small (Free Tier)',
          zone: `asia-east1-${String.fromCharCode(97 + (nextId % 3))}`,
          cpuAllocatableM: 1000,
          cpuUsedM: 200,
          memAllocatableMi: 2048,
          memUsedMi: 512,
          podCount: 1,
          maxPods: 110,
          age: 'Vừa xong',
          isAutoscaled: true,
        };
        return [...prev, newNode];
      });
      setClusterAutoscaler((prev) => ({
        ...prev,
        currentNodes: prev.currentNodes + 1,
        lastEvent: {
          type: 'scale-up',
          message: `Mô phỏng khẩn cấp: Đã khởi tạo worker-node-${nodes.length + 1} thành công.`,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        },
      }));
      setIsNodeProvisioning(false);
      confetti({ particleCount: 50, spread: 60 });
    }, 1200);
  };

  // Backup Action
  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const newBackup: BackupSnapshot = {
        id: `bk-${dateStr}-${timeStr}`,
        name: `prod-manual-snapshot-${dateStr}-${timeStr}`,
        type: 'Pre-deployment Manual',
        timestamp: 'Vừa tạo lúc ' + now.toLocaleTimeString('vi-VN'),
        sizeMb: Number((650 + Math.random() * 40).toFixed(1)),
        storageTarget: 'Google Cloud Storage (GCS Standard/Nearline)',
        encryption: 'AES-GCM-256 (Cloud KMS)',
        checksumSha256: Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: 'Completed',
        retentionDays: 30,
        rpoMin: 5,
        rtoMin: 1.8,
      };

      setBackups((prev) => [newBackup, ...prev]);
      setIsCreatingBackup(false);
    }, 1800);
  };

  // VPS Server Actions
  const handleAddVps = (newVpsData: Omit<VpsServer, 'id' | 'cpuUsagePercent' | 'ramUsagePercent' | 'diskUsagePercent' | 'uptime' | 'loadAvg'>) => {
    const id = `vps-${Date.now()}`;
    const newVps: VpsServer = {
      ...newVpsData,
      id,
      cpuUsagePercent: Math.floor(15 + Math.random() * 25),
      ramUsagePercent: Math.floor(25 + Math.random() * 30),
      diskUsagePercent: Math.floor(18 + Math.random() * 20),
      uptime: '1d 02h',
      loadAvg: '0.14, 0.18, 0.12',
    };

    setVpsList((prev) => [newVps, ...prev]);

    // If attached to K8s, also provision a matching worker node in Kubernetes cluster
    if (newVps.k8sAttached) {
      const newNode: KubernetesNode = {
        id: `node-${newVps.id}`,
        name: newVps.name,
        role: 'worker',
        status: 'Ready',
        instanceType: `${newVps.provider.toUpperCase()} ${newVps.cpuCores}vCPU / ${newVps.ramGb}GB RAM`,
        zone: newVps.region,
        cpuAllocatableM: newVps.cpuCores * 1000,
        cpuUsedM: Math.round(newVps.cpuCores * 1000 * 0.25),
        memAllocatableMi: newVps.ramGb * 1024,
        memUsedMi: Math.round(newVps.ramGb * 1024 * 0.35),
        podCount: 1,
        maxPods: newVps.cpuCores * 30,
        age: '1d',
        isAutoscaled: false,
      };
      setNodes((prev) => [...prev, newNode]);
    }

    confetti({ particleCount: 40, spread: 60 });
  };

  const handleToggleK8sAttach = (vpsId: string) => {
    setVpsList((prev) =>
      prev.map((vps) => {
        if (vps.id === vpsId) {
          const nextAttached = !vps.k8sAttached;
          if (nextAttached) {
            setNodes((currNodes) => {
              if (currNodes.some((n) => n.id === `node-${vps.id}`)) return currNodes;
              return [
                ...currNodes,
                {
                  id: `node-${vps.id}`,
                  name: vps.name,
                  role: 'worker',
                  status: 'Ready',
                  instanceType: `${vps.provider.toUpperCase()} ${vps.cpuCores}vCPU`,
                  zone: vps.region,
                  cpuAllocatableM: vps.cpuCores * 1000,
                  cpuUsedM: Math.round(vps.cpuCores * 1000 * (vps.cpuUsagePercent / 100)),
                  memAllocatableMi: vps.ramGb * 1024,
                  memUsedMi: Math.round(vps.ramGb * 1024 * (vps.ramUsagePercent / 100)),
                  podCount: 1,
                  maxPods: vps.cpuCores * 30,
                  age: '1d',
                  isAutoscaled: false,
                },
              ];
            });
          } else {
            setNodes((currNodes) => currNodes.filter((n) => n.id !== `node-${vps.id}`));
          }
          return { ...vps, k8sAttached: nextAttached };
        }
        return vps;
      })
    );
  };

  const handleRebootVps = (vpsId: string) => {
    setVpsList((prev) =>
      prev.map((vps) => (vps.id === vpsId ? { ...vps, status: 'rebooting' } : vps))
    );
    setTimeout(() => {
      setVpsList((prev) =>
        prev.map((vps) =>
          vps.id === vpsId
            ? {
                ...vps,
                status: 'running',
                uptime: '0d 00h (Just Rebooted)',
                loadAvg: '0.05, 0.08, 0.04',
                cpuUsagePercent: 12,
              }
            : vps
        )
      );
    }, 2400);
  };

  const handleBulkRebootVps = (vpsIds: string[]) => {
    setVpsList((prev) =>
      prev.map((vps) => (vpsIds.includes(vps.id) ? { ...vps, status: 'rebooting' } : vps))
    );
    setTimeout(() => {
      setVpsList((prev) =>
        prev.map((vps) =>
          vpsIds.includes(vps.id)
            ? {
                ...vps,
                status: 'running',
                uptime: '0d 00h (Just Rebooted)',
                loadAvg: '0.05, 0.08, 0.04',
                cpuUsagePercent: 12,
              }
            : vps
        )
      );
    }, 2400);
  };

  const handleDeleteVps = (vpsId: string) => {
    setVpsList((prev) => prev.filter((vps) => vps.id !== vpsId));
    setNodes((prev) => prev.filter((n) => n.id !== `node-${vpsId}`));
  };

  const handleBulkDeleteVps = (vpsIds: string[]) => {
    setVpsList((prev) => prev.filter((vps) => !vpsIds.includes(vps.id)));
    setNodes((prev) => prev.filter((n) => !vpsIds.some((vpsId) => n.id === `node-${vpsId}`)));
  };

  const activeAlertCount = rules.filter((r) => r.isFiring).length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0c0f17] text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header */}
      <Header
        activeAlertCount={activeAlertCount}
        podCount={pods.length}
        onRefreshMetrics={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        evidenceVerified={pipeline.evidenceVerified}
        activeAlertCount={activeAlertCount}
        vpsCount={vpsList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'evidence' && (
          <CiCdView
            pipeline={pipeline}
            onRerunPipeline={handleRerunPipeline}
            isRunning={isPipelineRunning}
          />
        )}

        {activeTab === 'k8s' && (
          <KubernetesView
            pods={pods}
            nodes={nodes}
            hpa={hpa}
            clusterAutoscaler={clusterAutoscaler}
            trafficRps={trafficRps}
            onUpdateTrafficRps={setTrafficRps}
            onUpdateHpa={setHpa}
            onUpdateClusterAutoscaler={setClusterAutoscaler}
            onTriggerNodeScaleUp={handleTriggerNodeScaleUp}
            isNodeProvisioning={isNodeProvisioning}
            provider={currentProvider}
          />
        )}

        {activeTab === 'vps' && (
          <VpsView
            vpsList={vpsList}
            onAddVps={handleAddVps}
            onToggleK8sAttach={handleToggleK8sAttach}
            onRebootVps={handleRebootVps}
            onDeleteVps={handleDeleteVps}
            onBulkRebootVps={handleBulkRebootVps}
            onBulkDeleteVps={handleBulkDeleteVps}
          />
        )}

        {activeTab === 'monitoring' && (
          <MonitoringView
            metrics={metrics}
            trafficRps={trafficRps}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            rules={rules}
            events={slackEvents}
            onToggleRule={handleToggleRule}
            onUpdateThreshold={handleUpdateThreshold}
            onSimulateAlert={handleSimulateAlert}
            onAcknowledgeEvent={handleAcknowledgeEvent}
          />
        )}

        {activeTab === 'backup' && (
          <BackupDrView
            backups={backups}
            onCreateBackup={handleCreateBackup}
            isCreatingBackup={isCreatingBackup}
          />
        )}

        {activeTab === 'security' && (
          <SecurityComplianceView items={INITIAL_SECURITY_ITEMS} />
        )}

        {activeTab === 'manifests' && <ManifestsView />}

        {activeTab === 'sre_ai' && (
          <AiSreCopilotView
            provider={currentProvider}
            pods={pods}
            hpa={hpa}
            rules={rules}
            trafficRps={trafficRps}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 text-slate-500 text-xs py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>KubeOps Production Runtime • SRE &amp; Cloud Native Architecture</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>SLSA Level 3 Certified</span>
            <span>Prometheus &amp; Grafana 24/7</span>
            <span>AES-256 Disaster Recovery Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
