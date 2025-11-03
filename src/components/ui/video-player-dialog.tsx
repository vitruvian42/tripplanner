
'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type VideoPlayerDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
};

export function VideoPlayerDialog({
  isOpen,
  onOpenChange,
  videoUrl,
  title = 'Application Demo',
}: VideoPlayerDialogProps) {
  // Check if it's a Google Drive URL
  const isGoogleDrive = videoUrl.includes('drive.google.com');
  
  // Convert Google Drive sharing link to embeddable format if needed
  const getEmbedUrl = (url: string): string => {
    if (!isGoogleDrive) return url;
    
    // Extract file ID from Google Drive URL
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-auto p-0 border-0 bg-black">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="aspect-video">
          {isGoogleDrive ? (
            <iframe
              className="w-full h-full rounded-lg"
              src={embedUrl}
              title={title}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              className="w-full h-full rounded-lg"
              controls
              autoPlay
              muted
              loop
              playsInline
              src={videoUrl}
              title={title}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
