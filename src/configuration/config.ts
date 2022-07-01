import { GeneralCategory } from "./category/general_category";
import { StorageCategory } from "./category/storage_category";

export interface Config {

  general: GeneralCategory;

  storage: StorageCategory;
}