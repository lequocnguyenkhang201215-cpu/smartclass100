import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className="mb-6 pb-4 border-b border-cyan-500/25">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {item.href && !isLast ? (
                  <Link to={item.href} className="hover:text-cyan-400 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-cyan-300 font-semibold' : ''}>{item.label}</span>
                )}
                {!isLast && <ChevronRight className="w-3 h-3 text-cyan-500/50 shrink-0" />}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:flex-1 lg:justify-end">{actions}</div>}
      </div>
    </div>
  );
};
