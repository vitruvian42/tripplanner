"use client";

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { TripPhoto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadSectionProps {
  tripId: string;
  initialPhotos: TripPhoto[];
}

export function PhotoUploadSection({ tripId, initialPhotos }: PhotoUploadSectionProps) {
  const auth = getAuth(getApp());

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<TripPhoto[]>(initialPhotos);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      alert('You must be logged in to upload photos.');
      return;
    }
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            try {
              const idToken = await currentUser.getIdToken(); // Get the ID token

              const uploadPhotoFunctionUrl = process.env.NEXT_PUBLIC_UPLOAD_PHOTO_FUNCTION_URL;
              if (!uploadPhotoFunctionUrl) {
                throw new Error("NEXT_PUBLIC_UPLOAD_PHOTO_FUNCTION_URL is not defined.");
              }

              const response = await fetch(uploadPhotoFunctionUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${idToken}`, // Include ID token in Authorization header
                },
                body: JSON.stringify({
                  tripId: tripId,
                  imageData: base64data,
                  fileName: file.name,
                  mimeType: file.type,
                }),
              });

              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorData}`);
              }

              const result = await response.json();

              const newPhoto = result; // The server now returns { photoId: string, url: string } directly
              const photo: TripPhoto = {
                id: newPhoto.photoId,
                url: newPhoto.url,
                uploadedBy: {
                  uid: currentUser.uid,
                  name: currentUser.displayName || 'Anonymous',
                  photoURL: currentUser.photoURL,
                },
                uploadedAt: new Date().toISOString(),
              };
              setUploadedPhotos((prevPhotos) => [...prevPhotos, photo]);
            } catch (error: any) {
              console.error('Error uploading photo:', error);
              alert(`Failed to upload photo: ${error.message || 'An unknown error occurred.'}`);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <input type="file" multiple accept="image/*" className="hidden" id="photo-upload" onChange={handleFileChange} />
      <label htmlFor="photo-upload" className="cursor-pointer">
        <Button asChild>
          <span><Camera className="mr-2 h-4 w-4"/>Upload Photos</span>
        </Button>
      </label>
      <p className="text-sm text-gray-500 mt-2">Drag and drop your photos here, or click to browse.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {uploadedPhotos.map((photo) => (
          <div key={photo.id} className="relative w-full h-48">
            <Image
              src={photo.url}
              alt="Trip photo"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}