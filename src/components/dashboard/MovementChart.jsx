import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompact, formatDate, formatNumber } from '../../utils/format';

const COLORS = { in: '#047857', out: '#b91c1c' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function periodLabel(period, range) {
  const [, m, d] = period.split('-');
  if (range === 'monthly') return MONTHS[Number(m) - 1];
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}

/** IN vs OUT quantities per day, week or month. */
export function MovementChart({ data, range }) {
  const rows = data.map((row) => ({
    ...row,
    label: periodLabel(row.period, range),
    stockIn: Number(row.stockIn),
    stockOut: Number(row.stockOut),
  }));

  return (
    <div className="h-64 w-full" role="img" aria-label="Stock IN versus OUT chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={formatCompact}
            width={48}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            formatter={(value, name) => [formatNumber(value), name]}
            labelFormatter={(_, payload) => {
              const period = payload?.[0]?.payload?.period;
              if (!period) return '';
              return range === 'daily'
                ? formatDate(period)
                : `${range === 'weekly' ? 'Week of' : 'Month of'} ${formatDate(period)}`;
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="stockIn" name="IN" fill={COLORS.in} radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar
            dataKey="stockOut"
            name="OUT"
            fill={COLORS.out}
            radius={[3, 3, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
