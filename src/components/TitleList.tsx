import type { CatalogTitle } from '../types/api.ts'

export function TitleList({ items, onSelect }: { items: CatalogTitle[]; onSelect: (id: string) => void }) {
  return (
    <ul className="divide-y divide-neutral-100">
      {items.map((item) => (
        <li key={`${item.provider}-${item.id}`}>
          {item.provider === 'netflix'
            ? <button className="w-full py-2 text-left text-sm text-blue-600 hover:underline" onClick={() => onSelect(item.id)}>{item.title}</button>
            : <p className="py-2 text-sm text-neutral-600">{item.title} <span className="text-xs">(availability only)</span></p>}
        </li>
      ))}
    </ul>
  )
}
