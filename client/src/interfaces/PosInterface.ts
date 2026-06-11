export interface PosSaleRecord {
  id: number;
  itemName: string;
  quantity: number;
  amount: number;
  date: string;
}

export interface PosLineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PosProofOfSale {
  proofId: number;
  saleId: number;
  filePath: string;
  fileName: string;
  mimeType: string;
  uploadedBy?: number;
}

export interface PosSale {
  id: number;
  customerName?: string;
  createdBy?: number;
  totalAmount: number;
  soldAt: string;
  lineItems: PosLineItem[];
  proofOfSale?: PosProofOfSale[];
}

export interface PosSaleApiLineItemSummary {
  item_name: string;
  quantity: number;
  unit_price?: number;
  line_total?: number;
}

export interface PosSaleApiResponse {
  sale_id: number;
  created_by?: number;
  customer_name?: string;
  total_amount: number;
  sold_at: string;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;

  // POS listSales enrichment
  items_count?: number;
  line_items?: PosSaleApiLineItemSummary[];
}


export interface PosProofOfSaleApiResponse {
  proof_id: number;
  sale_id: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  uploaded_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PosSaleDetailsApiResponse {
  sale: PosSaleApiResponse;
  line_items: PosLineItem[];
  proof_of_sale?: PosProofOfSaleApiResponse[];
}

export interface PosApiResponse<T> {
  message: string;
  data: T;
}

export interface PosApiListResponse<T> {
  message: string;
  data: T[];
}
