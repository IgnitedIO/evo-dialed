// Dependencies
import { http } from "./http";

/*
------------------
> AUTH API CALLS <
------------------
*/

export const getAuthStatus = async () => {
  return await http.get("/auth/status", {
    withCredentials: true,
  });
};

export const loginUser = async (username, password) => {
  const resp = await http.post(
    "/auth/login",
    { username, password },
    { withCredentials: true }
  );

  return resp.status === 200;
};

export const registerUser = async (email, pass, name, pfp = null) => {
  return await http.post(
    "/auth/register",
    {
      em: email,
      pw: pass,
      dn: name !== null && name.length > 0 ? name : email,
      pfp: pfp,
    },
    { withCredentials: true }
  );
};

export const updatePassword = async (new_password) => {
  return await http.patch(
    "/auth/pw/touch",
    { p: new_password },
    { withCredentials: true }
  );
};

export const logoutUser = async () => {
  return await http.get("/auth/logout", { withCredentials: true });
};

export const acceptInvite = async (email, code, password) => {
  try {
    const resp = await http.post(
      "/auth/accept-invite",
      { email, code, password },
      { withCredentials: true }
    );

    if (resp.status === 200) {
      return { success: true };
    }
    return { success: false, error: "Failed to accept invitation" };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message || "Failed to accept invitation"
    };
  }
};

export const joinInvite = async (email, code, password) => {
  try {
    const resp = await http.post(
      "/auth/join-invite",
      { email, code, password },
      { withCredentials: true }
    );

    if (resp.status === 200) {
      return { success: true };
    }
    return { success: false, error: "Failed to join invitation" };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message || "Failed to join invitation"
    };
  }
};
