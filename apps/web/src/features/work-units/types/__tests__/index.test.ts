/**
 * Work Units Types Tests
 *
 * Tests for the helper functions in the types module.
 */

import { describe, it, expect } from 'vitest';
import {
  getPermissionsForLevel,
  canPerformAction,
  type UserLevel,
  type TrustStatus,
} from '../index';

describe('getPermissionsForLevel', () => {
  describe('Level 1 (Task Performer)', () => {
    it('should allow running tasks', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canRun).toBe(true);
    });

    it('should not allow configuration', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canConfigure).toBe(false);
    });

    it('should not allow delegation', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canDelegate).toBe(false);
    });

    it('should not allow creating work units', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canCreateWorkUnits).toBe(false);
    });

    it('should not allow workspace management', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canManageWorkspaces).toBe(false);
    });

    it('should not allow viewing value chains', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canViewValueChains).toBe(false);
    });

    it('should not allow compliance access', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canAccessCompliance).toBe(false);
    });

    it('should not allow trust establishment', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canEstablishTrust).toBe(false);
    });

    it('should not allow deletion', () => {
      const permissions = getPermissionsForLevel(1);
      expect(permissions.canDelete).toBe(false);
    });
  });

  describe('Level 2 (Process Owner)', () => {
    it('should allow all Level 1 permissions plus more', () => {
      const permissions = getPermissionsForLevel(2);
      expect(permissions.canRun).toBe(true);
      expect(permissions.canConfigure).toBe(true);
      expect(permissions.canDelegate).toBe(true);
      expect(permissions.canCreateWorkUnits).toBe(true);
      expect(permissions.canManageWorkspaces).toBe(true);
    });

    it('should not allow Level 3 permissions', () => {
      const permissions = getPermissionsForLevel(2);
      expect(permissions.canViewValueChains).toBe(false);
      expect(permissions.canAccessCompliance).toBe(false);
      expect(permissions.canEstablishTrust).toBe(false);
      expect(permissions.canDelete).toBe(false);
    });
  });

  describe('Level 3 (Value Chain Owner)', () => {
    it('should allow all permissions', () => {
      const permissions = getPermissionsForLevel(3);
      expect(permissions.canRun).toBe(true);
      expect(permissions.canConfigure).toBe(true);
      expect(permissions.canDelegate).toBe(true);
      expect(permissions.canCreateWorkUnits).toBe(true);
      expect(permissions.canManageWorkspaces).toBe(true);
      expect(permissions.canViewValueChains).toBe(true);
      expect(permissions.canAccessCompliance).toBe(true);
      expect(permissions.canEstablishTrust).toBe(true);
      expect(permissions.canDelete).toBe(true);
    });
  });
});

describe('canPerformAction', () => {
  describe('run action', () => {
    it('should allow run with valid trust for Level 1', () => {
      const result = canPerformAction('run', 1, 'valid');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should allow run with valid trust for Level 2', () => {
      const result = canPerformAction('run', 2, 'valid');
      expect(result.allowed).toBe(true);
    });

    it('should allow run with valid trust for Level 3', () => {
      const result = canPerformAction('run', 3, 'valid');
      expect(result.allowed).toBe(true);
    });

    it('should deny run with expired trust', () => {
      const result = canPerformAction('run', 1, 'expired');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot run: trust is expired');
    });

    it('should deny run with revoked trust', () => {
      const result = canPerformAction('run', 2, 'revoked');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot run: trust is revoked');
    });

    it('should deny run with pending trust', () => {
      const result = canPerformAction('run', 3, 'pending');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot run: trust is pending');
    });
  });

  describe('configure action', () => {
    it('should deny configure for Level 1', () => {
      const result = canPerformAction('configure', 1, 'valid');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires Level 2 or higher');
    });

    it('should allow configure for Level 2 regardless of trust status', () => {
      const statuses: TrustStatus[] = ['valid', 'expired', 'revoked', 'pending'];
      for (const status of statuses) {
        const result = canPerformAction('configure', 2, status);
        expect(result.allowed).toBe(true);
      }
    });

    it('should allow configure for Level 3', () => {
      const result = canPerformAction('configure', 3, 'valid');
      expect(result.allowed).toBe(true);
    });
  });

  describe('delegate action', () => {
    it('should deny delegate for Level 1', () => {
      const result = canPerformAction('delegate', 1, 'valid');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires Level 2 or higher');
    });

    it('should allow delegate for Level 2 with valid trust', () => {
      const result = canPerformAction('delegate', 2, 'valid');
      expect(result.allowed).toBe(true);
    });

    it('should deny delegate with expired trust for Level 2', () => {
      const result = canPerformAction('delegate', 2, 'expired');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot delegate: trust is expired');
    });

    it('should deny delegate with revoked trust for Level 3', () => {
      const result = canPerformAction('delegate', 3, 'revoked');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot delegate: trust is revoked');
    });
  });

  describe('delete action', () => {
    it('should deny delete for Level 1', () => {
      const result = canPerformAction('delete', 1, 'valid');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires Level 3');
    });

    it('should deny delete for Level 2', () => {
      const result = canPerformAction('delete', 2, 'valid');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Requires Level 3');
    });

    it('should allow delete for Level 3 regardless of trust status', () => {
      const statuses: TrustStatus[] = ['valid', 'expired', 'revoked', 'pending'];
      for (const status of statuses) {
        const result = canPerformAction('delete', 3, status);
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle all user levels', () => {
      const levels: UserLevel[] = [1, 2, 3];
      for (const level of levels) {
        const result = canPerformAction('run', level, 'valid');
        expect(result.allowed).toBe(true);
      }
    });

    it('should handle all trust statuses', () => {
      const statuses: TrustStatus[] = ['valid', 'expired', 'revoked', 'pending'];
      for (const status of statuses) {
        const result = canPerformAction('configure', 3, status);
        expect(result.allowed).toBe(true);
      }
    });
  });
});
