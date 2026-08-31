import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './Button.js';

describe('Button', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    render(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole('button')).toHaveClass('repo-ui-button--secondary');
  });
});
