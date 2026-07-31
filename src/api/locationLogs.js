import API from "./api";

// Get Location Tracking by Frame Number
export const getLocationLogs = async (frame) => {
  const response = await API.get(`/location_logs/track/${frame}`);
  return response.data;
};