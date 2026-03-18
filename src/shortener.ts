const DB_URL = "https://varkdown-default-rtdb.firebaseio.com";

const generateId = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const values = crypto.getRandomValues(new Uint8Array(10));
  for (const v of values) {
    id += chars[v % chars.length];
  }
  return id;
};

export const createShortLink = async (data: string): Promise<string> => {
  const id = generateId();

  const res = await fetch(`${DB_URL}/links/${id}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    throw new Error("Failed to create short link");
  }

  return id;
};

export const getShortLink = async (id: string): Promise<string> => {
  const res = await fetch(`${DB_URL}/links/${id}.json`);

  if (!res.ok) {
    throw new Error("Failed to fetch short link");
  }

  const result = await res.json();

  if (!result || !result.data) {
    throw new Error("Short link not found");
  }

  return result.data as string;
};
