import type { InputHTMLAttributes } from 'react'

export default function CustomInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={`rounded border px-2 py-1 ${className}`} />
}
