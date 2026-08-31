/**
 * Utility to automatically compress and resize uploaded images to an optimal, lightweight
 * level (max dimension 1280px, JPEG quality 0.75) so that AI OCR / Vision models
 * can process and read text clearly and stably without payload limit issues.
 */
export async function compressImageForAI(
  source: File | string,
  maxDimension: number = 1280,
  quality: number = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const processImage = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale maintaining aspect ratio if dimension exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof source === 'string' ? source : '');
          return;
        }

        // Fill white background for transparent PNGs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compress canvas to JPEG at quality (0.75) for low memory footprint & high AI OCR accuracy
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (err) {
        // Fallback to source if canvas fails
        if (typeof source === 'string') resolve(source);
        else reject(err);
      }
    };

    img.onload = processImage;
    img.onerror = (err) => {
      if (typeof source === 'string') resolve(source);
      else reject(err);
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    }
  });
}
