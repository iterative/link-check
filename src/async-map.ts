export default async function asyncMap<I, O = I>(
  collection: I[],
  iteratee: (input: I, idx?: number) => Promise<O> | O
): Promise<O[]> {
  return Promise.all(collection.map(iteratee));
}
