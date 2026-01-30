import ProductImageUpload from "@/components/admin-view/image-upload";
import AdminProductTile from "@/components/admin-view/product-tile";
import CommonForm from "@/components/common/form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { addProductFormElements } from "@/config";
import {
  addNewProduct,
  deleteProduct,
  editProduct,
  fetchAllProducts,
} from "@/store/admin/products-slice";
import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const initialFormData = {
  title: "",
  description: "",
  category: "",
  brand: "",
  price: "",
  salePrice: "",
  totalStock: "",
  averageReview: 0,
};

function AdminProducts() {
  const [openCreateProductsDialog, setOpenCreateProductsDialog] =
    useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null); // new selected file
  const [uploadedImageUrl, setUploadedImageUrl] = useState(""); // existing image URL
  const [currentEditedId, setCurrentEditedId] = useState(null);

  const { productList } = useSelector((state) => state.adminProducts);
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Reset form
  function resetForm() {
    setFormData(initialFormData);
    setImageFile(null);
    setUploadedImageUrl("");
    setCurrentEditedId(null);
    setOpenCreateProductsDialog(false);
  }

  // Submit handler
  function onSubmit(event) {
    event.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));

    // Attach new image if selected
    if (imageFile) data.append("image", imageFile);

    if (currentEditedId !== null) {
      dispatch(editProduct({ id: currentEditedId, formData: data })).then(
        (res) => {
          if (res?.payload?.success) {
            dispatch(fetchAllProducts());
            resetForm();
            toast({ title: "Product updated successfully" });
          }
        }
      );
    } else {
      dispatch(addNewProduct(data)).then((res) => {
        if (res?.payload?.success) {
          dispatch(fetchAllProducts());
          resetForm();
          toast({ title: "Product added successfully" });
        }
      });
    }
  }

  function handleDelete(productId) {
    dispatch(deleteProduct(productId)).then((res) => {
      if (res?.payload?.success) {
        dispatch(fetchAllProducts());
        toast({ title: "Product deleted successfully" });
      }
    });
  }

  function isFormValid() {
    return Object.keys(formData).every((key) => formData[key] !== "");
  }

  // Load products
  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  // Load product data into form when editing
  useEffect(() => {
    if (currentEditedId) {
      const product = productList.find((p) => p._id === currentEditedId);
      if (product) {
        setFormData({
          title: product.title,
          description: product.description,
          category: product.category,
          brand: product.brand,
          price: product.price,
          salePrice: product.salePrice,
          totalStock: product.totalStock,
          averageReview: product.averageReview || 0,
        });
        setUploadedImageUrl(product.image || "");
        setImageFile(null); // new file not selected yet
      }
    }
  }, [currentEditedId, productList]);

  return (
    <Fragment>
      <div className="mb-5 w-full flex justify-end">
        <Button onClick={() => setOpenCreateProductsDialog(true)}>
          Add New Product
        </Button>
      </div>

      {/* Product grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {productList?.map((product) => (
          <AdminProductTile
            key={product._id}
            product={product}
            setFormData={setFormData}
            setOpenCreateProductsDialog={setOpenCreateProductsDialog}
            setCurrentEditedId={setCurrentEditedId}
            handleDelete={handleDelete}
          />
        ))}
      </div>

      {/* Drawer / Sheet */}
      <Sheet open={openCreateProductsDialog} onOpenChange={() => resetForm()}>
        <SheetContent side="right" className="overflow-auto">
          <SheetHeader>
            <SheetTitle>
              {currentEditedId ? "Edit Product" : "Add New Product"}
            </SheetTitle>
          </SheetHeader>

          {/* Image Upload */}
          <ProductImageUpload
            imageFile={imageFile}
            setImageFile={setImageFile}
            uploadedImageUrl={uploadedImageUrl}
            setUploadedImageUrl={setUploadedImageUrl}
          />

          {/* Form */}
          <div className="py-6">
            <CommonForm
              onSubmit={onSubmit}
              formData={formData}
              setFormData={setFormData}
              formControls={addProductFormElements}
              buttonText={currentEditedId ? "Edit" : "Add"}
              isBtnDisabled={!isFormValid()}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Fragment>
  );
}

export default AdminProducts;
