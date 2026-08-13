import { Trash2, Plus } from "lucide-react";

function ListsSidebar({
  folders = [],
  selectedFolderId = null,
  hasAnyData = false,
  onSelectFolder,
  onOpenCreateFolder,
  onDeleteFolder,
}) {
  const showNoFoldersMessage = folders.length === 0 && !hasAnyData;

  return (
    <div className="w-[270px] ml-3 hidden sm:block bg-white mt-4 h-full">
      <div className="overflow-y-auto no-scrollbar h-full">
        <div
          className={
            "font-semibold transition-colors duration-300 py-3 px-4 rounded-sm cursor-pointer " +
            (!selectedFolderId
              ? "bg-sky-100 text-blue-500"
              : "hover:bg-sky-100 hover:text-blue-500")
          }
          onClick={() => onSelectFolder?.(null)}
        >
          All Lists
        </div>

        <div className="mt-4 px-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Folders</span>
            <button
              onClick={() => onOpenCreateFolder?.()}
              className="p-1 rounded hover:bg-sky-100"
              title="Create folder"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-2">
            {showNoFoldersMessage ? (
              <div className="pl-4 text-sm text-gray-500">No folders found.</div>
            ) : (
              folders.map((folder) => {
                const isActive = folder._id === selectedFolderId;
                return (
                  <div
                    key={folder._id}
                    className={
                      "flex items-center justify-between px-4 py-2 rounded-sm cursor-pointer " +
                      (isActive
                        ? "bg-sky-100 text-blue-500"
                        : "hover:bg-sky-100 hover:text-sky-400")
                    }
                    onClick={() => onSelectFolder?.(folder._id)}
                  >
                    <span className="text-sm">{folder.name}</span>
                    <button
                      className="p-1 rounded hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder?.(folder._id);
                      }}
                      title="Delete folder"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ListsSidebar;
