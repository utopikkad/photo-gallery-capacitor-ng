import { PhotoService, Photo } from './PhotoService';
import { Plugins, CameraResultType, CameraPhoto, FilesystemDirectory, Capacitor } from '@capacitor/core';

const { Filesystem, Storage } = Plugins;

export class WebPhotoService implements PhotoService {

  constructor() { }

  async loadSaved(storageKey): Promise<Photo[]> {
    // Retrieve cached photo array data
    const photos = await Storage.get({ key: storageKey });
    let photoArray = JSON.parse(photos.value) || [];

    // Read each saved photo's data from the Filesystem
    for (let photo of photoArray) {
      const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: FilesystemDirectory.Data
      });
      
      // Web platform only: Save the photo into the base64 field
      photo.base64 = `data:image/jpeg;base64,${readFile.data}`;
    }

    return photoArray;
  }

  getCameraConfig(): CameraResultType {
    return CameraResultType.Uri;
  }

  async savePhoto(cameraPhoto: CameraPhoto): Promise<Photo> {
    const response = await fetch(cameraPhoto.webPath);
    const blob = await response.blob();
    const base64Data = await this.convertBlobToBase64(blob) as string;

     // Write the file to the data directory (instead of temp storage)
    const fileName = new Date().getTime() + '.jpeg';
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath,
      // Unused - Display photos using webviewPath instead.
      base64: ""
    };
  }

  convertBlobToBase64 = blob => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
        resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
}
