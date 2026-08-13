"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

interface Props {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

export function AddToCartButton({ id, name, price, image, slug }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addItem({ id, name, price, image, slug });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Button
      size="lg"
      className={`w-full rounded-full sm:w-auto gap-2 transition-all ${
        added ? "bg-green-600 hover:bg-green-700" : ""
      }`}
      onClick={handleClick}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" /> Added to Cart
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" /> Add to Order — ${price.toFixed(2)}
        </>
      )}
    </Button>
  );
}
