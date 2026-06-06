import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import ContributorsSearch from './ContributorsSearch';

describe('ContributorsSearch empty fallback', () => {
  it('renders safely with an empty contributor collection', () => {
    expect(() => render(<ContributorsSearch contributors={[]} />)).not.toThrow();
  });

  it('shows the no-results fallback for an empty collection', () => {
    render(<ContributorsSearch contributors={[]} />);

    expect(screen.getByText('No architects found')).toBeTruthy();
    expect(screen.getByText('Try a different search query')).toBeTruthy();
  });

  it('reports an empty contributor count', () => {
    render(<ContributorsSearch contributors={[]} />);

    expect(screen.getByText('0 of 0 contributors')).toBeTruthy();
  });

  it('preserves the default empty grid and fallback layout styles', () => {
    const { container } = render(<ContributorsSearch contributors={[]} />);

    const grid = container.querySelector('.grid');
    const fallback = screen.getByText('No architects found').parentElement;

    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(fallback?.className).toContain('items-center');
    expect(fallback?.className).toContain('text-center');
  });

  it('keeps the empty fallback stable while searching and clearing', async () => {
    const user = userEvent.setup();
    render(<ContributorsSearch contributors={[]} />);

    const input = screen.getByRole('textbox', { name: 'Search contributors by name' });
    await user.type(input, 'missing contributor');

    expect(screen.getByText('No architects found')).toBeTruthy();
    expect(screen.getByText('0 of 0 contributors')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(input).toHaveValue('');
    expect(screen.getByText('No architects found')).toBeTruthy();
  });
});
