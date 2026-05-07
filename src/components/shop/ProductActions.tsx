"use client";

import { useState } from "react";
import QuantitySelector from "@/components/shop/QuantitySelector";
import AddToCartButton from "@/components/shop/AddToCartButton";

type ProductActionsProps = {
  productId: string;
  maxQuantity: number;
};

export default function ProductActions({ productId, maxQuantity }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-2 ring-pink-100">
      <QuantitySelector max={maxQuantity} value={quantity} onChange={setQuantity} />
      <AddToCartButton productId={productId} quantity={quantity} />
    </div>
  );
}
