import { INVOICE_STATUS } from '../../constants/app';
import { Badge } from '../common/Badge';

export function StatusBadge({ status }) {
  const meta = INVOICE_STATUS[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
