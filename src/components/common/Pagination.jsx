import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ meta, onPageChange, isFetching }) {
  if (!meta || meta.totalPages <= 1) {
    return meta?.total ? (
      <p className="px-4 py-3 text-center text-sm text-slate-500">{meta.total} records</p>
    ) : null;
  }
  const { page, totalPages, total } = meta;
  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3" aria-label="Pagination">
      <Button
        variant="secondary"
        size="icon"
        disabled={page <= 1 || isFetching}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-5" />
      </Button>
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold">{page}</span> of {totalPages}
        <span className="hidden sm:inline"> · {total} records</span>
      </p>
      <Button
        variant="secondary"
        size="icon"
        disabled={page >= totalPages || isFetching}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-5" />
      </Button>
    </nav>
  );
}
