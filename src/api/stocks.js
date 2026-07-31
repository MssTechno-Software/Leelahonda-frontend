import API from "./api";

export const getStocks = (
  location = "all",
  page = 1,
  limit = 20
) =>
  API.get("/stocks", {
    params: {
      location,
      page,
      limit,
    },
  });

export const createStock = (data) =>
  API.post("/create_stocks", data);

export const updateStock = (id, data) =>
  API.put(`/update_stocks/${id}`, data);

export const deleteStock = (id) =>
  API.delete(`/delete_stocks/${id}`);

//patch api for instant changing location
export const updateStockLocation = (stockId, location) => {
  return API.patch(`/stocks/${stockId}/location`, {
    location,
  });
};
//bulk upload 
export const bulkUploadStocks = (file) => {
  const formData = new FormData();

  formData.append("file", file);

  return API.post("/stocks/upload-excel-binary", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

//bulk delete
export const bulkDeleteStocks = (ids) =>
  API.post("/stocks/bulk-delete", { ids });