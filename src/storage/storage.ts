import { Query } from "./query";

export interface Storage {

  connectAsync(): Promise<void>;

  closeAsync(): Promise<void>;

  getQuery(): Query;
}