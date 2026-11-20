import { PaginationMeta } from './api-response.interface';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

/** Puerto genérico de persistencia (DIP): los services dependen de esto, no de TypeORM. */
export interface IRepository<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  findAll(pagination: PaginationParams): Promise<Paginated<T>>;
  findById(id: number): Promise<T | null>;
  create(data: CreateData): Promise<T>;
  update(id: number, data: UpdateData): Promise<T>;
  delete(id: number): Promise<void>;
}

export function buildMeta(total: number, { page, limit }: PaginationParams): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
