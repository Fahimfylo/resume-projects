export default function ChartCard({ title, subtitle, icon: Icon, iconColor, iconBg, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 transition-all duration-300 ${className}`}>
      {(title || subtitle) && (
        <div className="flex items-center mb-6">
          {Icon && (
            <div className={`p-3 rounded-2xl mr-4 border ${iconBg || 'bg-indigo-50 dark:bg-indigo-900/30'} ${iconColor || 'text-indigo-600 dark:text-indigo-400'} border-indigo-100 dark:border-indigo-800/30 transition-colors`}>
              <Icon size={22} />
            </div>
          )}
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}