'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Search,
  X,
  TrendingUp,
  ShoppingCart,
  Package,
  Star,
  ChevronDown,
  BarChart2,
  RefreshCw,
  Pill,
  Building2,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface PharmacistRecord {
  BRANCH: string;
  USER_ID: string;
  USER_NAME: string;
  NET_SALES: number;
  CC: number;
  BASKET_VOLUME: number;
  BASKET_SIZE: number;
  PL_MIX: number;
  PROMOTED_MIXED_SALES: number;
  NE_MIX: number;
  PRIVATE_LABEL: number;
  ONLINE: number;
}

type SortKey = 'NET_SALES' | 'BASKET_SIZE' | 'PL_MIX' | 'PRIVATE_LABEL';
type SortDir = 'asc' | 'desc';

// ─── Utilities ────────────────────────────────────────────────────────────────
const parseNum = (val: unknown): number => {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(String(val).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return '٠ ر.س';
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(2)} م ر.س`;
  if (Math.abs(value) >= 1_000)
    return `${(value / 1_000).toFixed(1)} ك ر.س`;
  return `${Math.round(value)} ر.س`;
};

const formatCurrencyFull = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number): string => {
  if (!value && value !== 0) return '٠٪';
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(1)}٪`;
};

const formatNumber = (value: number): string => {
  if (!value && value !== 0) return '٠';
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(
    value
  );
};

interface PerfLevel {
  label: string;
  color: string;
  bg: string;
  ring: string;
  width: number;
  gradient: string;
}

