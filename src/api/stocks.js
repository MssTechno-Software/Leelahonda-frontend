import API from "./api";

export const getStocks = (
  location = "all",
  search = "",
  page = 1,
  limit = 20
) =>
  API.get("/stocks", {
    params: {
      bucket: location,
      search: search.trim() || undefined,
      page,
      limit,
    },
  });

export const createStock = (data) =>
  API.post("/create_stocks", data);

export const updateStock = (id, data) =>
  API.put(`/update_stocks/${id}`, data);

// patch api for instant changing location + transfer date
export const updateStockLocation = (stockId, location, transferDate) => {
  return API.patch(`/stocks/${stockId}/location`, {
    location,
    "Stock Trasnfer Date": transferDate,
  });
};
// bulk upload
export const bulkUploadStocks = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post(
    "/stocks/upload-excel-binary",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;

        const percent = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );

        if (onProgress) {
          onProgress(percent);
        }
      },
    }
  );
};

// bulk delete
export const bulkDeleteStocks = (ids) =>
  API.post("/stocks/bulk-delete", { ids });