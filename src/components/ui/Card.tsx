import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-lg border shadow-sm
        ${hover ? 'transition-shadow hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--chat-bg-message-ai)',
        borderColor: 'var(--chat-border)'
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-b ${className}`} style={{ borderColor: 'var(--chat-border)' }} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-t ${className}`} style={{ borderColor: 'var(--chat-border)' }} {...props}>
      {children}
    </div>
  )
}
