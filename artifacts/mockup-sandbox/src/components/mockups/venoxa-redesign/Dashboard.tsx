import {
  BookOpen, Calendar, Repeat2, Layers, AlignLeft,
  PenLine, MessageCircle, Mic, Headphones, BookMarked,
  Home, BarChart2, Moon, Bell, Search, ChevronLeft,
  Star, Zap, Target, TrendingUp, Clock, Award
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "الرئيسية", active: true },
  { icon: Calendar, label: "خطة المذاكرة" },
  { icon: BookMarked, label: "الكلمات والمراجعة" },
  { icon: Layers, label: "الأفعال المركبة" },
  { icon: Repeat2, label: "التعابير والعامية" },
  { icon: PenLine, label: "الكتابة (AI)" },
  { icon: MessageCircle, label: "المحادثة والاتصال" },
  { icon: AlignLeft, label: "القواعد (AI)" },
  { icon: Headphones, label: "الاستماع" },
  { icon: BookOpen, label: "القراءة (AI)" },
];

const FEATURE_CARDS = [
  {
    icon: MessageCircle,
    title: "تحدي التحدث",
    subtitle: "محادثات ذكاء اصطناعي",
    desc: "تدرب على محادثات واقعية وحسّن طلاقتك مع مواقف متنوعة.",
    bg: "bg-[#C8EFE8]",
    iconBg: "bg-[#6ECEC0]",
    iconColor: "text-white",
    textColor: "text-[#0a5c52]",
  },
  {
    icon: Headphones,
    title: "تقوية الاستماع",
    subtitle: "تدريب الأذن",
    desc: "مصادر بودكاست ممتازة حسب مستواك لتنمية مهارات الإدراك السمعي.",
    bg: "bg-[#FFE4B2]",
    iconBg: "bg-[#FFB347]",
    iconColor: "text-white",
    textColor: "text-[#7a4a00]",
  },
  {
    icon: PenLine,
    title: "تحسين الكتابة",
    subtitle: "تصحيح بالذكاء الاصطناعي",
    desc: "اكتب نصوصاً وسيقوم الذكاء الاصطناعي بتصحيحها وتوضيح الفرق بين لغة الأجانب.",
    bg: "bg-[#E8D5F5]",
    iconBg: "bg-[#B57BEA]",
    iconColor: "text-white",
    textColor: "text-[#5a2d82]",
  },
  {
    icon: BookOpen,
    title: "القراءة الذكية",
    subtitle: "فهم المقروء",
    desc: "نصوص حقيقية من مصادر متنوعة مع مساعدة AI لشرح المفردات والسياق.",
    bg: "bg-[#FFD5D5]",
    iconBg: "bg-[#FF7B7B]",
    iconColor: "text-white",
    textColor: "text-[#8b2020]",
  },
];

const STATS = [
  { icon: Zap, value: "B2", label: "مستواك الحالي", color: "text-[#0E4AA4]", bg: "bg-[#EBF0F7]" },
  { icon: Target, value: "C2", label: "الهدف المستهدف", color: "text-[#7a4a00]", bg: "bg-[#FFF3DC]" },
  { icon: Clock, value: "36", label: "أسبوعاً متبقياً", color: "text-[#0a5c52]", bg: "bg-[#C8EFE8]" },
  { icon: Award, value: "87%", label: "نسبة إنجاز الخطة", color: "text-[#5a2d82]", bg: "bg-[#E8D5F5]" },
];

