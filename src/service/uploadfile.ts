import api from "../lib/axios";

export interface UploadedFile {
  path: string;
  fileName: string;
  mimeType: string;
  url: string;
  size: number;
}

interface UploadFileResponse {
  success: boolean;
  message: string;
  file: UploadedFile;
}

export const uploadFile = async (
  file: File
): Promise<UploadedFile> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<UploadFileResponse>(
    "auth/files/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.file;
};

export const getUploadedFileUrl = (path:string) => {
 
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    return `/${path.replace(/^\/+/, "")}`;
  }

  return `${supabaseUrl}${path}`;
};