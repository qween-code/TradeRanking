const statusStyles: Record<string, string> = {
  // RFQ statuses
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  awarded: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  // Offer statuses
  pending: 'bg-yellow-100 text-yellow-700',
  under_review: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  counter_offered: 'bg-purple-100 text-purple-700',
  withdrawn: 'bg-gray-200 text-gray-600',
  // Job statuses
  queued: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  // Risk levels
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  // Verification
  verified: 'bg-green-100 text-green-700',
  unverified: 'bg-gray-100 text-gray-700',
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700'
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  const label = status.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center font-medium rounded-full capitalize ${style} ${sizeClass}`}>
      {label}
    </span>
  )
}