export function Dashboard() {
  return (
    <div
      className="flex h-screen bg-[#F7F9FC] font-['Noto_Sans']"
      dir="rtl"
      style={{ fontFamily: "'Noto Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-l border-gray-100 flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0E4AA4] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <div>
              <span className="font-bold text-[#0A0A0A] text-base tracking-tight">Venoxa</span>
              <span className="text-[#0E4AA4] font-bold text-base">.ai</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 bg-[#F7F9FC] border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400">
            <Search className="w-4 h-4" />
            <span>بحث...</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-right ${
                active
                  ? "bg-[#EBF0F7] text-[#0E4AA4]"
                  : "text-[#555] hover:bg-[#F7F9FC] hover:text-[#0A0A0A]"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#0E4AA4]" : "text-gray-400"}`} />
              <span className="flex-1">{label}</span>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-[#0E4AA4]" />}
            </button>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-gray-400">
            <button className="p-2 rounded-lg hover:bg-[#F7F9FC] hover:text-gray-600 transition-colors">
              <Moon className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-[#F7F9FC] hover:text-gray-600 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg hover:bg-[#F7F9FC]">
              <span>عربي</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-[#0A0A0A]">أهلاً بك في Venoxa! 👋</h1>
            <p className="text-sm text-gray-500">مستواك الحالي: <span className="font-bold text-[#0E4AA4]">B2</span></p>
          </div>
          <button className="bg-[#0E4AA4] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0c3d8a] transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            إنشاء الخطة والمستوى
          </button>
        </header>

        <div className="px-8 py-6 space-y-8">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, value, label, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={`w-10 h-10 rounded-xl ${bg} shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Tip + Quote row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tip card */}
            <div className="bg-[#FFF3DC] rounded-2xl p-5 border border-[#FFD78A]/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#FFD78A] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-[#7a4a00]" />
                </div>
                <span className="text-xs font-bold text-[#7a4a00] uppercase tracking-wide">نصيحة ذكية</span>
                <span className="text-xs bg-[#FFD78A] text-[#7a4a00] font-bold px-2 py-0.5 rounded-full">B2</span>
              </div>
              <p className="text-sm font-semibold text-[#0A0A0A] leading-relaxed">
                Practice one new phrase every day to boost your confidence.
              </p>
              <p className="text-xs text-[#7a4a00] mt-2">
                استخدم تطبيق تبادل اللغة لزيادة ثقتك.
              </p>
            </div>

            {/* Quote card */}
            <div className="bg-[#EBF0F7] rounded-2xl p-5 border border-[#0E4AA4]/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#0E4AA4] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-[#0E4AA4] uppercase tracking-wide">إلهام اليوم</span>
              </div>
              <p className="text-sm font-semibold text-[#0A0A0A] leading-relaxed">
                "Keep pushing forward, you'll get there."
              </p>
              <p className="text-xs text-[#0E4AA4] mt-2">
                تابع التقدم، سيوصلك الأمر.
              </p>
            </div>
          </div>

          {/* Section heading */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#0E4AA4]" />
              مسارات التعلم الأساسية
            </h2>
            <button className="text-sm text-[#0E4AA4] font-medium hover:underline">
              عرض الكل
            </button>
          </div>

          {/* Feature cards grid — LanGeek staggered style */}
          <div className="grid grid-cols-4 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, subtitle, desc, bg, iconBg, iconColor, textColor }) => (
              <div
                key={title}
                className={`${bg} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform duration-200 border border-white/60 shadow-sm`}
              >
                <div className={`w-10 h-10 rounded-xl ${iconBg} shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${textColor} opacity-70 mb-1`}>
                  {subtitle}
                </div>
                <h3 className={`font-bold text-sm ${textColor} mb-2`}>{title}</h3>
                <p className={`text-xs ${textColor} opacity-80 leading-relaxed`}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Weekly progress bar */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#0A0A0A]">تقدم الأسبوع الحالي</h3>
              <span className="text-xs text-gray-400">الأسبوع 3 من 36</span>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 bg-[#F7F9FC] rounded-full h-3">
                <div className="bg-[#0E4AA4] h-3 rounded-full" style={{ width: "8.3%" }} />
              </div>
              <span className="text-sm font-bold text-[#0E4AA4]">8.3%</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "المفردات", done: "168", total: "2024", color: "bg-[#6ECEC0]" },
                { label: "القواعد", done: "21", total: "252", color: "bg-[#FFB347]" },
                { label: "ساعات الدراسة", done: "31.5h", total: "378h", color: "bg-[#B57BEA]" },
              ].map(({ label, done, total, color }) => (
                <div key={label} className="bg-[#F7F9FC] rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="flex items-end gap-1">
                    <span className="font-bold text-sm text-[#0A0A0A]">{done}</span>
                    <span className="text-xs text-gray-400 mb-0.5">/ {total}</span>
                  </div>
                  <div className="mt-2 bg-white rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: "8%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
