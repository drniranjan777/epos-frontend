import { TRANSFER_STATUS } from '../../constants/app';
import { Badge } from '../common/Badge';

export function TransferStatusBadge({ status }) {
  const meta = TRANSFER_STATUS[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
