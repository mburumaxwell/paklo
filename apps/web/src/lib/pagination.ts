export const MAX_TAKE = 100;
export const DEFAULT_TAKE = 20;

type TakeOutput = {
  /** The actual number of items to return to the user */
  value: number;
  /** The number of items to request from the database (one more than value to check for more items) */
  db: number;
};

/**
 * Determines the take values for pagination.
 * @param take The desired number of items to take.
 */
export function getTake(take?: number): TakeOutput {
  const value = Math.min(take || DEFAULT_TAKE, MAX_TAKE);
  return { value: value, db: value + 1 };
}

export type PaginatedData<T> = {
  /** The items for the current page */
  items: T[];
  /** Whether there are more items available beyond the current page */
  hasMore: boolean;
};

/**
 * Slices the data to fit within the pagination limits and determines if more data is available.
 * @param data The full array of data items.
 * @param take The take output determining how many items to return.
 */
export function getPaginatedData<T>(data: T[], take: TakeOutput): PaginatedData<T> {
  return {
    items: data.slice(0, take.value),
    hasMore: data.length > take.value,
  };
}
