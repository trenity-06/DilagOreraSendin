import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Modal from "../../components/Modal";
import SubmitButton from "../../components/Button/SubmitButton";
import ToastMessage from "../../components/ToastMessage/ToastMessage";
import { useToastMessage } from "../../hooks/useToastMessage";
import type { InventoryFormValues, InventoryItem } from "../../interfaces/InventoryInterface";
import type { PosSaleRecord } from "../../interfaces/PosInterface";
import InventoryService from "../../services/InventoryService";

const INVENTORY_STORAGE_KEY = "inventory-items";
const SALES_STORAGE_KEY = "pos-sales";

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

const initialSales: PosSaleRecord[] = [
  {
    id: 1,
    itemName: "Barcode Scanner",
    quantity: 12,
    amount: 420,
    date: "2026-05-18T08:15:00.000Z",
  },
  {
    id: 2,
    itemName: "Thermal Paper",
    quantity: 28,
    amount: 224,
    date: "2026-05-19T15:40:00.000Z",
  },
  {
    id: 3,
    itemName: "Receipt Printer",
    quantity: 5,
    amount: 600,
    date: "2026-05-21T10:10:00.000Z",
  },
];

const loadInitialInventoryItems = () => {
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

const loadSales = () => {
  if (typeof window === "undefined") {
    return initialSales;
  }

  try {
    const storedSales = window.localStorage.getItem(SALES_STORAGE_KEY);

    if (!storedSales) {
      return initialSales;
    }

    const parsedSales = JSON.parse(storedSales);

    return Array.isArray(parsedSales) ? parsedSales : initialSales;
  } catch {
    return initialSales;
  }
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const DashboardMainPage = () => {
  const toast = useToastMessage();

  const [items, setItems] = useState<InventoryItem[]>(() => loadInitialInventoryItems());
  const [sales] = useState<PosSaleRecord[]>(() => loadSales());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [reportText, setReportText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<InventoryFormValues>(defaultFormValues);

  useEffect(() => {
    document.title = "Inventory Dashboard";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [sales]);

  const categories = useMemo(() => {
    return ["All", ...new Set(items.map((item) => item.category))];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = `${item.name} ${item.category} ${item.supplier}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  const salesSummary = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSalesCount = sales.reduce((sum, sale) => sum + sale.quantity, 0);

    return {
      totalRevenue,
      totalSalesCount,
    };
  }, [sales]);

  const inventorySummary = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const lowStockCount = items.filter((item) => item.quantity <= item.reorderPoint).length;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalItems,
      totalValue,
      lowStockCount,
    };
  }, [items]);

  const activityLog = useMemo(() => {
    const transformed = [
      ...sales.map((sale) => ({
        timestamp: sale.date,
        type: "Sale",
        reference: sale.itemName,
        details: `${sale.quantity} units sold for ${currencyFormatter.format(sale.amount)}`,
      })),
      ...items.map((item) => ({
        timestamp: item.lastUpdated,
        type: "Inventory update",
        reference: item.name,
        details: `${item.quantity} units available • ${item.status}`,
      })),
    ];

    return transformed
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [items, sales]);

  const resetForm = () => {
    setFormValues(defaultFormValues);
    setEditingItemId(null);
    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    setFormValues(defaultFormValues);
    setEditingItemId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
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
    setIsFormOpen(true);
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(formValues.quantity);
    const reorderPoint = Number(formValues.reorderPoint);
    const unitCost = Number(formValues.unitCost);
    const unitPrice = Number(formValues.unitPrice);

    if (
      !formValues.name.trim() ||
      !formValues.category.trim() ||
      !formValues.supplier.trim() ||
      Number.isNaN(quantity) ||
      Number.isNaN(reorderPoint) ||
      Number.isNaN(unitCost) ||
      Number.isNaN(unitPrice)
    ) {
      toast.showError("Please complete all fields with valid values.");
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      category: formValues.category.trim(),
      quantity,
      reorder_point: reorderPoint,
      unit_cost: unitCost,
      unit_price: unitPrice,
      supplier: formValues.supplier.trim(),
      image: formValues.image || null,
    };

    try {
      const savedItem = editingItemId
        ? await InventoryService.updateItem(editingItemId, payload)
        : await InventoryService.createItem(payload);

      setItems((current) => {
        if (editingItemId) {
          return current.map((item) => (item.id === editingItemId ? savedItem : item));
        }

        return [savedItem, ...current];
      });

      toast.showSuccess(editingItemId ? `Updated ${savedItem.name} successfully.` : `Added ${savedItem.name} successfully.`);
      resetForm();
    } catch (error) {
      console.error("Failed to save inventory item", error);
      toast.showError("Could not save the item to the database. Please try again.");
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete ${item.name}? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      await InventoryService.deleteItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.showSuccess(`${item.name} deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete inventory item", error);
      toast.showError("Could not delete the item from the database. Please try again.");
    }
  };

  const handleGenerateReport = () => {
    const lowStockItems = items.filter((item) => item.quantity <= item.reorderPoint);
    const report = [
      `Generated report for ${new Date().toLocaleString()}`,
      `Total items in stock: ${inventorySummary.totalItems}`,
      `Total inventory value: ${currencyFormatter.format(inventorySummary.totalValue)}`,
      `Total revenue: ${currencyFormatter.format(salesSummary.totalRevenue)}`,
      `Total sales volume: ${salesSummary.totalSalesCount}`,
      `Low stock alerts: ${lowStockItems.length}`,
      lowStockItems.length > 0
        ? `Needs attention: ${lowStockItems.map((item) => item.name).join(", ")}`
        : "All items are within target stock levels.",
    ].join("\n");

    setReportText(report);
    toast.showSuccess("Report generated successfully.");
  };

  return (
    <>
      {toast.toasts.map((t, index) => (
        <ToastMessage
          key={t.id}
          id={t.id}
          message={t.message}
          isFailed={t.isFailed}
          isVisible={true}
          onClose={toast.closeToastMessage}
          index={index}
        />
      ))}

      <Modal isOpen={isFormOpen} onClose={resetForm} className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-600">
              {editingItemId ? "Edit inventory item" : "Add inventory item"}
            </p>
            <h2 className="text-xl font-semibold text-gray-900 mt-1">
              {editingItemId ? "Update stock record" : "Create a new stock record"}
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm font-medium text-gray-700">
                Item name
                <input
                  name="name"
                  value={formValues.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Category
                <select
                  name="category"
                  value={formValues.category}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Essentials">Essentials</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Frozen Foods">Frozen Foods</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">
                Quantity
                <input
                  type="number"
                  min="0"
                  name="quantity"
                  value={formValues.quantity}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Reorder point
                <input
                  type="number"
                  min="0"
                  name="reorderPoint"
                  value={formValues.reorderPoint}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Unit cost
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="unitCost"
                  value={formValues.unitCost}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Unit price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="unitPrice"
                  value={formValues.unitPrice}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <label className="text-sm font-medium text-gray-700 md:col-span-2">
                Supplier
                <input
                  name="supplier"
                  value={formValues.supplier}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>

              <div className="text-sm font-medium text-gray-700 md:col-span-2">
                <p className="mb-1">Item image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {formValues.image ? (
                  <div className="mt-3 space-y-2">
                    <img
                      src={formValues.image}
                      alt={formValues.name || "Item preview"}
                      className="h-32 w-full rounded-lg object-cover"
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
                  <p className="mt-2 text-sm text-gray-500">
                    No image selected yet. You can add one while creating or editing an item.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <SubmitButton label={editingItemId ? "Save changes" : "Add item"} />
            </div>
          </form>
        </div>
      </Modal>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase text-sky-600">Dashboard for monitoring activities</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Inventory and sales overview</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Manage digital records, track stock levels, review sales performance, and generate reports for your operations.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Add item
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Generate report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total revenue</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {currencyFormatter.format(salesSummary.totalRevenue)}
            </p>
            <p className="mt-2 text-sm text-emerald-600">Live sales visibility</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total sales</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{salesSummary.totalSalesCount}</p>
            <p className="mt-2 text-sm text-emerald-600">Units sold</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Items in stock</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{inventorySummary.totalItems}</p>
            <p className="mt-2 text-sm text-amber-600">Stock count across records</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Low stock alerts</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{inventorySummary.lowStockCount}</p>
            <p className="mt-2 text-sm text-rose-600">Needs restocking attention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase text-sky-600">Digital record management</p>
                <h2 className="text-lg font-semibold text-gray-900">Inventory records</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search items"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="All">All status</option>
                  <option value="In stock">In stock</option>
                  <option value="Low stock">Low stock</option>
                  <option value="Out of stock">Out of stock</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
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
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-6 py-2">Status</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="align-top">
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
                            <div className="font-semibold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.supplier}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">{item.category}</td>
                      <td className="px-3 py-3">{item.quantity}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                      <td className="px-3 py-3">{currencyFormatter.format(item.quantity * item.unitCost)}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-md bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-md bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                        No items matched your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold uppercase text-sky-600">Automated report generation</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">Instant summary</h2>
              <p className="mt-2 text-sm text-gray-600">
                Generate a quick inventory snapshot using the live stock and sales data in this dashboard.
              </p>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-gray-700 whitespace-pre-line">
                {reportText || "Click generate report to create a ready-to-use summary."}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold uppercase text-sky-600">Inventory or scheduling management</p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">Restock priorities</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {items
                  .filter((item) => item.quantity <= item.reorderPoint)
                  .map((item) => (
                    <li key={item.id} className="flex justify-between rounded-md bg-amber-50 px-3 py-2">
                      <span>{item.name}</span>
                      <span>{item.quantity} left</span>
                    </li>
                  ))}
                {items.filter((item) => item.quantity > item.reorderPoint).length === items.length && (
                  <li className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700">
                    All items are safely above reorder thresholds.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold uppercase text-sky-600">Dashboard for monitoring activities</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Recent activity</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activityLog.map((activity, index) => (
                  <tr key={`${activity.reference}-${activity.timestamp}-${index}`}>
                    <td className="px-3 py-3">{new Date(activity.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-3">{activity.type}</td>
                    <td className="px-3 py-3">{activity.reference}</td>
                    <td className="px-3 py-3 text-gray-700">{activity.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardMainPage;

