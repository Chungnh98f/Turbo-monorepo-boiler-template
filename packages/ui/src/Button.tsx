import type { ButtonHTMLAttributes, ReactNode } from 'react';

import './Button.css';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={`repo-ui-button repo-ui-button--${variant}`} {...props}>
      {children}
    </button>
  );
}
