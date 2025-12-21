import React from 'react';

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'inverse' | 'outline-inverse';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const BrandButton: React.FC<BrandButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    className = '',
    ...props
}) => {
    // 1. Base Styles
    const baseStyles = `
        inline-flex items-center justify-center gap-2 
        transition-all duration-200 active:scale-[0.98]
        font-heading font-brand case-brand tracking-wide
        rounded-[var(--radius-lg)]
    `;

    // 2. Variant Styles
    const variants = {
        primary: `
            bg-primary text-primary-fg 
            shadow-depth hover:brightness-110 border border-transparent
        `,
        secondary: `
            bg-[var(--color-bg-app)] text-text-main 
            border border-border hover:border-primary hover:text-primary
        `,
        outline: `
            bg-transparent border-2 border-primary text-primary 
            hover:bg-primary hover:text-primary-fg
        `,
        ghost: `
            bg-transparent text-text-muted hover:text-primary hover:bg-surface/50
        `,
        inverse: `
            bg-white text-black 
            hover:bg-gray-200 border border-transparent shadow-lg
        `,
        'outline-inverse': `
            bg-transparent border-2 border-white text-white 
            hover:bg-white hover:text-black
        `
    };

    // 3. Size Styles
    const sizes = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-5 py-2.5',
        lg: 'text-base px-8 py-3.5 font-bold'
    };

    return (
        <button
            className={`
                ${baseStyles}
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            {...props}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
        </button>
    );
};