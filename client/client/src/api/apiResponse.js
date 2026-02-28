export const extractData = (response) => response?.data?.data ?? response?.data ?? null;

export const extractAccessToken = (response) => {
  const data = extractData(response);
  return data?.accessToken ?? response?.data?.accessToken ?? null;
};

export const extractUser = (response) => {
  const data = extractData(response);
  return data?.user ?? data ?? null;
};

export const normalizeApiError = (err, fallback = "Server error") => {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (data?.error && typeof data.error === "object") {
    return data.error.message || JSON.stringify(data.error);
  }
  if (typeof data?.message === "string") return data.message;
  if (typeof err?.message === "string") return err.message;

  return fallback;
};
