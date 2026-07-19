export const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 border-blue-200',
  INTERVIEW: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  OFFER: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  GHOSTED: 'bg-gray-100 text-gray-800 border-gray-200',
  REPLIED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export const CONFIDENCE_COLORS: Record<string, string> = {
  HIGH: 'bg-green-50 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-red-50 text-red-700 border-red-200',
};

export const TYPE_COLORS: Record<string, string> = {
  HR: 'bg-blue-100 text-blue-800',
  TECHNICAL: 'bg-purple-100 text-purple-800',
  BEHAVIOURAL: 'bg-cyan-100 text-cyan-800',
  MANAGERIAL: 'bg-orange-100 text-orange-800',
  GD: 'bg-teal-100 text-teal-800',
  OTHERS: 'bg-gray-100 text-gray-800',
};

export function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB');
}

export function formatDateTime(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}
