export type StoreConfig = {
  state?: any;
  actions?: Record<string, Function>;
  options?: Record<string, any>;
  autoReset?: boolean;
  id?: string;
};
