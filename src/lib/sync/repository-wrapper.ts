import type { Repositories } from '@/db/repositories'

const mutationMethods: Readonly<Record<string, ReadonlySet<string>>> = {
  wallets: new Set(['create', 'update', 'softDelete']),
  categories: new Set(['create', 'update', 'softDelete']),
  channels: new Set(['create', 'update', 'softDelete']),
  products: new Set(['create', 'update', 'softDelete']),
  budgets: new Set(['create', 'update', 'softDelete']),
  recurring: new Set(['create', 'update', 'softDelete', 'generateDue']),
  transactions: new Set(['create', 'update', 'softDelete']),
}

interface ResultLike {
  ok: boolean
}

export function wrapRepositoriesForSync(repositories: Repositories, schedule: () => void): Repositories {
  const wrapped: Record<string, unknown> = {}
  for (const [name, repository] of Object.entries(repositories)) {
    const methods = mutationMethods[name]
    if (!methods) {
      wrapped[name] = repository
      continue
    }
    wrapped[name] = new Proxy(repository, {
      get(target, property, receiver) {
        const original = Reflect.get(target, property, receiver)
        if (typeof property !== 'string' || !methods.has(property) || typeof original !== 'function') return original
        return (...args: unknown[]) => {
          const result = Reflect.apply(original as CallableFunction, target, args)
          return Promise.resolve(result).then((value: unknown) => {
            if (isSuccessfulResult(value)) schedule()
            return value
          })
        }
      },
    })
  }
  return wrapped as unknown as Repositories
}

function isSuccessfulResult(value: unknown): value is ResultLike {
  return typeof value === 'object' && value !== null && 'ok' in value && value.ok === true
}
