import { Plus } from 'lucide-react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-hi border border-border flex items-center justify-center mb-5">
          <Icon size={24} className="text-faint" />
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-ink mb-1.5">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs mb-6">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
