import { Badge } from '../common/Badge';

export function MovementTypeBadge({ type }) {
  return type === 'IN' ? (
    <Badge tone="success">Stock IN</Badge>
  ) : (
    <Badge tone="danger">Stock OUT</Badge>
  );
}
