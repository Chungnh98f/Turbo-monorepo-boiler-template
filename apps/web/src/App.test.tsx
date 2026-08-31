import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App.js';

describe('App', () => {
  it('renders the heading and the API button', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Turbo Monorepo Template' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Call the API' })).toBeInTheDocument();
  });
});
