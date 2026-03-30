import styles from "../Details/Details.module.css";

export default function FieldEditor({
  fieldName,
  label,
  currentValue,
  type = "text",
  placeholder,
  validator,
  updateFunction,
  emptyMessage = "No value set",
  isEditing,
  fieldValue,
  validationError,
  saving,
  disabled,
  onEdit,
  onCancel,
  onSave,
  onValueChange,
}) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSave(fieldName, validator, updateFunction);
    } else if (e.key === "Escape") {
      onCancel(fieldName);
    }
  };

  return (
    <div className={styles.fieldEditor}>
      <label className={styles.fieldEditorLabel}>{label}</label>

      {!isEditing ? (
        <div className={styles.fieldDisplay}>
          <span className={styles.fieldDisplayValue}>
            {currentValue || emptyMessage}
          </span>
          <button
            onClick={() => onEdit(fieldName)}
            disabled={disabled}
            className={styles.fieldEditButton}
          >
            Edit
          </button>
        </div>
      ) : (
        <div className={styles.fieldEditContainer}>
          <input
            type={type}
            value={fieldValue || ""}
            onChange={(e) => onValueChange(fieldName, e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className={`${styles.fieldInput} ${
              validationError ? styles.error : ""
            }`}
            disabled={saving}
            autoFocus
          />

          {validationError && (
            <p className={styles.fieldValidationError}>{validationError}</p>
          )}

          <div className={styles.fieldButtonContainer}>
            <button
              onClick={() => onSave(fieldName, validator, updateFunction)}
              disabled={saving}
              className={styles.fieldSaveButton}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => onCancel(fieldName)}
              disabled={saving}
              className={styles.fieldCancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
