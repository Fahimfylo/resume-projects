import PropTypes from "prop-types";
import { Plus } from "lucide-react";

const DropdownList = ({
  items,
  selectedList,
  onSelect,
  onCreate,
  searchQuery,
  isLoading,
}) => {
  const filteredItems = items.filter(
    (item) => !selectedList.includes(item.name),
  );

  return (
    <div className="w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="p-3 text-sm text-gray-500 text-center italic">
          Loading lists...
        </div>
      ) : searchQuery.length === 0 ? (
        items.length > 0 ? (
          filteredItems.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {filteredItems.map((item) => (
                <li
                  key={item._id}
                  onClick={() => onSelect(item.name)}
                  className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {item.totalCount ?? item.contactCount ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              No available lists to select right now.
            </div>
          )
        ) : (
          <div className="p-4 text-sm text-gray-500 text-center">
            <div className="mb-1 text-gray-400">Create or add new lists in the top-right</div>
          </div>
        )
      ) : (
        /* Create List Option - Matches Screenshot 8 */
        <div
          onClick={() => onCreate?.(searchQuery)}
          className="flex items-center gap-2 px-4 py-2.5 text-blue-500 text-sm cursor-pointer hover:bg-blue-50 border-t border-gray-100 first:border-t-0"
        >
          <Plus size={18} className="text-blue-500" />
          <span>Create list &quot;{searchQuery}&quot;</span>
        </div>
      )}
    </div>
  );
};

DropdownList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedList: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
  searchQuery: PropTypes.string.isRequired,
  isLoading: PropTypes.bool,
};

export default DropdownList;
