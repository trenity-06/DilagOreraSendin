import AxiosInstance from "./AxiosInstance";
import type { InventoryItem } from "../interfaces/InventoryInterface";

const buildStatus = (quantity: number, reorderPoint: number): InventoryItem["status"] => {
  if (quantity <= 0) {
    return "Out of stock";
  }

  if (quantity <= reorderPoint) {
    return "Low stock";
  }

  return "In stock";
};

const normalizeInventoryItem = (item: any): InventoryItem => {
  const quantity = Number(item.quantity ?? item.current_stock ?? 0);
  const reorderPoint = Number(item.reorder_point ?? item.reorderPoint ?? 0);

  return {
    id: Number(item.item_id ?? item.id),
    name: item.name ?? "",
    category: item.category ?? "",
    quantity,
    reorderPoint,
    unitCost: Number(item.unit_cost ?? item.purchase_cost ?? item.unitCost ?? 0),
    unitPrice: Number(item.unit_price ?? item.sell_price ?? item.unitPrice ?? 0),
    status: buildStatus(quantity, reorderPoint),
    supplier: item.supplier ?? "",
    lastUpdated: item.last_updated ?? item.updated_at ?? item.created_at ?? new Date().toISOString(),
    image: item.image ?? null,
  };
};

export const InventoryService = {
  async loadItems(): Promise<InventoryItem[]> {
    const response = await AxiosInstance.get("/inventory");
    const items = Array.isArray(response.data?.items) ? response.data.items : [];

    return items.map(normalizeInventoryItem);
  },

  async createItem(payload: Record<string, unknown>): Promise<InventoryItem> {
    const response = await AxiosInstance.post("/inventory", payload);

    return normalizeInventoryItem(response.data?.item);
  },

  async updateItem(itemId: number, payload: Record<string, unknown>): Promise<InventoryItem> {
    const response = await AxiosInstance.put(`/inventory/${itemId}`, payload);

    return normalizeInventoryItem(response.data?.item);
  },

  async deleteItem(itemId: number): Promise<void> {
    await AxiosInstance.delete(`/inventory/${itemId}`);
  },
};

export default InventoryService;
