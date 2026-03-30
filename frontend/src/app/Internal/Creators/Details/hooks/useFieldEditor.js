import { useState } from "react";

export const useFieldEditor = (initialData, onUpdate) => {
  const [editingField, setEditingField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Handle editing
  const handleEdit = (fieldName) => {
    setEditingField(fieldName);
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: initialData[fieldName] || "",
    }));
    setValidationErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  // Handle canceling
  const handleCancel = (fieldName) => {
    setEditingField(null);
    setFieldValues((prev) => ({ ...prev, [fieldName]: "" }));
    setValidationErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  // Handle value change
  const handleValueChange = (fieldName, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    setValidationErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  // Handle saving
  const handleSave = async (fieldName, validator, updateFunction) => {
    const value = fieldValues[fieldName];
    const validationError = validator ? validator(value) : null;

    if (validationError) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: validationError,
      }));
      return;
    }

    setSaving(true);
    try {
      const response = await updateFunction(initialData.id, fieldName, value);
      if (response.status === 200) {
        if (onUpdate) {
          onUpdate({ ...initialData, [fieldName]: value });
        }
        setEditingField(null);
        setFieldValues((prev) => ({ ...prev, [fieldName]: "" }));
        setValidationErrors((prev) => ({ ...prev, [fieldName]: null }));
      } else {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldName]: "Failed to update field",
        }));
      }
    } catch (err) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldName]: "Error updating field",
      }));
    } finally {
      setSaving(false);
    }
  };

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  // Validate name
  const validateName = (name) => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (name.length > 50) return "Name must be less than 50 characters long";
    return null;
  };

  return {
    editingField,
    fieldValues,
    validationErrors,
    saving,
    handleEdit,
    handleCancel,
    handleValueChange,
    handleSave,
    validateEmail,
    validateName,
  };
};
