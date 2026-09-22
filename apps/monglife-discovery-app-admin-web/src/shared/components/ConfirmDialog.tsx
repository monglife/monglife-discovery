import { Button, Dialog } from '@/shared/ui';
import { ErrorBanner } from '@/shared/components/ErrorBanner';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  /**
   * 확인이 실패했을 때 서버가 준 문구. 넘기면 배너로 띄우고 창은 열어 둔다.
   *
   * 없으면 실패가 소리 없이 묻힌다 - 창이 그대로 열려 있으니 사용자는 아직 안 눌린 줄 알고
   * 다시 누른다. 목록이 낡아 생기는 409 가 특히 그렇다.
   */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  danger,
  loading,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <ErrorBanner message={error} />
    </Dialog>
  );
}
