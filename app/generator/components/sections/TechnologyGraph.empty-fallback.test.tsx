import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { TechnologyGraph } from './TechnologyGraph';

describe('TechnologyGraph Edge Cases & Empty/Missing Inputs Verification', () => {
  let consoleErrorMock: typeof console.error;

  beforeEach(() => {
    // Capture console.error to make sure no hydration or React errors are triggered silently
    consoleErrorMock = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = consoleErrorMock;
    vi.restoreAllMocks();
  });

  // 1. Rendering with empty arrays or empty technology data
  it('renders successfully with an empty selected technologies array', () => {
    const onToggleMock = vi.fn();
    render(<TechnologyGraph selected={[]} onToggle={onToggleMock} />);

    // Confirm that the selected count badge renders '0 Selected Technologies'
    expect(screen.getByText('0 Selected Technologies')).toBeInTheDocument();

    // Verify that the standard graph title and instructions are present
    expect(screen.getByText('Technology Dependency Graph')).toBeInTheDocument();
    expect(
      screen.getByText(/Ecosystem recommendations & compatibility paths/i)
    ).toBeInTheDocument();

    // Verify all 10 default technology labels are rendered
    const defaultTechs = [
      'React',
      'Next.js',
      'Tailwind CSS',
      'Vite',
      'Node.js',
      'Express',
      'MongoDB',
      'PostgreSQL',
      'NestJS',
      'Prisma',
    ];
    defaultTechs.forEach((tech) => {
      expect(screen.getByText(tech)).toBeInTheDocument();
    });
  });

  // 2. Handling null, undefined, or missing props without runtime failures
  it('handles null or missing props gracefully using fallbacks without runtime crashes', () => {
    // We intentionally pass invalid/missing props to test robustness
    const { container } = render(
      <TechnologyGraph
        selected={null as unknown as string[]}
        onToggle={undefined as unknown as (id: string) => void}
      />
    );

    // Should gracefully fallback safeSelected to an empty array
    expect(screen.getByText('0 Selected Technologies')).toBeInTheDocument();

    // The container should still contain the SVG canvas
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Verify console.error was not called for React crashes or invalid states
    expect(console.error).not.toHaveBeenCalled();
  });

  // 3. Verifying fallback UI/layout remains stable and non-breaking
  it('keeps layout containers and toolbar UI elements stable and styled when selection is empty', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);

    // Verify layout boundaries and visual classes
    const layoutWrapper = container.firstChild as HTMLElement;
    expect(layoutWrapper).toHaveClass('mt-6', 'p-5', 'bg-white', 'dark:bg-[#111111]');

    const innerContainer = container.querySelector('.relative.w-full.h-\\[400px\\]');
    expect(innerContainer).toBeInTheDocument();

    // Toolbar controls (Zoom In, Zoom Out, Reset Layout) should be correctly rendered
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset Graph Layout')).toBeInTheDocument();
  });

  // 4. Ensuring no hydration errors or unexpected runtime exceptions occur with empty inputs
  it('does not throw any exceptions or trigger hydration warnings during its lifecycle with empty selection', () => {
    expect(() => {
      const { unmount } = render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);
      unmount();
    }).not.toThrow();

    // Confirm that no React warning/error logs were outputted to console
    expect(console.error).not.toHaveBeenCalled();
  });

  // 5. Confirming placeholder DOM structures or empty-state markers exist when no technology data is available
  it('renders default placeholder nodes in full opacity when no selections or hovers are active', () => {
    const { container } = render(<TechnologyGraph selected={[]} onToggle={vi.fn()} />);

    // The green status indicator marker should exist
    const activeMarker = container.querySelector('.bg-emerald-500');
    expect(activeMarker).toBeInTheDocument();

    // Since safeSelected.length is 0 and hoveredNode is null, all nodes should have opacity 1
    // Let's verify that the outer circles (representing nodes) do not have opacity 0.25
    const outerCircles = container.querySelectorAll('circle[r="26"], circle[r="24"]');
    expect(outerCircles.length).toBeGreaterThan(0);
    outerCircles.forEach((circle) => {
      const style = window.getComputedStyle(circle);
      expect(style.opacity).not.toBe('0.25');
    });
  });
});
