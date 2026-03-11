interface StatusBadgeProps {
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Saved';
}

const statusConfig = {
  Applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Interview: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Offer: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  Rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  Saved: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
