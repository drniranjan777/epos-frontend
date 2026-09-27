import { stockStatus } from '../../utils/stock';
import { Badge } from '../common/Badge';

export function StockBadge({ product }) {
  const status = stockStatus(product);
  if (status === 'out') return <Badge tone="danger">Out of stock</Badge>;
  if (status === 'low') return <Badge tone="warning">Low stock</Badge>;
  return null;
}
