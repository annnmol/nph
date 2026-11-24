import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCatalog, useCatalogSearch } from '../hooks/use-catalog.ts'
import { RequestError } from '../components/RequestError.tsx'
import { TitleList } from '../components/TitleList.tsx'
import { TitlePanel } from '../components/TitlePanel.tsx'

const providerNames = { netflix: 'Netflix', primevideo: 'Prime Video', jiohotstar: 'JioHotstar' }

export function HomePage() {
  const catalog = useCatalog()
  const [input, setInput] = useState('')
  const [all, setAll] = useState(false)
  const [search, setSearch] = useState({ query: '', all: false })
  const [selected, setSelected] = useState<string | null>(null)
  const results = useCatalogSearch(search.query, search.all)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSelected(null)
    setSearch({ query: input.trim(), all })
  }

  return (
    <>
      <form onSubmit={submit} className="my-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input aria-label="Search titles" className="min-w-40 flex-1 rounded border border-neutral-300 px-3 py-2 text-sm" placeholder="Search titles" maxLength={120} value={input} onChange={(event) => setInput(event.target.value)} />
          <button className="action" type="submit">Search</button>
          {search.query && <button className="action" type="button" onClick={() => { setInput(''); setSearch({ query: '', all }); setSelected(null) }}>Clear</button>}
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={all} onChange={(event) => setAll(event.target.checked)} />All OTT in one search</label>
      </form>
      {selected && <TitlePanel key={selected} id={selected} onClose={() => setSelected(null)} />}
      {search.query ? <>
        <h2 className="text-lg font-medium">Results for “{search.query}”</h2>
        {results.isPending && <p role="status" className="my-4 text-sm">Searching…</p>}
        {results.error && <RequestError error={results.error} onRetry={() => { void results.refetch() }} />}
        {results.data?.groups.map((group) => <section key={group.provider} className="my-5">
          <h3 className="mb-2 text-sm font-medium">{providerNames[group.provider]}</h3>
          {group.items.length ? <TitleList items={group.items} onSelect={setSelected} /> : <p className="text-sm text-neutral-500">No matching titles.</p>}
        </section>)}
      </> : <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Catalog</h2>
          <button className="text-sm text-blue-600 disabled:opacity-50" disabled={catalog.isFetching} onClick={() => { void catalog.refetch() }}>Refresh</button>
        </div>
        {catalog.isPending && <p role="status" className="my-4 text-sm">Loading catalog…</p>}
        {catalog.error && <RequestError error={catalog.error} onRetry={() => { void catalog.refetch() }} />}
        {catalog.data?.rows.map((row, index) => <section className="my-6" key={`${index}-${row.title}`}>
          <h3 className="mb-2 text-sm font-medium">{row.title}</h3>
          <TitleList items={row.items} onSelect={setSelected} />
        </section>)}
      </>}
    </>
  )
}