const getPerformance = (sales: number, avg: number): PerfLevel => {
  const ratio = avg > 0 ? sales / avg : 0;
  const width = Math.min(100, (ratio / 1.5) * 100);
  if (ratio >= 1.3)
    return {
      label: 'ممتاز 🚀',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.15)',
      ring: 'rgba(16,185,129,0.4)',
      width,
      gradient: 'from-emerald-500/20 to-transparent',
    };
  if (ratio >= 1.0)
    return {
      label: 'جيد جداً ✨',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.15)',
      ring: 'rgba(59,130,246,0.4)',
      width,
      gradient: 'from-blue-500/20 to-transparent',
    };
  if (ratio >= 0.7)
    return {
      label: 'جيد 👍',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
      ring: 'rgba(245,158,11,0.4)',
      width,
      gradient: 'from-amber-500/20 to-transparent',
    };
  return {
    label: 'يحتاج تحسين ⚠️',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    ring: 'rgba(239,68,68,0.4)',
    width,
    gradient: 'from-red-500/20 to-transparent',
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 min-w-0 transition-all duration-300 bg-white/[0.03] border border-white/[0.06]"
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="scale-110" style={{ color: accent ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
        {icon}
      </div>
      <span className="text-sm md:text-base font-extrabold text-white truncate w-full text-center tracking-wide">
        {value}
      </span>
      <span
        className="text-[11px] font-bold leading-tight text-center font-mono tracking-wider"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
    </div>
  );
}

function PharmacistCard({
  record,
  avgSales,
  index,
}: {
  record: PharmacistRecord;
  avgSales: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const perf = getPerformance(record.NET_SALES, avgSales);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      layout
      className="overflow-hidden select-none transition-all duration-300 hover:scale-[1.015]"
      style={{
        borderRadius: 24,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Top indicator bar */}
      <div className={`h-[4px] w-full bg-gradient-to-r ${perf.gradient}`} style={{ backgroundColor: perf.color }} />

      <div className="p-5 md:p-6">
        {/* ── Row 1: avatar + name + sales ── */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-inner"
              style={{
                background: perf.bg,
                color: perf.color,
                border: `1px solid ${perf.ring}`,
              }}
            >
              {record.USER_NAME.charAt(0)}
            </div>

            {/* Name + branch */}
            <div className="min-w-0">
              <h3 className="font-extrabold text-base md:text-lg leading-snug text-white tracking-wide truncate">
                {record.USER_NAME}
              </h3>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <span
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  <Building2 size={12} className="text-emerald-400/80" />
                  {record.BRANCH}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-xl text-[11px] font-bold tracking-wide"
                  style={{ background: perf.bg, color: perf.color, border: `1px solid ${perf.ring}` }}
                >
                  {perf.label}
                </span>
              </div>
            </div>
          </div>

          {/* Net Sales */}
          <div className="text-left shrink-0 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-3.5 py-2">
            <p
              className="text-lg md:text-xl font-black leading-none tracking-tight"
              style={{ color: '#10b981' }}
            >
              {formatCurrency(record.NET_SALES)}
            </p>
            <p
              className="text-[10px] font-bold mt-1 text-center uppercase font-mono tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              NET SALES
            </p>
          </div>
        </div>

        {/* ── Progress Bar ── */}
        <div className="mb-4 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.03]">
          <div
            className="flex justify-between text-xs font-bold mb-1.5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span>الأداء مقارنة بالمتوسط العام</span>
            <span style={{ color: perf.color }} className="font-black">
              {avgSales > 0
                ? `${((record.NET_SALES / avgSales) * 100).toFixed(0)}٪`
                : '—'}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${perf.width}%` }}
              transition={{
                duration: 1.2,
                delay: index * 0.04 + 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                background: `linear-gradient(90deg, ${perf.color}, ${perf.color}aa)`,
              }}
            />
          </div>
        </div>

        {/* ── Stats Row 1 ── */}
        <div className="flex gap-2.5 mb-2.5">
          <StatBadge
            icon={<ShoppingCart size={15} />}
            label="BASKET SIZE"
            value={formatCurrency(record.BASKET_SIZE)}
            accent
          />
          <StatBadge
            icon={<Package size={15} />}
            label="PL_Mix"
            value={formatPercent(record.PL_MIX)}
          />
          <StatBadge
            icon={<Star size={15} />}
            label="PRIVATE LABEL"
            value={formatPercent(record.PRIVATE_LABEL)}
          />
        </div>

        {/* ── Expanded Details Grid ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded_fields"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2.5 pt-2.5 mt-2.5 border-t border-white/[0.06]">
                {[
                  { label: 'CC', value: formatNumber(record.CC) },
                  {
                    label: 'BASKET VOLUME',
                    value: formatNumber(record.BASKET_VOLUME),
                  },
                  {
                    label: 'PROMOTED MIXED SALES',
                    value: formatCurrencyFull(record.PROMOTED_MIXED_SALES),
                  },
                  { label: 'NE MIX', value: formatPercent(record.NE_MIX) },
                  {
                    label: 'ONLINE',
                    value: formatCurrencyFull(record.ONLINE),
                  },
                  { label: 'USER ID', value: record.USER_ID },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="rounded-2xl p-3.5 transition-all duration-300 hover:bg-white/[0.04]"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p
                      className="text-[11px] font-bold mb-1 font-mono tracking-wide"
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      {d.label}
                    </p>
                    <p className="text-sm font-black text-white tracking-wide">{d.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Expand/Collapse Toggle Button ── */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-center gap-1 pt-3 mt-1 transition-colors duration-200 hover:text-white"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>
      </div>
    </motion.article>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PharmacistTracker() {
  const [data, setData] = useState<PharmacistRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('NET_SALES');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSort, setShowSort] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // استخراج قائمة الصيدليات الفريدة عند تحديث البيانات لتغذية القائمة المنسدلة
  useEffect(() => {
    if (data.length > 0) {
      const uniqueBranches = Array.from(new Set(data.map((r) => r.BRANCH))).filter(Boolean);
      setBranches(uniqueBranches);
    } else {
      setBranches([]);
    }
  }, [data]);

  // ── Mount: load from localStorage & online status ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pharmacist_data_v2');
      if (stored) setData(JSON.parse(stored));
    } catch {
      /* ignore */
    }

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── File Parser ──
  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError('');
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
        defval: '',
      });

      if (!rows.length) throw new Error('الملف فارغ ولا يحتوي على بيانات');

      const parsed: PharmacistRecord[] = rows
        .map(
          (row): PharmacistRecord[] => {
            // خريطة داخلية لربط المسميات المنظفة تماماً بالقيم الأصلية للسطر الحالي
            const cleanRowMap: Record<string, unknown> = {};
            Object.keys(row).forEach((key) => {
              // إزالة الفراغات والرموز الخاصة تماماً وتحويل الحروف إلى صغيرة لضمان فحص دقيق ومطلق
              const standardKey = key.toString().replace(/[\s\_\-]/g, '').toLowerCase();
              cleanRowMap[standardKey] = row[key];
            });

            // دالة بحث صارمة تفحص مصفوفة الاحتمالات الممكنة لاسم العمود المنظف
            const getFieldVal = (aliases: string[]): unknown => {
              for (const alias of aliases) {
                const target = alias.replace(/[\s\_\-]/g, '').toLowerCase();
                if (cleanRowMap[target] !== undefined) {
                  return cleanRowMap[target];
                }
              }
              return '';
            };

            // تحديد قيم الأعمدة بناءً على أدق مصفوفات المطابقة والبدائل المحتملة
            const branchVal = String(getFieldVal(['branch', 'branchname', 'صيدلية', 'الفرع'])).trim();
            const userIdVal = String(getFieldVal(['userid', 'id', 'usercode', 'كود الموظف'])).trim();
            const userNameVal = String(getFieldVal(['username', 'name', 'pharmacistname', 'اسم الموظف'])).trim();

            const netSalesVal = parseNum(getFieldVal(['netsales', 'sales', 'net', 'المبيعات', 'صافي المبيعات']));
            const ccVal = parseNum(getFieldVal(['cc', 'customercount', 'العملاء']));
            const basketVolVal = parseNum(getFieldVal(['basketvolume', 'volume', 'basketvol']));
            const basketSizeVal = parseNum(getFieldVal(['basketsize', 'size', 'basketsiz']));
            const plMixVal = parseNum(getFieldVal(['plmix', 'pl', 'privatelabelmix']));
            const promotedVal = parseNum(getFieldVal(['promotedmixedsales', 'promotedsales', 'promotedmixed', 'promoted']));
            const neMixVal = parseNum(getFieldVal(['nemix', 'ne', 'nemixpercent']));
            const privateLabelVal = parseNum(getFieldVal(['privatelabel', 'private', 'brand']));
            const onlineVal = parseNum(getFieldVal(['online', 'onlinesales', 'اونلاين']));

            return [{
              BRANCH: branchVal,
              USER_ID: userIdVal,
              USER_NAME: userNameVal,
              NET_SALES: netSalesVal,
              CC: ccVal,
              BASKET_VOLUME: basketVolVal,
              BASKET_SIZE: basketSizeVal,
              PL_MIX: plMixVal,
              PROMOTED_MIXED_SALES: promotedVal,
              NE_MIX: neMixVal,
              PRIVATE_LABEL: privateLabelVal,
              ONLINE: onlineVal,
            }];
          }
        )
        .flat()
        .filter((r) => r.USER_NAME);

      if (!parsed.length)
        throw new Error('لم يتم العثور على أعمدة الصيادلة المطلوبة داخل الملف');

      setData(parsed);
      setSelectedBranch('ALL');
      localStorage.setItem('pharmacist_data_v2', JSON.stringify(parsed));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'فشل قراءة الملف. تأكد من مطابقة أسماء الأعمدة في ملف الإكسيل.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearData = () => {
    setData([]);
    setSearch('');
    setSelectedBranch('ALL');
    localStorage.removeItem('pharmacist_data_v2');
  };

  // ── Derived Data ──
  const avgSales = data.length
    ? data.reduce((s, r) => s + r.NET_SALES, 0) / data.length
    : 0;
  const totalSales = data.reduce((s, r) => s + r.NET_SALES, 0);

  // فلترة البحث المزدوجة بناءً على قائمة الصيدليات وحقل نص البحث
  const filtered = data
    .filter((r) => {
      // 1. تصفية بناءً على الصيدلية المختارة من القائمة
      if (selectedBranch !== 'ALL' && r.BRANCH !== selectedBranch) {
        return false;
      }
      // 2. تصفية بناءً على نص البحث (USER_NAME)
      const q = search.toLowerCase().trim();
      return !q || r.USER_NAME.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === 'desc' ? -diff : diff;
    });

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'NET_SALES', label: 'NET SALES' },
    { key: 'BASKET_SIZE', label: 'BASKET SIZE' },
    { key: 'PL_MIX', label: 'PL_Mix' },
    { key: 'PRIVATE_LABEL', label: 'PRIVATE LABEL' },
  ];

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="min-h-screen text-slate-100 antialiased"
      style={{ backgroundColor: '#05070f', fontFamily: "'Cairo', sans-serif" }}
    >
      {/* تضمين خط Cairo من خلال وسم Link خارجي لمنع أخطاء الـ Hydration الـ عشوائية */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900;1000&display=swap" rel="stylesheet" />

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b transition-all duration-300"
        style={{
          background: 'rgba(5, 7, 15, 0.75)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-3xl mx-auto px-5 pt-5 pb-4">
          {/* Top Row Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #047857)',
                  boxShadow: '0 8px 24px -6px rgba(16,185,129,0.5)',
                }}
              >
                <Pill size={20} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-black tracking-wide text-white leading-none">
                  مراقب أداء الصيادلة والفروع
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  {isOnline ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#10b981]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  )}
                  <span
                    className="text-[11px] font-bold tracking-wider"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {data.length > 0
                      ? `قاعدة البيانات: ${data.length} سجل نشط`
                      : 'في انتظار رفع الملف الرئيسي'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {data.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearData}
                  className="p-3 rounded-2xl transition-colors duration-200"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                  title="تحديث ومسح البيانات"
                >
                  <RefreshCw size={16} style={{ color: '#ef4444' }} />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black tracking-wide shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 6px 20px -4px rgba(16,185,129,0.4)',
                }}
              >
                <Upload size={14} className="stroke-[3]" />
                استيراد البيانات Excel
              </motion.button>
            </div>
          </div>

          {/* Search Bar, Branch Dropdown & Advanced Sort Toggle */}
          {data.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2.5 mt-2">
              {/* خانة اختيار اسم الصيدلية */}
              <div className="w-full md:w-1/3">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm outline-none cursor-pointer transition-all duration-200 focus:border-emerald-500/50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'white',
                  }}
                >
                  <option value="ALL" style={{ backgroundColor: '#0d111d', color: 'white' }}>اختر الصيدلية (الكل) 🏢</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch} style={{ backgroundColor: '#0d111d', color: 'white' }}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              {/* حقل البحث باسم الصيدلي */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40"
                  style={{ color: 'white' }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم USER NAME..."
                  className="w-full py-3.5 pr-11 pl-10 rounded-2xl text-sm placeholder:text-white/20 outline-none transition-all duration-200 focus:border-emerald-500/50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'white',
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 hover:opacity-100 opacity-60"
                  >
                    <X size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                )}
              </div>

              <div className="relative flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSort((p) => !p)}
                  className="p-3.5 w-full md:w-auto rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: showSort ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                    border: showSort ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <SlidersHorizontal
                    size={18}
                    style={{ color: showSort ? '#10b981' : 'rgba(255,255,255,0.7)' }}
                  />
                </motion.button>

                <AnimatePresence>
                  {showSort && (
                    <motion.div
                      initial={{ opacity: 0, y: -12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 top-14 w-52 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      style={{
                        background: '#0d111d',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 70px rgba(0,0,0,0.7)',
                      }}
                    >
                      <div className="p-2.5 space-y-1">
                        <p
                          className="text-[10px] font-black px-2.5 pb-2 pt-1 uppercase tracking-wider"
                          style={{ color: 'rgba(255,255,255,0.35)' }}
                        >
                          فرز العرض حسب:
                        </p>
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              if (sortKey === opt.key)
                                setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                              else {
                                setSortKey(opt.key);
                                setSortDir('desc');
                              }
                              setShowSort(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150"
                            style={{
                              background:
                                sortKey === opt.key
                                  ? 'rgba(16,185,129,0.15)'
                                  : 'transparent',
                              color:
                                sortKey === opt.key
                                  ? '#10b981'
                                  : 'rgba(255,255,255,0.75)',
                            }}
                          >
                            <span className="font-mono">{opt.label}</span>
                            {sortKey === opt.key && <ArrowUpDown size={12} className="stroke-[2.5]" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Layout Container ── */}
      <main className="max-w-3xl mx-auto px-5 pt-6 pb-28">
        {/* ── Empty & Upload Screen ── */}
        {data.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Welcome Hero */}
            <div className="text-center py-12 md:py-16">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-[32px] mx-auto mb-6 flex items-center justify-center shadow-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.03))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 50px rgba(16,185,129,0.15)',
                }}
              >
                <BarChart2 size={48} style={{ color: '#10b981' }} />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-white tracking-wide">لوحة أداء الصيادلة الذكية</h2>
              <p
                className="text-sm md:text-base leading-relaxed max-w-md mx-auto"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                قم بتحميل ملف تقرير أداء الصيدليات بصيغة Excel لعرض المعلومات الفورية، والبحث بالصيدلي والفرع بدقة متناهية.
              </p>
            </div>

            {/* Upload Zone */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[28px] p-10 text-center cursor-pointer mb-6 transition-all duration-300 shadow-xl"
              style={{
                background: isDragging
                  ? 'rgba(16,185,129,0.1)'
                  : 'rgba(255,255,255,0.02)',
                border: `2px dashed ${
                  isDragging ? '#10b981' : 'rgba(255,255,255,0.12)'
                }`,
                boxShadow: isDragging ? '0 0 30px rgba(16,185,129,0.1)' : 'none',
              }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.9,
                      ease: 'linear',
                    }}
                  >
                    <RefreshCw size={36} style={{ color: '#10b981' }} />
                  </motion.div>
                  <p
                    className="text-base font-bold tracking-wide animate-pulse"
                    style={{ color: '#10b981' }}
                  >
                    جاري قراءة وتحليل بيانات ملف الإكسيل...
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    <Upload size={28} style={{ color: '#10b981' }} />
                  </div>
                  <p className="text-base font-black text-white mb-1.5">اسحب وأفلت مستند الـ Excel هنا</p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    أو انقر لتصفح وتحميل ملفاتك (يدعم XLS, XLSX, CSV)
                  </p>
                </>
              )}
            </motion.div>

            {/* Error Notification Block */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#f87171',
                  }}
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <Search size={22} />,
                  title: 'فلترة واختيار الفروع',
                  desc: 'قائمة منسدلة مخصصة تتيح لك عزل صيدلية معينة واستعراض أرقامها بسهولة.',
                },
                {
                  icon: <Building2 size={22} />,
                  title: 'مطابقة تامة للمسميات',
                  desc: 'تظهر الحقول بنفس مصطلحات ومسميات ملف الـ Excel الأصلي الإنجليزية.',
                },
                {
                  icon: <TrendingUp size={22} />,
                  title: 'تحليل مقارن للمبيعات',
                  desc: 'حساب النسبة المئوية لكفاءة مبيعات الموظف قياساً بمتوسط الشبكة العامة.',
                },
                {
                  icon: <Users size={22} />,
                  title: 'خصوصية تامة للبيانات',
                  desc: 'تتم المعالجة والعرض محلياً داخل جهازك دون إرسال البيانات لأي خوادم خارجية.',
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                  className="rounded-2xl p-4 transition-all duration-300 bg-white/[0.01] hover:bg-white/[0.03]"
                  style={{
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="mb-2.5" style={{ color: '#10b981' }}>
                    {f.icon}
                  </div>
                  <p className="text-xs font-black text-white mb-1">{f.title}</p>
                  <p
                    className="text-[11px] leading-relaxed font-medium"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Dashboard Loaded View ── */}
        {data.length > 0 && (
          <>
            {/* Top Level Summary Core Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4 mb-5"
            >
              <div
                className="rounded-[24px] p-5 relative overflow-hidden group shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02))',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                <p
                  className="text-xs font-bold mb-1.5 font-mono tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  TOTAL SALES
                </p>
                <p
                  className="text-xl md:text-2xl font-black tracking-wide"
                  style={{ color: '#10b981' }}
                >
                  {formatCurrencyFull(totalSales)}
                </p>
                <div className="absolute left-4 bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp size={40} className="text-emerald-400" />
                </div>
              </div>

              <div
                className="rounded-[24px] p-5 relative overflow-hidden group shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.02))',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <p
                  className="text-xs font-bold mb-1.5 font-mono tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  AVERAGE SALES
                </p>
                <p
                  className="text-xl md:text-2xl font-black tracking-wide"
                  style={{ color: '#3b82f6' }}
                >
                  {formatCurrencyFull(avgSales)}
                </p>
                <div className="absolute left-4 bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                  <BarChart2 size={40} className="text-blue-400" />
                </div>
              </div>
            </motion.div>

            {/* Results Filter Header Badge */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold mb-4 text-center bg-white/[0.03] w-max mx-auto px-4 py-1.5 rounded-full border border-white/[0.05]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              المعروض حالياً: {filtered.length} سجل من أصل {data.length} سجل متاح
            </motion.p>

            {/* Cards List Stack */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((record, i) => (
                  <PharmacistCard
                    key={record.USER_ID + record.USER_NAME + record.BRANCH}
                    record={record}
                    avgSales={avgSales}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Zero Search Results View */}
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <Search
                  size={42}
                  className="mx-auto mb-4 opacity-20"
                  style={{ color: 'white' }}
                />
                <p className="font-extrabold text-base text-white mb-1">لا توجد سجلات مطابقة للبحث</p>
                <p
                  className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  تأكد من كتابة اسم USER NAME بشكل صحيح أو تغيير الصيدلية المختارة.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Hidden File inputs handler */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}