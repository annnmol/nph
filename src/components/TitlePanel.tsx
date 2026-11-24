import { useState } from 'react'
import { useEpisodes, useTitle } from '../hooks/use-catalog.ts'
import { RequestError } from './RequestError.tsx'

export function TitlePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const title = useTitle(id)
  const [season, setSeason] = useState('')
  const episodes = useEpisodes(id, season)
  const items = season ? episodes.data?.pages.flatMap((page) => page.items) : title.data?.episodes

  return (
    <section aria-label="Title details" className="my-6 rounded-lg border border-neutral-200 p-5">
      <button onClick={onClose} className="mb-4 text-sm text-blue-600 hover:underline">← Back to catalog</button>
      {title.isPending && <p role="status">Loading title…</p>}
      {title.error && <RequestError error={title.error} onRetry={() => { void title.refetch() }} />}
      {title.data && <>
        <h2 className="text-xl font-medium">{title.data.title} <span className="text-sm text-neutral-500">{title.data.year}</span></h2>
        <p className="my-3 text-sm leading-6 text-neutral-600">{title.data.description}</p>
        {!!title.data.seasons.length && <label className="my-4 block text-sm">
          Season
          <select className="ml-3 rounded border border-neutral-300 p-2" value={season} onChange={(event) => setSeason(event.target.value)}>
            <option value="">Current episodes</option>
            {title.data.seasons.map((item) => <option key={item.id} value={item.id}>Season {item.number} ({item.episodes} episodes)</option>)}
          </select>
        </label>}
        {season && episodes.isPending && <p role="status">Loading episodes…</p>}
        {season && episodes.error && <RequestError error={episodes.error} onRetry={() => { void episodes.refetch() }} />}
        <ul className="divide-y divide-neutral-100">
          {items?.map((item) => <li key={item.id} className="py-3 text-sm">
            <span className="mr-2 text-neutral-500">{item.season} {item.number}</span>
            {item.title}<span className="ml-2 text-neutral-500">{item.duration}</span>
          </li>)}
        </ul>
        {season && episodes.hasNextPage && <button className="action mt-3" disabled={episodes.isFetchingNextPage} onClick={() => { void episodes.fetchNextPage() }}>
          {episodes.isFetchingNextPage ? 'Loading…' : 'More episodes'}
        </button>}
      </>}
    </section>
  )
}
