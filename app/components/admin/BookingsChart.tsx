import { format, parseISO } from 'date-fns'

type Point = { date: string; count: number }

// Single-series CSS bar chart: one hue (#1F9C86 passes 3:1 on white), 4px rounded data ends on
// a shared baseline, 2px gaps, hover/focus tooltip per bar, and a table view for screen readers.
export function BookingsChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  const label = (d: Point) => `${format(parseISO(d.date), 'EEE d MMM')}: ${d.count} booking${d.count === 1 ? '' : 's'}`

  return (
    <figure className="rounded-xl border border-grey-100 bg-white p-5">
      <figcaption className="mb-4 flex items-baseline justify-between">
        <span className="text-lg text-navy">Bookings per day</span>
        <span className="text-sm text-grey-500">
          Last {data.length} days · {total} total
        </span>
      </figcaption>

      <div className="relative h-40" aria-hidden>
        {/* Recessive scale: the top line marks the busiest day's count. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-grey-100" />
        <span className="absolute -top-2 right-0 bg-white pl-1 text-[10px] text-grey-500">{max}</span>
        <div className="absolute inset-x-0 bottom-0 border-t border-grey-300" />
        <div className="absolute inset-0 flex items-end gap-[2px] pr-5">
          {data.map((d) => (
            <div key={d.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none" aria-label={label(d)}>
              <div className="w-full rounded-t-[4px] bg-[#1F9C86] transition-opacity group-hover:opacity-80 group-focus:opacity-80" style={{ height: `${(d.count / max) * 100}%` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-xs text-white shadow group-hover:block group-focus:block">
                {label(d)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between pr-5 text-[11px] text-grey-500" aria-hidden>
        <span>{format(parseISO(data[0].date), 'd MMM')}</span>
        <span>{format(parseISO(data[Math.floor(data.length / 2)].date), 'd MMM')}</span>
        <span>{format(parseISO(data[data.length - 1].date), 'd MMM')}</span>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-grey-500 hover:text-navy">Show as table</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-grey-500">
            <tr>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 text-right font-medium">Bookings</th>
            </tr>
          </thead>
          <tbody className="text-navy">
            {data.map((d) => (
              <tr key={d.date}>
                <td className="py-0.5">{format(parseISO(d.date), 'EEE d MMM')}</td>
                <td className="py-0.5 text-right">{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
