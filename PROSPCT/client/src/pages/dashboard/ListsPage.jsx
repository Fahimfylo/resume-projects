import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import { toast } from "react-toastify";
import { createFolder, deleteFolder, deleteList, saveList, updateList } from "../../api/mutation";
import { useQueryClient } from "@tanstack/react-query";
import { notifyListCreated, notifyListDeleted, notifyFolderCreated, notifyFolderDeleted } from "../../utils/notificationHelper";

import ListsHeader from "../../components/lists/ListsHeader";
import ListsSidebar from "../../components/lists/ListsSidebar";
import ListsContainer from "../../components/lists/ListsContainer";
import AddListToFolderModal from "../../components/lists/AddListToFolderModal";
import CreateFolderModal from "../../components/lists/CreateFolderModal";
import CreateListModal from "../../components/lists/CreateListModal";
import MainLayout from "../../components/layout/MainLayout";
import { useEffect, useState } from "react";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function ListsPage() {
  const queryClient = useQueryClient();
  const [lists, setLists] = useState([]);
  const [allLists, setAllLists] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Single optimized fetch - gets lists, allLists, and folders in one API call
  const fetchListsPageData = async (folderId = null) => {
    try {
      const token =
        localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

      const url = folderId
        ? `${BASE_URL}/api/list/page-data?folderId=${folderId}`
        : `${BASE_URL}/api/list/page-data`;

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setLists(response.data.lists);
        setAllLists(response.data.allLists);
        setFolders(response.data.folders);
      }
    } catch (err) {
      // console.error("Failed to fetch lists page data:", err);
      toast.error("Failed to load lists");
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await fetchListsPageData(selectedFolderId);
      setIsLoading(false);
    };
    initialLoad();
  }, []);

  useEffect(() => {
    if (selectedFolderId !== null) {
      fetchListsPageData(selectedFolderId);
    }
  }, [selectedFolderId]);

  // DELETE SINGLE LIST
  const handleDeleteList = (listId) => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete this list?
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();

              try {
                await deleteList(listId);

                toast.success("List deleted");

                // Refresh contacts list since contacts may have been deleted
                queryClient.removeQueries({ queryKey: ["savedContacts"] });
                queryClient.refetchQueries({ queryKey: ["savedContacts"] });
                localStorage.removeItem("savedContactsCache");

                await fetchListsPageData(selectedFolderId);
                
                notifyListDeleted();
              } catch (err) {
                // console.error("Failed to delete list:", err);

                const message =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  err.message ||
                  "Unable to delete list";

                toast.error(message);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  // CREATE FOLDER
  const handleCreateFolder = async (folderName) => {
    try {
      await createFolder(folderName);
      toast.success("Folder created");
      await fetchListsPageData(selectedFolderId);
      setIsCreateFolderModalOpen(false);
      
      notifyFolderCreated(folderName);
    } catch (err) {
      // console.error("Failed to create folder:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to create folder";
      toast.error(message);
    }
  };

  const handleOpenCreateFolderModal = () => {
    setIsCreateFolderModalOpen(true);
  };

  const handleCloseCreateFolderModal = () => {
    setIsCreateFolderModalOpen(false);
  };

  // OPEN ADD-LIST-TO-FOLDER MODAL
  const handleOpenAddListModal = () => {
    setIsAddListModalOpen(true);
  };

  const handleOpenCreateListModal = () => {
    setIsCreateListModalOpen(true);
  };

  const handleCloseCreateListModal = () => {
    setIsCreateListModalOpen(false);
  };

  const handleCreateList = async (listName, type = "contacts") => {
    try {
      await saveList(listName, [], null, type);
      toast.success("List created");
      await fetchListsPageData(selectedFolderId);
      setIsCreateListModalOpen(false);
      
      notifyListCreated(listName, type);
    } catch (err) {
      // console.error("Failed to create list:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to create list";
      toast.error(message);
    }
  };

  // CLOSE MODAL
  const handleCloseAddListModal = () => {
    setIsAddListModalOpen(false);
  };

  // Add an existing list into current folder
  const handleAddExistingListToFolder = async (listId) => {
    if (!selectedFolderId) return;

    try {
      await updateList(listId, { folderId: selectedFolderId });
      await fetchListsPageData(selectedFolderId);
      toast.success("List added to folder");
      setIsAddListModalOpen(false);
    } catch (err) {
      // console.error("Failed to add list to folder:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to add list to folder";
      toast.error(message);
    }
  };

  // Create a new list and assign to current folder
  const handleCreateListInFolder = async (listName, type = "contacts") => {
    if (!selectedFolderId) return;

    try {
      await saveList(listName, [], selectedFolderId, type);
      await fetchListsPageData(selectedFolderId);
      toast.success("List created in folder");
      setIsAddListModalOpen(false);
    } catch (err) {
      // console.error("Failed to create list in folder:", err);
      toast.error("Unable to create list");
    }
  };

  // DELETE FOLDER
  const handleDeleteFolder = async (folderId) => {
    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Are you sure you want to delete this folder? Lists in it will be moved to "All Lists".
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();

              try {
                await deleteFolder(folderId);

                toast.success("Folder deleted");
                setSelectedFolderId(null);
                await fetchListsPageData(null);
                
                notifyFolderDeleted();
              } catch (err) {
                // console.error("Failed to delete folder:", err);

                const message =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  err.message ||
                  "Unable to delete folder";

                toast.error(message);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  // Update a list (e.g. move it into a folder)
  const handleUpdateList = async (listId, updates) => {
    try {
      await updateList(listId, updates);
      await fetchListsPageData(selectedFolderId);
    } catch (err) {
      // console.error("Failed to update list:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to update list";
      toast.error(message);
    }
  };

  // DELETE ALL LISTS
  const handleDeleteAll = () => {
    if (lists.length === 0) return;

    toast.info(
      <div className="p-1">
        <p className="text-md font-semibold text-white tracking-tight">
          Delete all lists? This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-600 bg-gray-200 hover:bg-slate-50 rounded-md transition-all"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              toast.dismiss();

              try {
                await Promise.all(lists.map((list) => deleteList(list._id)));

                toast.success("All lists deleted");

                await fetchListsPageData(selectedFolderId);
              } catch (err) {
                // console.error("Failed to delete all lists:", err);

                const message =
                  err.response?.data?.message ||
                  err.response?.data?.error ||
                  err.message ||
                  "Unable to delete all lists";

                toast.error(message);
              }
            }}
            className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-700 rounded-md shadow-sm transition-all active:scale-95"
          >
            Confirm
          </button>
        </div>
      </div>,
      { autoClose: false, icon: false },
    );
  };

  return (
    <MainLayout>
      <section className="text-[#000000a6] text-sm w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        <ListsHeader />

        <div className="flex bg-[#f7f8fa] flex-1 overflow-hidden w-full min-h-0">
          <ListsSidebar
            folders={folders}
            selectedFolderId={selectedFolderId}
            hasAnyData={allLists.length > 0}
            onSelectFolder={setSelectedFolderId}
            onOpenCreateFolder={handleOpenCreateFolderModal}
            onDeleteFolder={handleDeleteFolder}
          />

          <div className="flex-1 overflow-hidden min-h-0">
            <ListsContainer
              data={lists}
              folders={folders}
              selectedFolderId={selectedFolderId}
              showAddListButton={!!selectedFolderId}
              hasAnyData={allLists.length > 0}
              isLoading={isLoading}
              onOpenAddListModal={handleOpenAddListModal}
              onOpenCreateList={handleOpenCreateListModal}
              onOpenCreateFolder={handleOpenCreateFolderModal}
              onUpdate={handleUpdateList}
              onDelete={handleDeleteList}
              onDeleteAll={handleDeleteAll}
            />
          </div>

          <CreateFolderModal
            isOpen={isCreateFolderModalOpen}
            onClose={handleCloseCreateFolderModal}
            onCreate={handleCreateFolder}
          />

          <CreateListModal
            isOpen={isCreateListModalOpen}
            onClose={handleCloseCreateListModal}
            onCreate={handleCreateList}
          />

          <AddListToFolderModal
            isOpen={isAddListModalOpen}
            onClose={handleCloseAddListModal}
            folderId={selectedFolderId}
            allLists={allLists}
            onAddExistingList={handleAddExistingListToFolder}
            onCreateNewList={handleCreateListInFolder}
          />
        </div>
      </section>
    </MainLayout>
  );
}

export default ListsPage;
