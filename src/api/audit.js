import API from "./api";

export const getAuditLogs = (
  page = 1,
  limit = 20,
  search = ""
) =>
  API.get("/audit_logs", {
    params: {
      search: search.trim() || undefined,
      page,
      limit,
    },
  });