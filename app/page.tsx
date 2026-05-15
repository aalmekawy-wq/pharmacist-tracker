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
interface DynamicRecord {
  _BRANCH_KEY: string;
  _USER_NAME_KEY: string;
  _MAIN_VALUE_KEY: string;
  [key: string]: any; // نقل وحفظ كافة القيم كما هي من الإكسيل لتكون متغيرة بالكامل حسب الملف المرفوع
}

type SortKey = string; 
type SortDir = 'asc' | 'desc';

// ─── Utilities ────────────────────────────────────────────────────────────────
const parseNum = (val: unknown): number => {
  if (val === null || val === undefined || val === '') return 0;
  const cleanStr = String(val).replace(/,/g, '').trim();
  const n = Number(cleanStr);
  if (!isNaN(n)) return n;
  
  // نظام حماية متطور لتحليل الأرقام المنسقة والنسب المئوية التراكمية
  const fallbackNum = parseFloat(cleanStr.replace(/[^0-9.-]/g, ''));
  if (cleanStr.includes('%')) return isNaN(fallbackNum) ? 0 : fallbackNum / 100;
  return isNaN(fallbackNum) ? 0 : fallbackNum;
};

const formatDynamicValue = (value: unknown, keyName: string): string => {
  if (value === null || value === undefined || value === '') return '—';
  
  // إذا كانت القيمة رقمية، يتم تنسيقها ذكياً بناءً على اسم العمود
  if (typeof value === 'number' || !isNaN(Number(String(value).replace(/,/g, '')))) {
    const num = parseNum(value);
    const lowerKey = keyName.toLowerCase();
    
    if (lowerKey.includes('mix') || lowerKey.includes('%') || lowerKey.includes('نسبة') || (num > 0 && num <= 1 && (lowerKey.includes('label') || lowerKey.includes('brand')))) {
      const pct = num > 1 ? num : num * 100;
      return `${pct.toFixed(1)}٪`;
    }
    
    if (lowerKey.includes('sale') || lowerKey.includes('net') || lowerKey.includes('مبيعات') || lowerKey.includes('قيمة') || lowerKey.includes('total') || lowerKey.includes('price') || lowerKey.includes('online')) {
      if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} م ر.س`;
      if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)} ك ر.س`;
      return `${Math.round(num)} ر.س`;
    }
    
    return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(num);
  }
  
  return String(value);
};

const formatCurrencyFull = (value: number): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface PerfLevel {
  label: string;
  color: string;
  bg: string;
  ring: string;
  width: number;
  gradient: string;
}

const getPerformance = (value: number, avg: number): PerfLevel => {
  const ratio = avg > 0 ? value / avg : 0;
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
        className="text-[11px] font-bold leading-tight text-center font-mono tracking-wider truncate w-full px-1"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
    </div>
  );
}

