
'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-auto p-0 border-0 bg-black">
        <div className="aspect-video">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
