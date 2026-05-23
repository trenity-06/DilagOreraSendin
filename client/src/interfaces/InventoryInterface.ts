export type InventoryStatus = "In stock" | "Low stock" | "Out of stock";

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  reorderPoint: number;
  unitCost: number;
  unitPrice: number;
  status: InventoryStatus;
  supplier: string;
  lastUpdated: string;
}

export interface InventoryFormValues {
  name: string;
  category: string;
  quantity: string;
  reorderPoint: string;
  unitCost: string;
  unitPrice: string;
  supplier: string;
}

export interface InventoryTransaction {
  transactionId: number;
  itemId: number;
  transactionType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleId?: number;
  reference?: string;
  createdBy?: number;
  createdAt: string;
}

export interface InventoryApiItem {
  item_id: number;
  name: string;
  category: string;
  sku?: string;
  unit?: string;
  current_stock: number;
  purchase_cost: number;
  sell_price: number;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryApiTransaction {
  transaction_id: number;
  item_id: number;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_id?: number;
  reference?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryApiResponse<T> {
  message: string;
  data: T;
}

export interface InventoryApiListResponse<T> {
  message: string;
  data: T[];
}
