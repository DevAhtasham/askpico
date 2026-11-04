const ANON_ID_KEY = 'pico-anon-id';

export const getAnonId = (): string => {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
};
