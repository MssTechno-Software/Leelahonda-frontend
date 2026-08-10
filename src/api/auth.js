import API from "./api";

export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();

  formData.append("grant_type", "password");
  formData.append("username", username);
  formData.append("password", password);
  formData.append("scope", "");
  formData.append("client_id", "string");
  formData.append("client_secret", "********");

  const response = await API.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  localStorage.setItem("access_token", response.data.access_token);

  if (response.data.refresh_token) {
    localStorage.setItem("refresh_token", response.data.refresh_token);
  }

  if (response.data.token_type) {
    localStorage.setItem("token_type", response.data.token_type);
  }

  // for user role login 
  if (response.data.role) {
    localStorage.setItem("role", response.data.role);
  }

  return response.data;
};