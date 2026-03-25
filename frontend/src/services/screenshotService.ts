import api from './api';

export interface Screenshot {
  id: string;
  workEntryId: string;
  filename: string;
  mimeType: string;
  data: string;
  createdAt: string;
}

export const screenshotService = {
  async uploadScreenshots(
    workEntryId: string,
    files: File[]
  ): Promise<Screenshot[]> {
    const screenshots = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ filename: string; mimeType: string; data: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                filename: file.name,
                mimeType: file.type,
                data: (reader.result as string).split(',')[1], // strip data URL prefix
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    const response = await api.post<{ screenshots: Screenshot[] }>(
      `/screenshots/${workEntryId}`,
      { screenshots }
    );
    return response.data.screenshots;
  },

  async getScreenshots(workEntryId: string): Promise<Screenshot[]> {
    const response = await api.get<{ screenshots: Screenshot[] }>(
      `/screenshots/${workEntryId}`
    );
    return response.data.screenshots;
  },

  async deleteScreenshot(screenshotId: string): Promise<void> {
    await api.delete(`/screenshots/single/${screenshotId}`);
  },
};
