import API from "./api";

export const getAuditLogs = () =>
  API.get("/audit_logs");