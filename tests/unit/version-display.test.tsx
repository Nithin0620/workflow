import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VersionDisplay } from '../../src/components/common/version-display';
import packageInfo from '../../package.json';

describe('VersionDisplay', () => {
  it('renders the version correctly', () => {
    render(<VersionDisplay />);
    expect(screen.getByText(`v${packageInfo.version}`)).toBeInTheDocument();
  });
});
