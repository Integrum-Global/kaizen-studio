/**
 * useLevelTransition Hook
 *
 * Monitors user level changes and provides notifications/animations
 * when the user's trust posture changes (level upgrade or downgrade).
 *
 * Level transitions happen when:
 * - User receives delegations with delegation capability (1 -> 2)
 * - User is granted trust establishment authority (2 -> 3)
 * - User's delegations are revoked (2 -> 1, 3 -> 2)
 *
 * @see docs/plans/eatp-ontology/03-user-experience-levels.md
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserLevel, getLevelLabel, getLevelDescription } from '@/contexts/UserLevelContext';
import type { UserLevel } from '@/features/work-units/types';

/**
 * Level transition info
 */
export interface LevelTransition {
  from: UserLevel;
  to: UserLevel;
  direction: 'upgrade' | 'downgrade';
  timestamp: Date;
}

/**
 * Transition message configuration
 */
interface TransitionMessage {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

/**
 * Get transition message based on level change
 */
function getTransitionMessage(from: UserLevel, to: UserLevel): TransitionMessage | null {
  // Upgrade messages
  if (from === 1 && to === 2) {
    return {
      title: 'Process Owner Access Granted',
      description: 'You now have Process Owner access. Explore your new capabilities!',
      action: {
        label: 'View Processes',
        href: '/work/processes',
      },
    };
  }

  if (from === 1 && to === 3) {
    return {
      title: 'Value Chain Owner Access Granted',
      description: 'You now have full Value Chain Owner access. Manage enterprise-wide processes.',
      action: {
        label: 'View Value Chains',
        href: '/work/value-chains',
      },
    };
  }

  if (from === 2 && to === 3) {
    return {
      title: 'Value Chain Owner Access Granted',
      description: 'You now have Value Chain Owner access. View enterprise-wide processes.',
      action: {
        label: 'View Value Chains',
        href: '/work/value-chains',
      },
    };
  }

  // Downgrade messages
  if (from === 2 && to === 1) {
    return {
      title: 'Access Level Changed',
      description: 'Your access has changed. Some features may no longer be available.',
    };
  }

  if (from === 3 && to === 1) {
    return {
      title: 'Access Level Changed',
      description: 'Your access has changed. Process and Value Chain features are no longer available.',
    };
  }

  if (from === 3 && to === 2) {
    return {
      title: 'Access Level Changed',
      description: 'Your access has changed. Value Chain features are no longer available.',
    };
  }

  return null;
}

/**
 * Hook options
 */
export interface UseLevelTransitionOptions {
  /**
   * Whether to show toast notifications on level change
   * @default true
   */
  showNotifications?: boolean;

  /**
   * Callback when level changes
   */
  onTransition?: (transition: LevelTransition) => void;

  /**
   * Whether to navigate to suggested page on upgrade
   * @default false
   */
  autoNavigate?: boolean;
}

/**
 * Hook return value
 */
export interface UseLevelTransitionResult {
  /**
   * Current user level
   */
  currentLevel: UserLevel;

  /**
   * Current level label
   */
  currentLevelLabel: string;

  /**
   * Current level description
   */
  currentLevelDescription: string;

  /**
   * Most recent transition, if any
   */
  lastTransition: LevelTransition | null;

  /**
   * Whether a transition is currently animating
   */
  isTransitioning: boolean;

  /**
   * Manually trigger a transition check
   */
  checkTransition: () => void;
}

/**
 * Monitor user level changes and provide notifications
 */
export function useLevelTransition(
  options: UseLevelTransitionOptions = {}
): UseLevelTransitionResult {
  const {
    showNotifications = true,
    onTransition,
    autoNavigate = false,
  } = options;

  const navigate = useNavigate();
  const { toast } = useToast();
  const { level, isLoading, refetch } = useUserLevel();

  // Track previous level to detect changes
  const prevLevelRef = useRef<UserLevel | null>(null);
  const isInitializedRef = useRef(false);

  // Transition state
  const [lastTransition, setLastTransition] = useState<LevelTransition | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle level changes
  useEffect(() => {
    // Skip if loading or not yet initialized
    if (isLoading) return;

    // On first render, just record the level without showing notification
    if (!isInitializedRef.current) {
      prevLevelRef.current = level;
      isInitializedRef.current = true;
      return;
    }

    // Detect level change
    const prevLevel = prevLevelRef.current;
    if (prevLevel !== null && prevLevel !== level) {
      const transition: LevelTransition = {
        from: prevLevel,
        to: level,
        direction: level > prevLevel ? 'upgrade' : 'downgrade',
        timestamp: new Date(),
      };

      setLastTransition(transition);
      setIsTransitioning(true);

      // Show notification
      if (showNotifications) {
        const message = getTransitionMessage(prevLevel, level);
        if (message) {
          toast({
            title: message.title,
            description: message.description,
            variant: transition.direction === 'upgrade' ? 'default' : 'destructive',
          });

          // Auto-navigate on upgrade if enabled
          if (autoNavigate && transition.direction === 'upgrade' && message.action) {
            // Small delay to let user see the toast
            setTimeout(() => {
              navigate(message.action!.href);
            }, 1000);
          }
        }
      }

      // Call callback
      onTransition?.(transition);

      // End transition animation after delay
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400); // Match animation duration
    }

    // Update previous level
    prevLevelRef.current = level;
  }, [level, isLoading, showNotifications, autoNavigate, toast, navigate, onTransition]);

  // Manual check function
  const checkTransition = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    currentLevel: level,
    currentLevelLabel: getLevelLabel(level),
    currentLevelDescription: getLevelDescription(level),
    lastTransition,
    isTransitioning,
    checkTransition,
  };
}

export default useLevelTransition;
