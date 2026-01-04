/**
 * DepartmentFlowVisualization Tests
 *
 * Tests for the department flow visualization component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DepartmentFlowVisualization } from '../components/DepartmentFlowVisualization';
import type { Department } from '../types';

// Test fixtures
const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'Procurement',
    description: 'Handles purchasing',
    workUnitCount: 5,
    userCount: 12,
    trustStatus: 'valid',
    roleLabel: 'Request',
  },
  {
    id: 'dept-2',
    name: 'Finance',
    description: 'Financial approvals',
    workUnitCount: 8,
    userCount: 20,
    trustStatus: 'valid',
    roleLabel: 'Approve',
  },
  {
    id: 'dept-3',
    name: 'Legal',
    description: 'Contract review',
    workUnitCount: 3,
    userCount: 6,
    trustStatus: 'expiring',
    roleLabel: 'Contract',
  },
];

const singleDepartment: Department[] = [
  {
    id: 'dept-single',
    name: 'IT',
    workUnitCount: 10,
    userCount: 25,
    trustStatus: 'valid',
  },
];

describe('DepartmentFlowVisualization', () => {
  describe('Basic Rendering', () => {
    it('should render with test id', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} />);
      expect(screen.getByTestId('department-flow-visualization')).toBeInTheDocument();
    });

    it('should render empty state when no departments', () => {
      render(<DepartmentFlowVisualization departments={[]} />);
      expect(screen.getByTestId('department-flow-empty')).toBeInTheDocument();
      expect(screen.getByText('No departments in this value chain')).toBeInTheDocument();
    });

    it('should render all department boxes', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} />);
      expect(screen.getByTestId('department-box-dept-1')).toBeInTheDocument();
      expect(screen.getByTestId('department-box-dept-2')).toBeInTheDocument();
      expect(screen.getByTestId('department-box-dept-3')).toBeInTheDocument();
    });

    it('should display department names', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} />);
      expect(screen.getByText('Procurement')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });
  });

  describe('Work Unit Count Display', () => {
    it('should show work unit counts', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} />);
      expect(screen.getByText('5 units')).toBeInTheDocument();
      expect(screen.getByText('8 units')).toBeInTheDocument();
      expect(screen.getByText('3 units')).toBeInTheDocument();
    });

    it('should show abbreviated unit count in compact mode', () => {
      render(<DepartmentFlowVisualization departments={singleDepartment} compact />);
      expect(screen.getByText('10 u')).toBeInTheDocument();
    });
  });

  describe('Role Labels', () => {
    it('should display role labels in non-compact mode', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} />);
      expect(screen.getByText('(Request)')).toBeInTheDocument();
      expect(screen.getByText('(Approve)')).toBeInTheDocument();
      expect(screen.getByText('(Contract)')).toBeInTheDocument();
    });

    it('should not display role labels in compact mode', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} compact />);
      expect(screen.queryByText('(Request)')).not.toBeInTheDocument();
      expect(screen.queryByText('(Approve)')).not.toBeInTheDocument();
    });
  });

  describe('Trust Status Indicators', () => {
    it('should render departments with different trust statuses', () => {
      const departmentsWithStatuses: Department[] = [
        { id: 'd1', name: 'Valid Dept', workUnitCount: 1, userCount: 1, trustStatus: 'valid' },
        { id: 'd2', name: 'Expiring Dept', workUnitCount: 1, userCount: 1, trustStatus: 'expiring' },
        { id: 'd3', name: 'Expired Dept', workUnitCount: 1, userCount: 1, trustStatus: 'expired' },
        { id: 'd4', name: 'Revoked Dept', workUnitCount: 1, userCount: 1, trustStatus: 'revoked' },
      ];

      render(<DepartmentFlowVisualization departments={departmentsWithStatuses} />);

      expect(screen.getByTestId('department-box-d1')).toBeInTheDocument();
      expect(screen.getByTestId('department-box-d2')).toBeInTheDocument();
      expect(screen.getByTestId('department-box-d3')).toBeInTheDocument();
      expect(screen.getByTestId('department-box-d4')).toBeInTheDocument();
    });
  });

  describe('Custom Trust Status Override', () => {
    it('should use trustStatus prop to override department status', () => {
      const customTrustStatus = {
        'dept-1': 'expired' as const,
      };

      render(
        <DepartmentFlowVisualization
          departments={mockDepartments}
          trustStatus={customTrustStatus}
        />
      );

      // Component should render with overridden status
      expect(screen.getByTestId('department-box-dept-1')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} compact />);
      expect(screen.getByTestId('department-flow-visualization')).toBeInTheDocument();
    });

    it('should render all departments in compact mode', () => {
      render(<DepartmentFlowVisualization departments={mockDepartments} compact />);
      expect(screen.getByText('Procurement')).toBeInTheDocument();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });
  });

  describe('Single Department', () => {
    it('should render single department without arrows', () => {
      render(<DepartmentFlowVisualization departments={singleDepartment} />);
      expect(screen.getByTestId('department-box-dept-single')).toBeInTheDocument();
      expect(screen.getByText('IT')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <DepartmentFlowVisualization
          departments={mockDepartments}
          className="custom-class"
        />
      );
      const container = screen.getByTestId('department-flow-visualization');
      expect(container.className).toContain('custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should handle department with missing optional fields', () => {
      const minimalDepartment: Department[] = [
        {
          id: 'minimal',
          name: 'Minimal',
          workUnitCount: 0,
          userCount: 0,
          trustStatus: 'valid',
        },
      ];

      render(<DepartmentFlowVisualization departments={minimalDepartment} />);
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('0 units')).toBeInTheDocument();
    });

    it('should handle department with long name', () => {
      const longNameDepartment: Department[] = [
        {
          id: 'long',
          name: 'Department of Very Long Names and Extended Descriptions',
          workUnitCount: 5,
          userCount: 10,
          trustStatus: 'valid',
        },
      ];

      render(<DepartmentFlowVisualization departments={longNameDepartment} />);
      expect(
        screen.getByText('Department of Very Long Names and Extended Descriptions')
      ).toBeInTheDocument();
    });
  });
});
