/**
 * Hook for managing condition builder state
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  PolicyCondition,
  ConditionValue,
  ConditionCategory,
  ConditionOperator,
  ConditionGroup,
  ConditionValidation,
} from "../types";
import { generateConditionId, createEmptyCondition } from "../types";
import { getAttributeById, getAttributesByCategory } from "../data/attributes";
import { getOperatorsForType } from "../data/operators";
import { getTemplateById } from "../data/templates";
import { translateCondition, translateConditions } from "../data/translations";

interface UseConditionBuilderOptions {
  initialConditions?: PolicyCondition[];
  initialLogic?: "all" | "any";
  onChange?: (group: ConditionGroup) => void;
}

interface UseConditionBuilderReturn {
  // State
  conditions: PolicyCondition[];
  logic: "all" | "any";

  // Actions
  addCondition: () => void;
  removeCondition: (id: string) => void;
  updateCondition: (id: string, updates: Partial<PolicyCondition>) => void;
  updateConditionCategory: (id: string, category: ConditionCategory) => void;
  updateConditionAttribute: (id: string, attributeId: string) => void;
  updateConditionOperator: (id: string, operator: ConditionOperator) => void;
  updateConditionValue: (id: string, value: ConditionValue) => void;
  setLogic: (logic: "all" | "any") => void;
  applyTemplate: (templateId: string) => void;
  clearConditions: () => void;
  setConditions: (conditions: PolicyCondition[]) => void;

  // Helpers
  getAvailableAttributes: (category: ConditionCategory) => ReturnType<typeof getAttributesByCategory>;
  getAvailableOperators: (attributeId: string) => ReturnType<typeof getOperatorsForType>;
  getConditionTranslation: (condition: PolicyCondition) => string;
  getOverallTranslation: () => string;
  validateCondition: (condition: PolicyCondition) => ConditionValidation;
  validateAll: () => { isValid: boolean; errors: Map<string, string[]> };

  // Export
  toConditionGroup: () => ConditionGroup;
}

/**
 * Validate a single condition
 */
