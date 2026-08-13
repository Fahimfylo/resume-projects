import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { axiosWrapper } from "../../https/axiosWrapper";

const MenuContainer = () => {
  const [selectedCat, setSelectedCat] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [itemId, setItemId] = useState();
  const dispatch = useDispatch();

  const { data: categories } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => axiosWrapper.get("/api/menu/categories").then((r) => r.data?.data || []),
  });

  const activeCat = selectedCat || categories?.[0] || null;

  const { data: items } = useQuery({
    queryKey: ["menu-items", activeCat?._id],
    queryFn: () => axiosWrapper.get(`/api/menu/items?categoryId=${activeCat._id}`).then((r) => r.data?.data || []),
    enabled: !!activeCat?._id,
  });

  const increment = (id) => {
    setItemId(id);
    if (itemCount >= 4) return;
    setItemCount((prev) => prev + 1);
  };

  const decrement = (id) => {
    setItemId(id);
    if (itemCount <= 0) return;
    setItemCount((prev) => prev - 1);
  };

  const handleAddToCart = (item) => {
    if (itemCount === 0) return;
    dispatch(
      addItems({
        id: new Date().getTime(),
        name: item.name,
        pricePerQuantity: item.price,
        quantity: itemCount,
        price: item.price * itemCount,
      })
    );
    setItemCount(0);
  };

  return (
    <div data-aos="fade-up">
      {/* Category Grid */}
      <div className="grid grid-cols-4 gap-4 px-8 py-2">
        {categories?.map((cat) => (
          <div
            key={cat._id}
            className="flex flex-col items-start justify-between p-4 rounded-xl h-[90px] cursor-pointer shadow-sm transition-all hover:shadow-md"
            style={{ backgroundColor: cat.bgColor || "#b1454a" }}
            onClick={() => {
              setSelectedCat(cat);
              setItemId(0);
              setItemCount(0);
            }}
          >
            <div className="flex items-center justify-between w-full">
              <h1 className="text-white text-sm font-heading font-semibold">
                {cat.icon} {cat.name}
              </h1>
              {activeCat?._id === cat._id && (
                <GrRadialSelected className="text-white/70" size={16} />
              )}
            </div>
            <p className="text-white/70 text-xs font-body">{items?.length || 0} Items</p>
          </div>
        ))}
      </div>

      <hr className="border-border mx-8 my-3" />

      {/* Items Grid */}
      <div className="grid grid-cols-4 gap-4 px-8 py-2 max-h-[calc(100vh-380px)] overflow-y-scroll custom-scrollbar">
        {items?.map((item) => (
          <div
            key={item._id}
            className="flex flex-col items-start justify-between p-4 rounded-xl border border-border bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between w-full">
              <h1 className="text-secondary font-body font-semibold text-sm">
                {item.name}
              </h1>
              <button
                onClick={() => handleAddToCart(item)}
                className="bg-primary/10 text-primary p-2 rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                <FaShoppingCart size={16} />
              </button>
            </div>
            <div className="flex items-center justify-between w-full mt-3">
              <p className="text-secondary font-heading font-bold text-base">₹{item.price}</p>
              <div className="flex items-center justify-between border border-border rounded-lg px-3 py-1.5 gap-3 bg-white">
                <button
                  onClick={() => decrement(item._id)}
                  className="text-primary font-bold text-lg hover:text-primary-dark"
                >
                  &minus;
                </button>
                <span className="text-secondary font-body text-sm font-medium min-w-[16px] text-center">
                  {itemId === item._id ? itemCount : "0"}
                </span>
                <button
                  onClick={() => increment(item._id)}
                  className="text-primary font-bold text-lg hover:text-primary-dark"
                >
                  &#43;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuContainer;
