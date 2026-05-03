export type ScannerFile = {
  readonly path: string;
  readonly size: number;
  readonly content?: string;
};

export type FilteredFile = ScannerFile & {
  readonly score: number;
};
