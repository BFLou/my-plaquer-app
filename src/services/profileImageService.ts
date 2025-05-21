// src/services/profileImageService.ts
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  updateDoc,
  setDoc,
  getDoc 
} from 'firebase/firestore';
import { storage, auth, db } from '@/lib/firebase';

/**
 * Service for handling profile image uploads and management
 */
export const profileImageService = {
  /**
   * Upload a profile image to Firebase Storage
   * @param userId The user's ID
   * @param file The image file to upload
   * @returns The download URL of the uploaded image
   */
  async uploadProfileImage(userId: string, file: File): Promise<string | null> {
    if (!userId || !file) {
      throw new Error('User ID and file are required');
    }

    try {
      // Create a reference to the storage location
      // Using timestamp to ensure unique filenames
      const timestamp = Date.now();
      const fileName = `profile_${userId}_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `user_profiles/${userId}/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        }
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the user's profile in Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL
        });

        // Force auth state refresh
        await auth.currentUser.reload();
      }

      // Update the user's profile in Firestore
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          photoURL: downloadURL,
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Create new document if it doesn't exist
        await setDoc(userDocRef, {
          uid: userId,
          photoURL: downloadURL,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      throw new Error(error.message || 'Failed to upload profile image');
    }
  },

  /**
   * Delete old profile image from Storage
   * @param photoURL The URL of the image to delete
   */
  async deleteOldProfileImage(photoURL: string): Promise<void> {
    if (!photoURL || !photoURL.includes('firebasestorage.googleapis.com')) {
      // Not a Firebase Storage URL, nothing to delete
      return;
    }

    try {
      // Extract the path from the URL
      const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
      const startIndex = photoURL.indexOf(baseUrl);
      
      if (startIndex === -1) {
        console.warn('Invalid Firebase Storage URL');
        return;
      }

      // Parse the URL to get the file path
      const urlParts = photoURL.substring(startIndex + baseUrl.length).split('/o/');
      if (urlParts.length < 2) {
        console.warn('Could not parse storage path from URL');
        return;
      }

      // Decode the file path (it's URL encoded)
      const encodedPath = urlParts[1].split('?')[0];
      const filePath = decodeURIComponent(encodedPath);

      // Create a reference and delete the file
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
      
      console.log('Successfully deleted old profile image');
    } catch (error: any) {
      // Don't throw error if deletion fails - it's not critical
      console.warn('Could not delete old profile image:', error.message);
    }
  },

  /**
   * Get the current user's profile image URL
   * @returns The current profile image URL or null
   */
  getCurrentProfileImageURL(): string | null {
    if (auth.currentUser) {
      return auth.currentUser.photoURL;
    }
    return null;
  },

  /**
   * Validate image file before upload
   * @param file The file to validate
   * @returns Boolean indicating if file is valid
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Image size must be less than 5MB'
      };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only JPEG, PNG, GIF, and WebP images are allowed'
      };
    }

    // Check file extension as additional validation
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file extension'
      };
    }

    return { valid: true };
  },

  /**
   * Compress image before upload if needed
   * @param file The original file
   * @param maxWidth Maximum width in pixels
   * @param maxHeight Maximum height in pixels
   * @param quality Quality from 0 to 1
   * @returns Promise resolving to compressed file
   */
  async compressImage(
    file: File, 
    maxWidth: number = 800, 
    maxHeight: number = 800, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw resized image
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }

              // Create new file from blob
              const compressedFile = new File(
                [blob], 
                file.name, 
                {
                  type: file.type,
                  lastModified: Date.now()
                }
              );

              // Only use compressed version if it's actually smaller
              if (compressedFile.size < file.size) {
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Could not load image'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Could not read file'));
      };
    });
  }
};

// Export as default as well for convenience
export default profileImageService;