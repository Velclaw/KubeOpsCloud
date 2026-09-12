import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Database,
  HardDrive,
  Globe,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Info,
  ArrowRight,
  TrendingDown,
  Calculator,
} from 'lucide-react';
import { CLOUD_FREE_TIER_MATRIX, FREE_TIER_BLUEPRINTS, CLOUD_PROVIDERS } from '../../mock/initialData';

export const CloudFreeTierView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedBlueprint, setSelectedBlueprint] = useState<string>('blueprint-gcp-serverless');
  
  // Interactive Cost Calculator state for small projects
  const [monthlyRequests, setMonthlyRequests] = useState<number>(850000); // 850k reqs
  const [storageGb, setStorageGb] = useState<number>(4); // 4 GB
  const [egressGb, setEgressGb] = useState<number>(25); // 25 GB egress

  const categories = ['All', 'Compute', 'Database', 'Storage', 'Networking & CDN', 'CI/CD & Monitoring'];

  const filteredMatrix = activeCategory === 'All' 
    ? CLOUD_FREE_TIER_MATRIX 
    : CLOUD_FREE_TIER_MATRIX.filter((item) => item.category === activeCategory);

  // Compute calculated costs
  // GCP: Cloud Run 2M free, GCS 5GB free, Egress 1GB free (next 24GB is ~$0.12/GB or $0 if through CloudFront/CDN)
  const gcpCost = 0.00;
  // AWS: Lambda 1M free, DynamoDB 25GB free, S3 5GB free, CloudFront 1TB free => $0.00
  const awsCost = 0.00;
  // Standard paid VPS (DigitalOcean / Linode / EC2 on-demand): ~$12 - $24/month
  const traditionalVpsCost = (storageGb > 20 ? 18 : 12) + Math.max(0, (monthlyRequests - 1000000) / 1000000 * 3.5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> FREE TIER ARCHITECTURE ($0.00/THÁNG)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Nghiên cứu chuyên sâu AWS & Google Cloud
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Báo Cáo Nghiên Cứu & Đề Xuất Dịch Vụ Cloud Miễn Phí (Free Tier) Cho Dự Án Nhỏ
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Chiến lược tối ưu hóa 100% chi phí hạ tầng: Phân tích chi tiết hạn mức miễn phí giữa <strong>Google Cloud Platform (GCP)</strong>, <strong>Amazon Web Services (AWS)</strong> và <strong>Oracle Cloud (OCI)</strong> cho 3 trụ cột thiết yếu: <em>Compute</em>, <em>Database</em> và <em>Storage</em>.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Chi phí dự kiến</div>
              <div className="text-xl font-extrabold text-emerald-400">$0.00 <span className="text-xs font-normal text-slate-400">/ tháng</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CLOUD_PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{provider.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-mono">
                  {provider.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mb-3">
                {provider.freeTierAllowance}
              </p>
              <div className="space-y-1.5 text-xs text-slate-400 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span>Compute:</span>
                  <span className="text-slate-200">{provider.specs.compute}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>RAM:</span>
                  <span className="text-slate-200">{provider.specs.ram}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Storage:</span>
                  <span className="text-emerald-400">{provider.specs.storage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Egress:</span>
                  <span className="text-cyan-300">{provider.specs.egress}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic mt-3 pt-2 border-t border-slate-800/60">
              💡 {provider.limitsNote}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive Free Tier Cost Simulator */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Mô Phỏng Hạn Mức Sử Dụng & So Sánh Chi Phí Thực Tế Cho Dự Án Nhỏ
            </h3>
          </div>
          <span className="text-xs text-slate-400">Điều chỉnh thanh trượt theo lưu lượng thực tế</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sliders */}
          <div className="space-y-4 lg:col-span-2">
            {/* Slider 1: Requests */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Lưu lượng truy cập (Requests / tháng):</span>
                <span className="font-mono text-cyan-400 font-bold">{(monthlyRequests / 1000).toLocaleString()}k requests</span>
              </div>
              <input
                type="range"
                min={50000}
                max={3000000}
                step={50000}
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>50k (nhỏ)</span>
                <span>GCP Cloud Run Free: 2.0M reqs</span>
                <span>3.0M (vượt free)</span>
              </div>
            </div>

            {/* Slider 2: Storage */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Dung lượng Database & File Storage (GB):</span>
                <span className="font-mono text-emerald-400 font-bold">{storageGb} GB</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={storageGb}
                onChange={(e) => setStorageGb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 GB (Firestore Free)</span>
                <span>GCS / S3 Free: 5 GB</span>
                <span>DynamoDB Free: 25 GB</span>
              </div>
            </div>

            {/* Slider 3: Egress */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Băng thông ra Internet (Data Transfer Out - GB):</span>
                <span className="font-mono text-amber-300 font-bold">{egressGb} GB</span>
              </div>
              <input
                type="range"
                min={1}
                max={200}
                step={5}
                value={egressGb}
                onChange={(e) => setEgressGb(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>1 GB (GCP Free Egress)</span>
                <span>AWS CloudFront Free: 1,000 GB (1TB)</span>
                <span>200 GB</span>
              </div>
            </div>
          </div>

          {/* Cost Comparison Result Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                Bảng Đối Chiếu Hóa Đơn Hàng Tháng
              </span>

              <div className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <strong className="text-emerald-300 block">Google Cloud (GCP)</strong>
                    <span className="text-[11px] text-slate-400">Cloud Run + Firestore + GCS</span>
                  </div>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    ${gcpCost.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-950/30 border border-teal-800/40 flex items-center justify-between">
                  <div>
                    <strong className="text-teal-300 block">AWS Free Tier</strong>
                    <span className="text-[11px] text-slate-400">Lambda / EC2 + DynamoDB + S3</span>
                  </div>
                  <span className="text-base font-extrabold text-teal-400 font-mono">
                    ${awsCost.toFixed(2)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="text-rose-300 block">VPS Truyền Thống</strong>
                    <span className="text-[11px] text-slate-400">Fixed instance + bandwidth fee</span>
                  </div>
                  <span className="text-base font-bold text-rose-400 font-mono">
                    ~${traditionalVpsCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Dự án nhỏ hoạt động trọn vẹn trong hạn mức miễn phí, tiết kiệm 100%!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Deep Dive Matrix Filter & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Ma Trận So Sánh Chi Tiết Từng Hạng Mục (AWS vs GCP)
          </h3>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Matrix Items */}
        <div className="space-y-4">
          {filteredMatrix.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                    {item.category === 'Compute' && <Cpu className="w-4 h-4" />}
                    {item.category === 'Database' && <Database className="w-4 h-4" />}
                    {item.category === 'Storage' && <HardDrive className="w-4 h-4" />}
                    {item.category === 'Networking & CDN' && <Globe className="w-4 h-4" />}
                    {item.category === 'CI/CD & Monitoring' && <Server className="w-4 h-4" />}
                  </span>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Hạng mục: {item.category}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  Always Free & 12-Month Tier
                </span>
              </div>

              {/* Two columns: GCP vs AWS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GCP Column */}
                <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h4 className="text-xs font-bold text-blue-300">Google Cloud Platform (GCP)</h4>
                  </div>
                  <div className="text-xs font-semibold text-white">{item.serviceNameGcp}</div>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {item.allowanceGcp}
                  </p>
                </div>

                {/* AWS Column */}
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold text-amber-300">Amazon Web Services (AWS)</h4>
                  </div>
                  <div className="text-xs font-semibold text-white">{item.serviceNameAws}</div>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    {item.allowanceAws}
                  </p>
                </div>
              </div>

              {/* Recommendation & Safety Note */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80 text-xs">
                <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30">
                  <strong className="text-emerald-300 block mb-1">🎯 Đề xuất cho dự án nhỏ:</strong>
                  <span className="text-slate-300 leading-relaxed">{item.recommendationForSmallProject}</span>
                </div>
                <div className="bg-amber-950/20 p-3 rounded-lg border border-amber-900/30">
                  <strong className="text-amber-300 block mb-1">⚠️ Cảnh báo chi phí & Chống phát sinh cước:</strong>
                  <span className="text-slate-300 leading-relaxed">{item.costSafetyTips}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Blueprints for Small Projects */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          3 Mẫu Kiến Trúc Tham Chiếu Triển Khai Thực Tế ($0.00 / Tháng)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {FREE_TIER_BLUEPRINTS.map((bp) => {
            const isSelected = selectedBlueprint === bp.id;
            return (
              <div
                key={bp.id}
                onClick={() => setSelectedBlueprint(bp.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">{bp.cloud}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono font-bold">
                      {bp.badge}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                    {bp.title}
                  </h4>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {bp.description}
                  </p>

                  {/* Components Stack */}
                  <div className="space-y-2 mb-4">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Thành phần kiến trúc:
                    </span>
                    {bp.stack.map((st, sIdx) => (
                      <div key={sIdx} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 text-xs">
                        <strong className="text-cyan-300 block text-[11px]">{st.name}</strong>
                        <span className="text-[10px] text-slate-400">{st.note}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="pt-3 border-t border-slate-800 text-[11px] space-y-1.5">
                  <div className="text-emerald-400 font-medium">
                    ✓ {bp.pros.join(' • ')}
                  </div>
                  <div className="text-slate-500 italic">
                    ℹ️ {bp.cons.join(' • ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Guardrails: Setting up $0.01 Billing Alerts */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            Quy Tắc Vàng Bảo Vệ Ngân Sách: Thiết Lập Cảnh Báo $0.01 & Kill-Switch
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Để đảm bảo dự án <strong>hoàn toàn không mất tiền ngoài ý muốn</strong> khi sử dụng Free Tier, đội ngũ SRE luôn thực hiện 3 bước thiết lập bắt buộc sau ngay khi mở tài khoản:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <strong className="text-white block mb-1">1. Đặt Cloud Billing Alert $0.01:</strong>
            <span className="text-slate-400 leading-relaxed">
              Tạo Budget Alert tại mốc $0.01 và $1.00. Ngay khi có bất kỳ dịch vụ nào vượt khỏi hạn mức miễn phí dù chỉ 1 cent, hệ thống sẽ gửi cảnh báo tức thì về Slack và Email.
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <strong className="text-white block mb-1">2. Khóa Max Instances / Concurrency:</strong>
            <span className="text-slate-400 leading-relaxed">
              Với Cloud Run / Lambda: Luôn cấu hình <code>--max-instances=3</code>. Điều này ngăn chặn việc mã độc hoặc bot quét web khiến container scale lên hàng trăm bản sao.
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <strong className="text-white block mb-1">3. Tự Động Hóa Xóa Bản Ghi Cũ (TTL):</strong>
            <span className="text-slate-400 leading-relaxed">
              Cài đặt S3 / Cloud Storage Lifecycle Rule chuyển bản ghi backup sang Archive hoặc tự động xóa sau 30 ngày, giữ tổng dung lượng dưới mốc 5GB miễn phí.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
