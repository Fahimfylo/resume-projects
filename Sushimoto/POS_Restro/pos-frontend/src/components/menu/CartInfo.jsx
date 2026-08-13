import { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem } from "../../redux/slices/cartSlice";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrolLRef.current) {
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  };

  return (
    <div className="px-4 py-3">
      <h1 className="text-secondary font-heading font-semibold text-base">Order Details</h1>
      <div
        className="mt-3 overflow-y-scroll max-h-[280px] custom-scrollbar space-y-2"
        ref={scrolLRef}
      >
        {cartData.length === 0 ? (
          <p className="text-muted-foreground font-body text-sm flex justify-center items-center h-[200px]">
            Your cart is empty
          </p>
        ) : (
          cartData.map((item) => (
            <div
              key={item.id}
              className="bg-muted/50 border border-border rounded-lg px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-secondary font-body font-medium text-sm">{item.name}</h1>
                <p className="text-muted-foreground font-body text-xs">x{item.quantity}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id)}
                    className="text-muted-foreground hover:text-red-500 cursor-pointer transition-colors"
                    size={18}
                  />
                  <FaNotesMedical
                    className="text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                    size={18}
                  />
                </div>
                <p className="text-secondary font-heading font-bold text-sm">₹{item.price}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CartInfo;
