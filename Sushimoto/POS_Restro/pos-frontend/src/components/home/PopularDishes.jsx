import { popularDishes } from "../../constants";

const PopularDishes = () => {
  return (
    <div className="mt-0">
      <div className="bg-white border border-border rounded-xl shadow-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-secondary text-lg font-heading font-semibold">Popular Dishes</h1>
          <a href="" className="text-primary text-sm font-body font-semibold hover:underline">
            View all
          </a>
        </div>

        <div className="overflow-y-scroll max-h-[calc(100vh-320px)] custom-scrollbar px-4 pb-4">
          {popularDishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center gap-4 bg-white border border-border rounded-xl px-4 py-3 mt-3 hover:shadow-sm transition-shadow"
            >
              <span className="text-muted-foreground font-heading font-bold text-lg mr-1 w-7">
                {dish.id < 10 ? `0${dish.id}` : dish.id}
              </span>
              <img
                src={dish.image}
                alt={dish.name}
                className="w-11 h-11 rounded-full object-cover border border-border"
              />
              <div>
                <h1 className="text-secondary font-body font-semibold text-sm">{dish.name}</h1>
                <p className="text-muted-foreground text-xs font-body mt-0.5">
                  Orders: <span className="text-secondary font-medium">{dish.numberOfOrders}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PopularDishes;
