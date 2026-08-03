import API from "./api";

export const getAuditLogs = (page = 1, limit = 10) =>
  API.get(`/audit_logs?page=${page}&limit=${limit}`);