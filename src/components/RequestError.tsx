import { errorMessage } from '../utilities/error-message.ts'

export function RequestError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="my-4 text-sm text-red-700">
      <p>{errorMessage(error)}</p>
      {onRetry && <button className="mt-2 underline" onClick={onRetry}>Try again</button>}
    </div>
  )
}
