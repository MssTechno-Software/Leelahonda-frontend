import API from "./api";
//get users
export const getUsers = () => API.get("/get_users");

//post api create a user 
export const createUser = (data) =>
  API.post("/create_users", data);
//update users 
export const updateUser = (id, data) =>
  API.put(`/update_users/${id}`, data);
//delete user
export const deleteUser = (id) =>
  API.delete(`/delete_users/${id}`);