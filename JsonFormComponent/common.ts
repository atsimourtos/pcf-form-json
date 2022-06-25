export function convertToJson<T>(value: string | null) {
  try {
    return JSON.parse(value || '') as T;
  } catch {
    return {} as T;
  }
}


export function isValidHttpUrl(value: string) {
  let url;
  
  try {
    url = new URL(value);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
