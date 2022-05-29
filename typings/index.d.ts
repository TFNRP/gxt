declare type HashLike = number | string;

declare function GXT2(data?: Buffer | string): GXT2;
declare function FXT(data?: Buffer | string): FXT;

declare class GXT2 {
  constructor(data?: Buffer | string);
  private get _dataBlockAt(): number;
  private get _eofOffsetByte(): number;
  private _isValid(): boolean;
  private _findNullTerminator(start: number): number;
  private _sliceData(start: number): Buffer;
  buffer: Buffer;
  get size(): number;
  has(hash: HashLike): boolean;
  get(hash: HashLike): string;
  set(hash: HashLike, description: string): this;
  clear(): void;
  delete(hash: HashLike): boolean;
  concat(...tables: GXT2): this;
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

declare class FXT {
  constructor(data?: Buffer | string);
  private _map: Map<string, string>;
  get size(): number;
  has(key: string): boolean;
  get(key: string): string;
  set(key: string, value: string): this;
  clear(key: string): void;
  delete(key: string): boolean;
  entries(): IterableIterator<[string, string]>;
  values(): IterableIterator<string>;
  keys(): IterableIterator<string>;
  forEach(callbackFn: (key: string, value: string, fxt: this) => any, thisArg: any): void;
  toJSON(): { [k: string]: string };
  [Symbol.iterator]: IterableIterator<[string, string]>;
}