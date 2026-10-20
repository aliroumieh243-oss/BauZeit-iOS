/**
 * Compresses an image file (from <input type="file"> or drag-and-drop)
 * to a max dimension of 1024px and JPEG quality 0.7.
 * Returns the base64 data string (data:image/jpeg;base64,...).
 */
export async function compressImageFile(file: File, maxDimension: number = 1024, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Fehler beim Laden des Bildes.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas konnte nicht initialisiert werden.'));
          return;
        }

        // Clean white background for transparent images
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
