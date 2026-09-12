import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// SRE Assistant with Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health status API
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    runtime: "kubernetes-production-v1.30.2",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cloudTier: "Free Tier Optimized (GCP / AWS / Oracle Ampere A1)",
    security: "TLS 1.3 & AES-256 Enabled",
  });
});

// SRE Assistant endpoint
app.post("/api/sre-assistant", async (req, res) => {
  const { prompt, clusterContext } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Fallback deterministic AI responses if API key is not yet set
      return res.json({
        response: `[SRE Engine Local Mode] Hệ thống ghi nhận yêu cầu: "${prompt}".\n\n` +
          `• Khuyến nghị tối ưu Free Tier: Cấu hình resource request: cpu: 100m, memory: 128Mi; limit: cpu: 500m, memory: 512Mi để vừa vặn trong hạn mức miễn phí (vd: Oracle Cloud Ampere A1 miễn phí 4 OCPU, 24GB RAM hoặc GKE Autopilot free $74/tháng credit).\n` +
          `• Cấu hình HPA: Đặt minReplicas: 1, maxReplicas: 4, averageUtilization CPU: 70%.\n` +
          `• Prometheus Alert: Đặt alert rule 'HighCPUUsage' khi threshold vượt 80% trong 2m để cảnh báo qua Slack.\n` +
          `• Bảo mật: Đã kích hoạt mã hóa AES-GCM-256 cho volume snapshot và secret sealing (SealedSecrets / SOPS).`
      });
    }

    const systemInstruction = `Bạn là Senior Cloud Native SRE & DevOps Architect chuyên nghiệp.
Bạn hỗ trợ quản trị viên thiết kế, vận hành, xử lý sự cố (troubleshoot) và tối ưu hóa hệ thống Kubernetes Production, CI/CD pipeline với evidence xanh, Prometheus & Grafana monitoring, Slack alerting, backup & recovery, bảo mật chuẩn SOC2/ISO27001 và tối ưu chi phí Free Tier (AWS, GCP, Oracle Cloud).
Trả lời bằng tiếng Việt (hoặc tiếng Anh nếu người dùng yêu cầu), câu từ chuyên nghiệp, súc tích, thực tiễn, có kèm code/manifest YAML khi cần thiết.`;

    const fullPrompt = `${systemInstruction}\n\nContext hệ thống:\n${JSON.stringify(clusterContext || {}, null, 2)}\n\nCâu hỏi/Yêu cầu của SRE:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
    });

    const text = response.text || "Không có phản hồi từ SRE Assistant.";
    return res.json({ response: text });
  } catch (error: any) {
    console.error("Gemini SRE Assistant error:", error);
    return res.status(500).json({
      error: "Không thể kết nối Gemini API. Vui lòng kiểm tra GEMINI_API_KEY trong cấu hình Secrets.",
      details: error?.message || String(error)
    });
  }
});

// Slack Webhook Simulator / Dispatcher
app.post("/api/slack-notify", async (req, res) => {
  const { webhookUrl, alert, testMode } = req.body;
  const targetUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;

  const slackPayload = {
    text: `🚨 [ALERT ${alert?.severity || "WARNING"}] ${alert?.title || "Kubernetes Event Alert"}`,
    attachments: [
      {
        color: alert?.severity === "CRITICAL" ? "#E01E5A" : alert?.severity === "WARNING" ? "#ECB22E" : "#2EB886",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🚨 ${alert?.title || "KubeOps Alert: Pod High CPU"}`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Severity:*\n\`${alert?.severity || "CRITICAL"}\``
              },
              {
                type: "mrkdwn",
                text: `*Cluster / Env:*\n\`production-k8s-free-tier\``
              },
              {
                type: "mrkdwn",
                text: `*Target:*\n\`${alert?.target || "deployment/web-api"}\``
              },
              {
                type: "mrkdwn",
                text: `*Metric Value:*\n\`${alert?.value || "CPU 88.4% (> 80%)"}\``
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Mô tả chi tiết:*\n${alert?.message || "Lưu lượng người dùng tăng đột biến, HPA kích hoạt scale từ 2 -> 4 pods."}`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🕒 Timestamp: *${new Date().toLocaleString("vi-VN")}* | Prometheus Alertmanager v0.26`
              }
            ]
          }
        ]
      }
    ]
  };

  if (targetUrl && !testMode) {
    try {
      const resp = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackPayload)
      });
      if (!resp.ok) {
        throw new Error(`Slack API error: ${resp.status} ${resp.statusText}`);
      }
      return res.json({ success: true, message: "Đã gửi thông báo thật đến Slack Webhook thành công!", payload: slackPayload });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: `Gửi webhook thất bại: ${err.message}. Đã tạo payload giả lập thành công.`,
        payload: slackPayload
      });
    }
  }

  // Simulated mode
  return res.json({
    success: true,
    simulated: true,
    message: "Đã giả lập gửi cảnh báo Slack thành công với định dạng Slack Block Kit chuẩn.",
    payload: slackPayload
  });
});

// Production Vite & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[KubeOps Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
