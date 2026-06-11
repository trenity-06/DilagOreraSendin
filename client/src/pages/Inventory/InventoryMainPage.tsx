import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { InventoryFormValues, InventoryItem } from "../../interfaces/InventoryInterface";
import InventoryService from "../../services/InventoryService";

const INVENTORY_STORAGE_KEY = "inventory-items";

const defaultFormValues: InventoryFormValues = {
  name: "",
  category: "Electronics",
  quantity: "10",
  reorderPoint: "5",
  unitCost: "15",
  unitPrice: "24",
  supplier: "North Star Supply",
  image: "",
};

const loadInitialItems = () => {
  if (typeof window === "undefined") {
    return [] as InventoryItem[];
  }

  try {
    const storedItems = window.localStorage.getItem(INVENTORY_STORAGE_KEY);

    if (!storedItems) {
      return [] as InventoryItem[];
    }

    const parsedItems = JSON.parse(storedItems);

    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [] as InventoryItem[];
  }
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const getStatus = (
  quantity: number,
  reorderPoint: number
): InventoryItem["status"] => {
  if (quantity <= 0) {
    return "Out of stock";
  }

  if (quantity <= reorderPoint) {
    return "Low stock";
  }

  return "In stock";
};

const InventoryMainPage = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => loadInitialItems());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [formValues, setFormValues] = useState<InventoryFormValues>(defaultFormValues);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Inventory";
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const serverItems = await InventoryService.loadItems();
        setItems(serverItems);
      } catch {
        if (typeof window !== "undefined") {
          const storedItems = window.localStorage.getItem(INVENTORY_STORAGE_KEY);
          if (storedItems) {
            try {
              const parsedItems = JSON.parse(storedItems);
              if (Array.isArray(parsedItems)) {
                setItems(parsedItems);
              }
            } catch {
              setItems([]);
            }
          }
        }
      }
    };

    void loadItems();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items]);

  const categories = useMemo(() => {
    return ["All", ...new Set(items.map((item) => item.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = `${item.name} ${item.category} ${item.supplier}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  const inventorySummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = items.filter((item) => item.status === "Low stock").length;
    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    return {
      totalItems,
      lowStockCount,
      totalValue,
    };
  }, [items]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setEditingItemId(null);
    setFormValues(defaultFormValues);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormValues({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      reorderPoint: String(item.reorderPoint),
      unitCost: String(item.unitCost),
      unitPrice: String(item.unitPrice),
      supplier: item.supplier,
      image: item.image ?? "",
    });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      setFormValues((current) => ({
        ...current,
        image: result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormValues((current) => ({
      ...current,
      image: "",
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedValues = {
      quantity: Number(formValues.quantity),
      reorderPoint: Number(formValues.reorderPoint),
      unitCost: Number(formValues.unitCost),
      unitPrice: Number(formValues.unitPrice),
    };

    const payload = {
      name: formValues.name,
      category: formValues.category,
      quantity: parsedValues.quantity,
      reorder_point: parsedValues.reorderPoint,
      unit_cost: parsedValues.unitCost,
      unit_price: parsedValues.unitPrice,
      supplier: formValues.supplier,
      image: formValues.image || null,
    };

    try {
      const savedItem = editingItemId
        ? await InventoryService.updateItem(editingItemId, payload)
        : await InventoryService.createItem(payload);

      setItems((current) => {
        if (editingItemId) {
          return current.map((item) =>
            item.id === editingItemId ? savedItem : item
          );
        }

        return [savedItem, ...current];
      });

      resetForm();
    } catch (error) {
      console.error("Failed to save inventory item", error);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await InventoryService.deleteItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));

      if (editingItemId === itemId) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete inventory item", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
              Inventory management
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Manage stock, pricing, and reorder alerts
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Track your inventory records, add new stock items, and quickly review
              low-stock products from one place.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {filteredItems.length} items shown
            </p>
            <p className="mt-1">Live data is stored locally in the browser.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Total items in stock</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {inventorySummary.totalItems}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Low stock alerts</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {inventorySummary.lowStockCount}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Inventory value</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {currencyFormatter.format(inventorySummary.totalValue)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Inventory records</h2>
              <p className="text-sm text-slate-500">
                Search, filter, and review current stock levels.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search inventory"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                <option value="All">All status</option>
                <option value="In stock">In stock</option>
                <option value="Low stock">Low stock</option>
                <option value="Out of stock">Out of stock</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Reorder</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                            IMG
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{item.category}</td>
                    <td className="px-3 py-3">{item.quantity}</td>
                    <td className="px-3 py-3">{item.reorderPoint}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === "In stock"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "Low stock"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">{item.supplier}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingItemId ? "Edit inventory item" : "Add inventory item"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {editingItemId
              ? "Update the selected item and keep your records current."
              : "Create a local inventory record for your store."}
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Item name
              </label>
              <input
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                name="category"
                value={formValues.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              >
                <option>Electronics</option>
                <option>Hardware</option>
                <option>Supplies</option>
                <option>Essentials</option>
                <option>Snacks</option>
                <option>Beverages</option>
                <option>Frozen Foods</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Quantity
                </label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={formValues.quantity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Reorder point
                </label>
                <input
                  name="reorderPoint"
                  type="number"
                  min="0"
                  value={formValues.reorderPoint}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Unit cost
                </label>
                <input
                  name="unitCost"
                  type="number"
                  min="0"
                  value={formValues.unitCost}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Unit price
                </label>
                <input
                  name="unitPrice"
                  type="number"
                  min="0"
                  value={formValues.unitPrice}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Supplier
              </label>
              <input
                name="supplier"
                value={formValues.supplier}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Item image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
              />
              {formValues.image ? (
                <div className="mt-2 space-y-2">
                  <img
                    src={formValues.image}
                    alt={formValues.name || "Item preview"}
                    className="h-28 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-sm font-semibold text-rose-600"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No image selected yet. You can add one when creating or editing an item.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {editingItemId ? "Update item" : "Add item"}
            </button>
            {editingItemId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default InventoryMainPage;
