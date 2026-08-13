import API from "./api";

export const getDelivered = (
  page = 1,
  limit = 10,
  delivered_date = null,
  date_from = null,
  date_to = null,
  search = ""
) => {
  const params = {
    page,
    limit,
  };

  if (delivered_date) {
    params.delivered_date = delivered_date;
  }

  if (date_from) {
    params.date_from = date_from;
  }

  if (date_to) {
    params.date_to = date_to;
  }

  if (search?.trim()) {
    params.search = search.trim();
  }

  return API.get("/delivered", {
    params,
  });
};