function PharmacistCard({
  record,
  avgValue,
  index,
  headers,
}: {
  record: DynamicRecord;
  avgValue: number;
  index: number;
  headers: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  
  const branchKey = record._BRANCH_KEY;
  const nameKey = record._USER_NAME_KEY;
  const mainValueKey = record._MAIN_VALUE_KEY;

  const currentMainVal = parseNum(record[mainValueKey]);
  const perf = getPerformance(currentMainVal, avgValue);

  // استخراج أول 3 أعمدة رقمية تظهر بعد حقول التعريف لعرضها كشارات كروت رئيسية متغيرة تماماً حسب الإكسيل
  const excludedKeys = [branchKey, nameKey, mainValueKey, '_BRANCH_KEY', '_USER_NAME_KEY', '_MAIN_VALUE_KEY'];
  const badgeKeys = headers.filter(h => !excludedKeys.includes(h)).slice(0, 3);

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
        {/* ── Row 1: avatar + dynamic name + dynamic primary value ── */}
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
              {record[nameKey] ? String(record[nameKey]).charAt(0) : '?'}
            </div>

            {/* Name + branch derived from first row */}
            <div className="min-w-0">
              <h3 className="font-extrabold text-base md:text-lg leading-snug text-white tracking-wide truncate">
                {String(record[nameKey] || 'غير معروف')}
              </h3>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  <Building2 size={12} className="text-emerald-400/80 shrink-0" />
                  <span className="truncate max-w-[120px]">{String(record[branchKey] || 'الكل')}</span>
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-xl text-[11px] font-bold tracking-wide shrink-0"
                  style={{ background: perf.bg, color: perf.color, border: `1px solid ${perf.ring}` }}
                >
                  {perf.label}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Numeric Display Key (تتغير مسمياتها وقيمها حسب الإكسيل) */}
          <div className="text-left shrink-0 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-3.5 py-2 max-w-[150px]">
            <p
              className="text-lg md:text-xl font-black leading-none tracking-tight text-emerald-400 truncate"
              style={{ color: '#10b981' }}
            >
              {formatDynamicValue(record[mainValueKey], mainValueKey)}
            </p>
            <p
              className="text-[9px] font-bold mt-1 text-center uppercase font-mono tracking-wider truncate"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              title={mainValueKey}
            >
              {mainValueKey}
            </p>
          </div>
        </div>

        {/* ── Dynamic Progress Bar ── */}
        <div className="mb-4 bg-white/[0.01] p-2.5 rounded-xl border border-white/[0.03]">
          <div
            className="flex justify-between text-xs font-bold mb-1.5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span>الكفاءة مقارنة بالمتوسط العام</span>
            <span style={{ color: perf.color }} className="font-black">
              {avgValue > 0
                ? `${((currentMainVal / avgValue) * 100).toFixed(0)}٪`
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

        {/* ── Dynamic Badges Row (مستمدة من الصف الأول وتتغير كلياً حسب المرفوع) ── */}
        <div className="flex gap-2.5 mb-2.5">
          {badgeKeys.map((key, i) => (
            <StatBadge
              key={key}
              icon={i === 0 ? <ShoppingCart size={15} /> : i === 1 ? <Package size={15} /> : <Star size={15} />}
              label={key}
              value={formatDynamicValue(record[key], key)}
              accent={i === 0}
            />
          ))}
          {badgeKeys.length === 0 && (
            <div className="text-center w-full text-xs text-white/20 py-2">يتم سحب وتوليد المؤشرات من ملفك مباشرة</div>
          )}
        </div>

        {/* ── Expanded All Fields Grid ── */}
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
                {/* طباعة ونقل جميع قيم الصف الأول بلا استثناء كما هي متغيرة */}
                {headers
                  .filter(h => !['_BRANCH_KEY', '_USER_NAME_KEY', '_MAIN_VALUE_KEY'].includes(h))
                  .map((h) => (
                    <div
                      key={h}
                      className="rounded-2xl p-3.5 transition-all duration-300 hover:bg-white/[0.04]"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <p
                        className="text-[11px] font-bold mb-1 font-mono tracking-wide text-white/40 truncate w-full"
                        title={h}
                      >
                        {h}
                      </p>
                      <p className="text-sm font-black text-white tracking-wide truncate">
                        {formatDynamicValue(record[h], h)}
                      </p>
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
  const [data, setData] = useState<DynamicRecord[]>([]);
  const [headers, setHeaders] = useState<string[]>([]); // لحفظ أسماء حقول الصف الأول المستخرجة كلياً
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSort, setShowSort] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const [branchHeaderKey, setBranchHeaderKey] = useState('');
  const [nameHeaderKey, setNameHeaderKey] = useState('');
  const [valueHeaderKey, setValueHeaderKey] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // استخراج قائمة الاختيارات الديناميكية للفروع وتحديث مفاتيح الصف الأول الفعلي المرفوع
  useEffect(() => {
    if (data.length > 0) {
      const bKey = data[0]._BRANCH_KEY;
      const uniqueBranches = Array.from(new Set(data.map((r) => String(r[bKey] || '')))).filter(Boolean);
      setBranches(uniqueBranches);
      
      const allKeys = Object.keys(data[0]);
      setHeaders(allKeys);
      
      setBranchHeaderKey(data[0]._BRANCH_KEY);
      setNameHeaderKey(data[0]._USER_NAME_KEY);
      setValueHeaderKey(data[0]._MAIN_VALUE_KEY);
      
      if (!sortKey) {
        setSortKey(data[0]._MAIN_VALUE_KEY);
      }
    } else {
      setBranches([]);
      setHeaders([]);
      setSortKey('');
    }
  }, [data, sortKey]);

  // ── Mount: load from localStorage & setup online status ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dynamic_pharmacy_dashboard_v4');
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

  // ── Dynamic File Parser ──
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
        raw: false, 
      });

      if (!rows.length) throw new Error('الملف فارغ ولا يحتوي على أي صفوف أو بيانات');

      // 1. استخراج أسماء الصف الأول الخام (Headers) من الإكسيل مباشرة ليكون كل شيء متغير
      const rawHeaders = Object.keys(rows[0]);

      // 2. البحث الذكي المرن عن الحقول التشغيلية مع وضع بدائل آلية تامة لأول مسميات في حال الاختلاف المطلق
      const findBestKey = (aliases: string[], fallbackIndex: number): string => {
        const found = rawHeaders.find(h => {
          const norm = h.toString().replace(/[\s\_\-]/g, '').toLowerCase();
          return aliases.some(a => norm.includes(a) || a.includes(norm));
        });
        return found || rawHeaders[fallbackIndex] || rawHeaders[0];
      };

      const detectedBranchKey = findBestKey(['branch', 'صيدلية', 'الفرع', 'اسم الصيدلية', 'pharmacy', 'branchname'], 0);
      const detectedNameKey = findBestKey(['name', 'username', 'اسم', 'صيدلي', 'الموظف', 'employee', 'pharmacist'], 1);
      const detectedValueKey = findBestKey(['netsales', 'sales', 'net', 'المبيعات', 'صافي', 'قيمة', 'total', 'الصافي', 'الحصيلة'], 2);

      // 3. بناء ونقل مصفوفة السجلات التراكمية متغيرة بالكامل ومطابقة للملف 100%
      const parsed: DynamicRecord[] = rows.map((row): DynamicRecord => {
        const recordObj: DynamicRecord = {
          _BRANCH_KEY: detectedBranchKey,
          _USER_NAME_KEY: detectedNameKey,
          _MAIN_VALUE_KEY: detectedValueKey,
        };

        // نقل ونقل كافة القيم من الصف الأول للإكسيل كما هي وبنفس مسمياتها دون تعديل بنية المفتاح
        rawHeaders.forEach((h) => {
          const rawVal = row[h];
          // فحص وحفظ البيانات الرقمية لضمان عمل الفرز الرياضي التلقائي بشكل سليم
          if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            const cleanStr = String(rawVal).replace(/,/g, '').trim();
            if (cleanStr !== '' && !isNaN(Number(cleanStr)) && h !== detectedBranchKey && h !== detectedNameKey) {
              recordObj[h] = parseNum(rawVal);
            } else {
              recordObj[h] = rawVal;
            }
          } else {
            recordObj[h] = '';
          }
        });

        return recordObj;
      }).filter(r => r[detectedNameKey]);

      if (!parsed.length)
        throw new Error('فشل استيراد الصفوف؛ يرجى التحقق من احتواء الملف على صف هيدر ممتلئ');

      setSortKey(detectedValueKey);
      setData(parsed);
      setSelectedBranch('ALL');
      localStorage.setItem('dynamic_pharmacy_dashboard_v4', JSON.stringify(parsed));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'فشل قراءة ملف الإكسيل. تأكد أن الصف الأول يحتوي على مسميات الأعمدة بشكل سليم.'
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
    setSortKey('');
    localStorage.removeItem('dynamic_pharmacy_dashboard_v4');
  };

  // ── Derived Dynamic Calculations ──
  const totalSales = data.length && valueHeaderKey
    ? data.reduce((s, r) => s + parseNum(r[valueHeaderKey]), 0)
    : 0;
  const avgSales = data.length ? totalSales / data.length : 0;

  // فلاتر البحث والفرز التفاعلية المطلقة لكل الحقول المتغيرة
  const filtered = data
    .filter((r) => {
      if (selectedBranch !== 'ALL' && branchHeaderKey && String(r[branchHeaderKey]) !== selectedBranch) {
        return false;
      }
      const q = search.toLowerCase().trim();
      if (!q) return true;
      
      // بحث شامل ومرن في كافة قيم وأعمدة السطر المرفوع من الإكسيل
      return Object.values(r).some(val => String(val).toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const activeKey = sortKey || valueHeaderKey;
      if (!activeKey) return 0;
      
      const scoreA = typeof a[activeKey] === 'number' ? a[activeKey] : (parseFloat(String(a[activeKey]).replace(/[^0-9.-]/g, '')) || 0);
      const scoreB = typeof b[activeKey] === 'number' ? b[activeKey] : (parseFloat(String(b[activeKey]).replace(/[^0-9.-]/g, '')) || 0);
      return sortDir === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });

  // بناء قائمة خيارات الفرز (Sort Dropdown) ديناميكياً من الصف الأول المستخرج
  const sortOptions = headers.filter(h => !['_BRANCH_KEY', '_USER_NAME_KEY', '_MAIN_VALUE_KEY', branchHeaderKey, nameHeaderKey].includes(h));

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="min-h-screen text-slate-100 antialiased"
      style={{ backgroundColor: '#05070f', fontFamily: "'Cairo', sans-serif" }}
    >
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
                  مراقب الأداء الفوري الشامل
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
                      ? `قاعدة البيانات متغيره: ${data.length} سجل نشط بالكامل`
                      : 'في انتظار استمداد البيانات من الإكسيل'}
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
                  title="مسح وتحديث لرفع ملف جديد"
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

          {/* Search Bar & Advanced Sort Toggle */}
          {data.length > 0 && (
            <div className="flex flex-col md:flex-row gap-2.5 mt-2">
              <div className="w-full md:w-1/3">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full py-3.5 px-4 rounded-2xl text-sm outline-none cursor-pointer transition-all duration-200 focus:border-emerald-500/50 truncate"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'white',
                  }}
                >
                  <option value="ALL" style={{ backgroundColor: '#0d111d', color: 'white' }}>فلترة الفرع (الكل) 🏢</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch} style={{ backgroundColor: '#0d111d', color: 'white' }}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="ابحث بأي اسم أو رقم أو قيمة مستخرجة..."
                  className="w-full py-3.5 pr-11 pl-10 rounded-2xl text-sm placeholder:text-white/20 outline-none transition-all duration-200 focus:border-emerald-500/50 text-right"
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
                      className="absolute left-0 top-14 w-56 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      style={{
                        background: '#0d111d',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 70px rgba(0,0,0,0.7)',
                      }}
                    >
                      <div className="p-2.5 space-y-1 max-h-64 overflow-y-auto">
                        <p
                          className="text-[10px] font-black px-2.5 pb-2 pt-1 uppercase tracking-wider text-white/40 text-right"
                        >
                          فرز العرض حسب الصف الأول:
                        </p>
                        {sortOptions.map((optName) => (
                          <button
                            key={optName}
                            onClick={() => {
                              if (sortKey === optName)
                                setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
                              else {
                                setSortKey(optName);
                                setSortDir('desc');
                              }
                              setShowSort(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 text-right"
                            style={{
                              background: sortKey === optName ? 'rgba(16,185,129,0.15)' : 'transparent',
                              color: sortKey === optName ? '#10b981' : 'rgba(255,255,255,0.75)',
                            }}
                          >
                            <span className="font-mono truncate pl-2">{optName}</span>
                            {sortKey === optName && <ArrowUpDown size={12} className="stroke-[2.5] shrink-0" />}
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
        {data.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center py-12 md:py-16">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-[32px] mx-auto mb-6 flex items-center justify-center shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.03))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 50px rgba(16,185,129,0.15)',
                }}
              >
                <BarChart2 size={48} style={{ color: '#10b981' }} />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-black mb-3 text-white tracking-wide">لوحة الاستيراد الذكي المطلق</h2>
              <p
                className="text-sm md:text-base leading-relaxed max-w-md mx-auto"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                ارفع أي ملف إكسيل أياً كانت مسميات الأعمدة بالصف الأول؛ سيقوم النظام بقراءتها ونقل واستعراض أرقامها تلقائياً بالكامل.
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
                background: isDragging ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                border: `2px dashed ${isDragging ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: isDragging ? '0 0 30px rgba(16,185,129,0.1)' : 'none',
              }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                  >
                    <RefreshCw size={36} style={{ color: '#10b981' }} />
                  </motion.div>
                  <p
                    className="text-base font-bold tracking-wide animate-pulse"
                    style={{ color: '#10b981' }}
                  >
                    جاري سحب الهيدر ونقل وتوليد لوحة العرض المتغيرة...
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
                  <p className="text-base font-black text-white mb-1.5">اسحب وأفلت مستند الـ Excel المتغير هنا</p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    يدعم جميع الجداول والأعمدة المتغيرة تلقائياً (XLS, XLSX, CSV)
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

            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: <Search size={22} />,
                  title: 'قراءة مطلقة ومتغيرة',
                  desc: 'تتغير واجهة المستخدم والشارات كلياً لتطابق أسماء الأعمدة في ملفك المرفوع.',
                },
                {
                  icon: <Building2 size={22} />,
                  title: 'نقل القيم كما هي',
                  desc: 'تُعرض الأرقام والنصوص والنسب التراكمية دون تعديل أو فرض حقول مسبقة صلبة.',
                },
                {
                  icon: <TrendingUp size={22} />,
                  title: 'فرز تلقائي لكل عمود',
                  desc: 'تتولَّد خيارات ترتيب وتصفية القائمة لحظياً لكل عنوان عمود مكتوب بالصف الأول.',
                },
                {
                  icon: <Users size={22} />,
                  title: 'حماية وأمان محلي',
                  desc: 'تتم كافة عمليات المعالجة والحساب داخل متصفح جهازك لخصوصية تامة 100%.',
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
            {/* Top Level Summary Dynamic Metrics */}
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
                  className="text-xs font-bold mb-1.5 font-mono tracking-wide text-white/40 truncate"
                  title={`إجمالي: ${valueHeaderKey}`}
                >
                  TOTAL ({valueHeaderKey || 'MAIN VALUE'})
                </p>
                <p
                  className="text-xl md:text-2xl font-black tracking-wide text-emerald-400"
                  style={{ color: '#10b981' }}
                >
                  {totalSales > 0 ? formatCurrencyFull(totalSales) : '—'}
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
                  className="text-xs font-bold mb-1.5 font-mono tracking-wide text-white/40 truncate"
                  title={`متوسط: ${valueHeaderKey}`}
                >
                  AVERAGE ({valueHeaderKey || 'MAIN VALUE'})
                </p>
                <p
                  className="text-xl md:text-2xl font-black tracking-wide text-blue-400"
                  style={{ color: '#3b82f6' }}
                >
                  {avgSales > 0 ? formatCurrencyFull(avgSales) : '—'}
                </p>
                <div className="absolute left-4 bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
                  <BarChart2 size={40} className="text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold mb-4 text-center bg-white/[0.03] w-max mx-auto px-4 py-1.5 rounded-full border border-white/[0.05]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              المعروض حالياً: {filtered.length} صف نشط من أصل {data.length} صف تم استيراده بالكامل
            </motion.p>

            {/* Dynamic Cards Stack */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((record, i) => (
                  <PharmacistCard
                    key={i + String(record[nameHeaderKey] || '')}
                    record={record}
                    avgValue={avgSales}
                    index={i}
                    headers={headers}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Zero Results View */}
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
                <p className="font-extrabold text-base text-white mb-1">لا توجد صفوف مطابقة للبحث</p>
                <p
                  className="text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  تأكد من كتابة نص أو رقم صحيح يتطابق مع أعمدة الجدول المرفوع.
                </p>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Hidden File input element handler */}
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