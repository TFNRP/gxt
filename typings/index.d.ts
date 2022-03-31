declare type HashLike = number | string;

declare function GXT2(data: Buffer | string): GXT2;

declare class GXT2 {
  constructor(data: Buffer | string);

  buffer: Buffer;

  get size(): number;

  has(hash: HashLike): boolean;

  get(hash: HashLike): string;

  set(hash: HashLike, description: string): this;

  delete(hash: HashLike): boolean;

  keyAt(index?: number): number;

  at(index?: number): string;

  first(): string;
  first(amount: number): string[];

  firstKey(): number;
  firstKey(amount: number): number[];

  last(): string;
  last(amount: number): string[];

  lastKey(): number;
  lastKey(amount: number): number[];

  entries(): IterableIterator<[number, string]>;

  values(): IterableIterator<string>;

  keys(): IterableIterator<number>;

  forEach(callbackFn: (hash: number, description: string, gxt2: this) => any, thisArg: any): void;

  toJSON(): { [k: string]: string };

  [Symbol.iterator]: IterableIterator<[number, string]>;
}