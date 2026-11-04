const files = new Map<string, File>();

export const registerAttachmentFile = (id: string, file: File) => {
  files.set(id, file);
};

export const getAttachmentFile = (id: string): File | undefined => files.get(id);

export const fileExtensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};