function validateSingleCondition(condition: PolicyCondition): ConditionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check attribute is selected
  if (!condition.attribute) {
    errors.push("Please select an attribute");
  }

  // Check value is set (except for exists/not_exists operators)
  if (condition.operator !== "exists" && condition.operator !== "not_exists") {
    const value = condition.value;
    if (value === null || value === undefined || value === "") {
      errors.push("Please enter a value");
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push("Please select at least one value");
    }
  }

  // Attribute-specific validation
  const attr = getAttributeById(condition.attribute);
  if (attr?.validation && condition.value && typeof condition.value === "string") {
    const regex = new RegExp(attr.validation.pattern!);
    if (!regex.test(condition.value)) {
      errors.push(attr.validation.message!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function useConditionBuilder(
  options: UseConditionBuilderOptions = {}
): UseConditionBuilderReturn {
  const { initialConditions = [], initialLogic = "all", onChange } = options;

  const [conditions, setConditionsState] = useState<PolicyCondition[]>(initialConditions);
  const [logic, setLogicState] = useState<"all" | "any">(initialLogic);

  // Track if this is the initial mount to skip first notification
  const isInitialMount = useRef(true);

  // Notify parent of changes via useEffect (not during render)
  useEffect(() => {
    // Skip the initial mount to avoid unnecessary notifications
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onChange?.({ logic, conditions });
  }, [conditions, logic, onChange]);

  // Add a new empty condition
  const addCondition = useCallback(() => {
    const newCondition = createEmptyCondition();
    setConditionsState((prev) => [...prev, newCondition]);
  }, []);

  // Remove a condition by ID
  const removeCondition = useCallback((id: string) => {
    setConditionsState((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Update a condition with partial updates
  const updateCondition = useCallback(
    (id: string, updates: Partial<PolicyCondition>) => {
      setConditionsState((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  // Update condition category (resets attribute, operator, value)
  const updateConditionCategory = useCallback(
    (id: string, category: ConditionCategory) => {
      setConditionsState((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                category,
                attribute: "",
                operator: "equals" as ConditionOperator,
                value: "",
              }
            : c
        )
      );
    },
    []
  );

  // Update condition attribute (resets operator and value based on type)
  const updateConditionAttribute = useCallback((id: string, attributeId: string) => {
    const attr = getAttributeById(attributeId);
    const availableOperators = attr ? getOperatorsForType(attr.valueType) : [];
    const defaultOperator = availableOperators[0]?.id || "equals";

    setConditionsState((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              attribute: attributeId,
              operator: defaultOperator,
              value: attr?.valueType === "boolean" ? false : "",
            }
          : c
      )
    );
  }, []);

  // Update condition operator
  const updateConditionOperator = useCallback(
    (id: string, operator: ConditionOperator) => {
      setConditionsState((prev) =>
        prev.map((c) => (c.id === id ? { ...c, operator } : c))
      );
    },
    []
  );

  // Update condition value
  const updateConditionValue = useCallback((id: string, value: ConditionValue) => {
    setConditionsState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value } : c))
    );
  }, []);

  // Set logic operator
  const setLogic = useCallback((newLogic: "all" | "any") => {
    setLogicState(newLogic);
  }, []);

  // Apply a template
  const applyTemplate = useCallback((templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    const newConditions: PolicyCondition[] = template.conditions.map((tc) => ({
      id: generateConditionId(),
      category: tc.category || "user",
      attribute: tc.attribute || "",
      operator: tc.operator || "equals",
      value: tc.value ?? "",
    }));

    setConditionsState((prev) => [...prev, ...newConditions]);
  }, []);

  // Clear all conditions
  const clearConditions = useCallback(() => {
    setConditionsState([]);
  }, []);

  // Set conditions directly (for initialization)
  const setConditions = useCallback((newConditions: PolicyCondition[]) => {
    setConditionsState(newConditions);
  }, []);

  // Helper: Get available attributes for a category
  const getAvailableAttributes = useCallback((category: ConditionCategory) => {
    return getAttributesByCategory(category);
  }, []);

  // Helper: Get available operators for an attribute
  const getAvailableOperators = useCallback((attributeId: string) => {
    const attr = getAttributeById(attributeId);
    return attr ? getOperatorsForType(attr.valueType) : [];
  }, []);

  // Helper: Get translation for a condition
  const getConditionTranslation = useCallback((condition: PolicyCondition) => {
    return translateCondition(condition);
  }, []);

  // Helper: Get overall translation
  const getOverallTranslation = useCallback(() => {
    return translateConditions(conditions, logic);
  }, [conditions, logic]);

  // Helper: Validate a single condition
  const validateCondition = useCallback((condition: PolicyCondition) => {
    return validateSingleCondition(condition);
  }, []);

  // Helper: Validate all conditions
  const validateAll = useCallback(() => {
    const errors = new Map<string, string[]>();
    let isValid = true;

    for (const condition of conditions) {
      const validation = validateSingleCondition(condition);
      if (!validation.isValid) {
        isValid = false;
        errors.set(condition.id, validation.errors);
      }
    }

    return { isValid, errors };
  }, [conditions]);

  // Export as ConditionGroup
  const toConditionGroup = useCallback((): ConditionGroup => {
    return { logic, conditions };
  }, [logic, conditions]);

  return {
    // State
    conditions,
    logic,

    // Actions
    addCondition,
    removeCondition,
    updateCondition,
    updateConditionCategory,
    updateConditionAttribute,
    updateConditionOperator,
    updateConditionValue,
    setLogic,
    applyTemplate,
    clearConditions,
    setConditions,

    // Helpers
    getAvailableAttributes,
    getAvailableOperators,
    getConditionTranslation,
    getOverallTranslation,
    validateCondition,
    validateAll,

    // Export
    toConditionGroup,
  };
}
