import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Documentation from '@/pages/Documentation';

describe('Documentation page', () => {
    it('renders the guide and key service instructions', () => {
        render(<Documentation />);

        expect(screen.getByRole('heading', { name: 'Develop locally with confidence' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Quick start' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Mailpit' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'phpMyAdmin' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'MinIO' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Ports and Settings' })).toBeInTheDocument();
    });
});
