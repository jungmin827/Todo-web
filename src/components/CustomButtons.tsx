import type { ButtonHTMLAttributes } from 'react'

export default function CustomButton({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} type={type} className={`rounded border px-3 py-1 disabled:opacity-40 ${className}`} />
}
