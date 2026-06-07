import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Loading from './loading';

describe('Loading - Responsive Multi-device Columns & Mobile Viewport Layouts', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('renders correctly on a mobile-width viewport', () => {
    const { container } = render(<Loading />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('uses a vertical flex layout suitable for mobile screens', () => {
    const { container } = render(<Loading />);

    const contentWrapper = container.querySelector('.flex.flex-col');

    expect(contentWrapper).toBeInTheDocument();
  });

  it('keeps content centered within the viewport', () => {
    const { container } = render(<Loading />);

    const wrapper = container.querySelector('.min-h-screen');

    expect(wrapper?.className).toContain('items-center');
    expect(wrapper?.className).toContain('justify-center');
  });

  it('does not use fixed-width container classes that could cause horizontal scrolling', () => {
    const { container } = render(<Loading />);

    const root = container.firstElementChild;

    expect(root?.className).not.toContain('w-screen');
    expect(root?.className).not.toContain('max-w');
  });

  it('renders the loading spinner on mobile layouts', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');

    expect(spinner).toBeInTheDocument();
  });
});
