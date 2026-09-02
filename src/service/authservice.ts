import api from "../lib/axios";

export const signupUser = async (
  email: string,
  password: string
) => {
  const response = await api.post("/auth/signup", {
    email,
    password,
  });

  return response.data;
};

interface LoginData {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);

  return response.data;
};



export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};


export const checkUsernameAvailability = async (
  username: string
) => {
  const response = await api.get("/auth/username/check", {
    params: {
      username,
    },
  });

  return response.data;
};

interface UpdateUserProfilePayload {
  username?: string;
  password?: string;
  profileimg?: string | null;
}

export const updateUserProfile = async (
  data: UpdateUserProfilePayload
) => {
  const response = await api.patch("/auth/profile", data);

  return response.data;
};