import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { InventoryItem } from "../../interfaces/InventoryInterface";
import type { PosSaleRecord } from "../../interfaces/PosInterface";

const SALES_STORAGE_KEY = "pos-sales";

const initialInventory: InventoryItem[] = [
  {
    id: 1,
    name: "Barcode Scanner",
    category: "Electronics",
    quantity: 24,
    reorderPoint: 8,
    unitCost: 18,
    unitPrice: 35,
    status: "In stock",
    supplier: "North Star Supply",
    lastUpdated: "2026-05-20T09:00:00.000Z",
  },
  {
    id: 2,
    name: "Receipt Printer",
    category: "Hardware",
    quantity: 3,
    reorderPoint: 5,
    unitCost: 70,
    unitPrice: 120,
    status: "Low stock",
    supplier: "Precision Parts",
    lastUpdated: "2026-05-21T10:30:00.000Z",
  },
  {
    id: 3,
    name: "POS Terminal",
    category: "Electronics",
    quantity: 0,
    reorderPoint: 2,
    unitCost: 190,
    unitPrice: 280,
    status: "Out of stock",
    supplier: "Apex Devices",
    lastUpdated: "2026-05-22T11:45:00.000Z",
  },
  {
    id: 4,
    name: "Thermal Paper",
    category: "Supplies",
    quantity: 42,
    reorderPoint: 12,
    unitCost: 4,
    unitPrice: 8,
    status: "In stock",
    supplier: "Office Hub",
    lastUpdated: "2026-05-23T13:20:00.000Z",
  },
];

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

const POSMainPage = () => {
  const [customerName, setCustomerName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number>(initialInventory[0].id);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<
    { itemId: number; name: string; quantity: number; unitPrice: number }[]
  >([]);
  const [sales, setSales] = useState<PosSaleRecord[]>(() => loadSales());

  useEffect(() => {
    document.title = "POS";
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [sales]);

  const activeItem = useMemo(() => {
    return initialInventory.find((item) => item.id === selectedItemId) ?? initialInventory[0];
  }, [selectedItemId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity * entry.unitPrice, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, entry) => sum + entry.quantity, 0);
  }, [cart]);

  const handleAddToCart = () => {
    if (!activeItem || quantity <= 0) {
      return;
    }

    setCart((current) => {
      const existing = current.find((entry) => entry.itemId === activeItem.id);

      if (existing) {
        return current.map((entry) =>
          entry.itemId === activeItem.id
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }

      return [
        ...current,
        {
          itemId: activeItem.id,
          name: activeItem.name,
          quantity,
          unitPrice: activeItem.unitPrice,
        },
      ];
    });

    setQuantity(1);
  };

  const handleCartQuantityChange = (itemId: number, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    setCart((current) =>
      current.map((entry) =>
        entry.itemId === itemId
          ? { ...entry, quantity: nextQuantity }
          : entry
      )
    );
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart((current) => current.filter((entry) => entry.itemId !== itemId));
  };

  const handleDeleteSale = (saleId: number) => {
    setSales((current) => current.filter((sale) => sale.id !== saleId));
  };

  const handleCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cart.length) {
      return;
    }

    const latestSale = cart.map((entry) => ({
      id: Date.now() + entry.itemId,
      itemName: entry.name,
      quantity: entry.quantity,
      amount: entry.quantity * entry.unitPrice,
      date: new Date().toISOString(),
    }));

    setSales((current) => [...latestSale, ...current]);
    setCart([]);
    setCustomerName("");
  };

  const handleItemChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedItemId(Number(event.target.value));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Point of sale
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Sell quickly and keep a live record of recent transactions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Select an item, add it to the cart, and complete a checkout using the latest
          local sales data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Cart items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cartCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Cart total</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {currencyFormatter.format(cartTotal)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Recent sales</p>
          <p className="mt-2 text-2xl font-bold text-sky-600">{sales.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Add to cart</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Item
              </label>
              <select
                value={selectedItemId}
                onChange={handleItemChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                {initialInventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {currencyFormatter.format(item.unitPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{activeItem.name}</p>
              <p className="mt-1">Price: {currencyFormatter.format(activeItem.unitPrice)}</p>
              <p className="mt-1">Available stock: {activeItem.quantity}</p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Add to cart
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Checkout</h2>
          <form onSubmit={handleCheckout} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Customer name
              </label>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Walk-in customer"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((entry) => (
                    <tr key={entry.itemId} className="text-slate-700">
                      <td className="px-3 py-3 font-semibold">{entry.name}</td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="1"
                          value={entry.quantity}
                          onChange={(event) =>
                            handleCartQuantityChange(
                              entry.itemId,
                              Number(event.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                        />
                      </td>
                      <td className="px-3 py-3">{currencyFormatter.format(entry.unitPrice)}</td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(entry.itemId)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{currencyFormatter.format(cartTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Complete sale
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent sales</h2>
            <p className="text-sm text-slate-500">
              Your latest POS activity is shown below.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="text-slate-700">
                  <td className="px-3 py-3 font-semibold">{sale.itemName}</td>
                  <td className="px-3 py-3">{sale.quantity}</td>
                  <td className="px-3 py-3">{currencyFormatter.format(sale.amount)}</td>
                  <td className="px-3 py-3">
                    {new Date(sale.date).toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default POSMainPage;
