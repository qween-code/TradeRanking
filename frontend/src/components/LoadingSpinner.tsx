interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizeMap[size]} border-3 border-gray-200 border-t-primary-600 rounded-full animate-spin`} />
      {text && <p className="mt-3 text-sm text-gray-500">{text}</p>}
    </div>
  )
}
