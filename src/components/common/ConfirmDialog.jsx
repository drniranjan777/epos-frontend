import { Button } from './Button';
import { Sheet } from './Sheet';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading,
  onConfirm,
  onClose,
  children,
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={variant} fullWidth onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="text-slate-600">{message}</p>}
      {children}
    </Sheet>
  );
}
