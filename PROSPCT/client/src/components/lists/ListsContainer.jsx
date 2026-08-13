/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { EllipsisVertical, Trash2, ChevronsUpDown, FolderUp, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImSpinner9 } from "react-icons/im";
import { toast } from "react-toastify";
import ListsPagination from "./ListsPagination";
import EditColumns from "../contact/EditColumns";
import ExportContacts from "../contact/ExportContacts";
import EmptyPage from "../common/EmptyPage";
import EditListModal from "./EditListModal";
import useStore from "../../store/store";

function ListsContainer({
  data,
  folders = [],
  selectedFolderId = null,
  showAddListButton = false,
  hasAnyData,
  isLoading = false,
  onOpenAddListModal,
  onOpenCreateList,
  onOpenCreateFolder,
  onDelete,
  onDeleteAll,
  onUpdate,
}) {
  const navigate = useNavigate();
  const { user, setContactFilter, setContactListId, setCompanyFilter, setCompanyListId, checkedItems, toggleCheckedItems, toggleAllCheckedItems } = useStore();
  const [listTypeFilter, setListTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  function formatDate(date) {
    const dateToFormat = new Date(date);
    const options = { month: "short", day: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(dateToFormat);
  }

  const getListType = (list) => {
    const c = list.contactCount || 0;
    const co = list.companyCount || 0;
    if (c > 0 && co === 0) return "contacts";
    if (co > 0 && c === 0) return "companies";
    if (c > 0 && co > 0) return "mixed";
    return list.type || "empty";
  };

  const getOwnerName = (list) => {
    const listUser = list?.userId;
    if (listUser && typeof listUser === "object") {
      const fullName = `${listUser?.firstName || ""} ${listUser?.lastName || ""}`.trim();
      return listUser?.username || fullName || listUser?.email || "Unknown";
    }
    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return user?.username || fullName || user?.email || "Unknown";
  };

  const handleDeleteList = (id) => {
    if (onDelete) onDelete(id);
  };

  const handleListClick = (list) => {
    const type = getListType(list);
    if (type === "companies") {
      setCompanyFilter("list");
      setCompanyListId(list._id);
      navigate("/companies");
    } else {
      if ((list.totalCount || 0) === 0) {
        toast.warn("List is empty, please save some leads to continue");
        return;
      }
      navigate(`/search?list=${encodeURIComponent(list.name)}`);
    }
  };

  const handleDeleteAllLists = () => {
    if (onDeleteAll) onDeleteAll();
  };

  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = (list) => {
    setEditingList(list);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCloseEditModal = () => {
    setEditingList(null);
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = async (newName) => {
    if (!editingList) return;
    await onUpdate?.(editingList._id, { name: newName });
    handleCloseEditModal();
  };

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openMenuId]);

  const hasData = data.length > 0;
  const hasAnyListData = typeof hasAnyData === "boolean" ? hasAnyData : hasData;
  const isFolderEmpty = !!selectedFolderId && data.length === 0;

  const filteredData = useMemo(() => {
    let result = data;
    if (listTypeFilter !== "all") {
      result = result.filter((list) => getListType(list) === listTypeFilter || getListType(list) === "mixed");
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.trim().toLowerCase();
      result = result.filter((list) => list.name?.toLowerCase().includes(lower));
    }
    return result;
  }, [data, searchTerm, listTypeFilter]);

  const handleCheckboxChange = (list) => {
    if (list && list._id) {
      toggleCheckedItems(list);
    }
  };

  const isAllSelected = filteredData.length > 0 && filteredData.every((item) =>
    checkedItems.some((ci) => ci._id === item._id)
  );

  const handleSelectPage = () => {
    const validItems = filteredData.filter((item) =>
      item && item._id && typeof item._id === "string" && item._id.length > 0
    );
    if (isAllSelected) {
      const ids = new Set(validItems.map((r) => r._id));
      const remaining = checkedItems.filter((ci) => !ids.has(ci._id));
      toggleAllCheckedItems(remaining);
    } else {
      const existing = new Set(checkedItems.map((ci) => ci._id));
      const newItems = validItems.filter((item) => !existing.has(item._id));
      toggleAllCheckedItems([...checkedItems, ...newItems]);
    }
  };

  const columnConfig = {
    Name: { width: "w-[260px]", sticky: true },
    Items: { width: "w-[80px]", sticky: false },
    Type: { width: "w-[100px]", sticky: false },
    "Last updated": { width: "w-[130px]", sticky: false },
    Owner: { width: "w-[150px]", sticky: false },
    "Created at": { width: "w-[130px]", sticky: false },
    Actions: { width: "w-[90px]", sticky: false },
  };

  return (
    <div className="w-full min-w-0 px-3 md:px-4 py-4 h-full flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <ImSpinner9 className="animate-spin text-gray-400" size={28} />
        </div>
      ) : (
        <>
          {/* ── Type Tabs (like LeadRightTopbar) ── */}
          <div className="flex items-center gap-2 mb-3">
            {["all", "contacts", "companies"].map((tab) => (
              <button
                key={tab}
                onClick={() => setListTypeFilter(tab)}
                className={`px-4 py-1.5 text-sm font-semibold rounded transition capitalize ${
                  listTypeFilter === tab
                    ? "bg-sky-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab === "all" ? "All" : tab === "contacts" ? "Contacts" : "Companies"}
              </button>
            ))}
          </div>

          {/* ── Top Action Bar (like LeadRightTopbar) ── */}
          {hasAnyListData && (
            <div className="flex items-center justify-between px-2 py-1 bg-white border-t border-x border-gray-200">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search lists"
                    className="w-48 pl-7 pr-2 py-1 text-sm border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasData && (
                  <button
                    onClick={handleDeleteAllLists}
                    className="flex items-center px-2 py-1 text-[13px] font-medium text-red-500 border border-gray-300 rounded-sm hover:border-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} className="mr-1" />
                    Delete all
                  </button>
                )}
                <button
                  onClick={onOpenCreateList}
                  className="flex items-center px-3 py-1 text-[13px] font-medium text-white bg-sky-600 border border-sky-600 rounded-sm hover:bg-sky-700 transition-colors"
                >
                  <Plus size={14} className="mr-1" />
                  New List
                </button>
              </div>
            </div>
          )}

          {/* ── Empty State ── */}
          {!hasAnyListData || isFolderEmpty ? (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <EmptyPage
                title={selectedFolderId ? "Folder is empty" : "No lists found"}
                description={
                  selectedFolderId
                    ? "This folder is empty. Add lists to see them here."
                    : "Your workspace is empty. Start organizing by creating your first list or grouping them into folders."
                }
                actions={
                  selectedFolderId
                    ? [{ label: "Add list", onClick: onOpenAddListModal }]
                    : [
                        { label: "Create new list", onClick: onOpenCreateList, variant: "primary" },
                        { label: "New folder", onClick: onOpenCreateFolder, variant: "secondary" },
                      ]
                }
              />
            </div>
          ) : (
            <>
              {/* ── Table area (like LeadTable wrapper) ── */}
              <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 border border-gray-300 rounded-lg relative bg-white shadow-sm no-y-scrollbar mt-3">
                <table className="min-w-full text-left text-gray-800 table-fixed" style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                  <thead className="text-xs bg-white border-b" style={{ position: "sticky", top: 0, zIndex: 20 }}>
                    <tr>
                      <th className={`pl-4 py-2 ${columnConfig.Name.width} lg:sticky left-0 bg-white z-10 border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Name</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig.Items.width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Items</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig.Type.width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Type</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig["Last updated"].width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Last updated</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig.Owner.width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Owner</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig["Created at"].width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Created at</span>
                          <ChevronsUpDown size={14} className="ml-1 text-gray-500" />
                        </div>
                      </th>
                      <th className={`pl-4 py-2 font-normal ${columnConfig.Actions.width} border-b border-gray-200`}>
                        <div className="flex items-center">
                          <span>Actions</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-gray-500">
                          No lists found in this folder.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((list) => (
                        <tr key={list._id} className="text-sm hover:bg-gray-50 group border-b border-gray-200">
                          <td className="pl-4 py-3 overflow-hidden bg-white lg:sticky border-b border-gray-200 whitespace-nowrap group-hover:bg-gray-50">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                onClick={(e) => e.stopPropagation()}
                                checked={checkedItems.some((ci) => ci._id === list._id)}
                                onChange={() => handleCheckboxChange(list)}
                                className="mr-3"
                              />
                              <button
                                onClick={() => handleListClick(list)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
                              >
                                {list.name}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap">
                            {list.totalCount || 0}
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap">
                            {(() => {
                              const t = getListType(list);
                              if (t === "contacts") return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Contacts</span>;
                              if (t === "companies") return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Companies</span>;
                              if (t === "mixed") return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Mixed</span>;
                              return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Empty</span>;
                            })()}
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap text-gray-600">
                            {formatDate(list.updatedAt)}
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap text-gray-600">
                            {getOwnerName(list)}
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap text-gray-600">
                            {formatDate(list.createdAt)}
                          </td>
                          <td className="py-3 pl-4 border-b border-gray-200 whitespace-nowrap">
                            <div className="relative flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === list._id ? null : list._id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 transition rounded hover:bg-gray-100"
                              >
                                <EllipsisVertical size={16} />
                              </button>
                              {openMenuId === list._id && (
                                <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded shadow-lg z-[210]">
                                  <button
                                    onClick={() => handleOpenEditModal(list)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-50 gap-2"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      handleDeleteList(list._id);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 gap-2"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredData.length > 12 && <ListsPagination />}
            </>
          )}

          <EditColumns />
          <ExportContacts />

          <EditListModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSave={handleSaveEdit}
            initialName={editingList?.name || ""}
          />
        </>
      )}
    </div>
  );
}

export default ListsContainer;
