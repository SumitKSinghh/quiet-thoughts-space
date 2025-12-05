import React, { useState, useCallback } from 'react';
import { Upload, X, Image, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Attachment {
  id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file?: File;
  url?: string;
}

interface JournalAttachmentsProps {
  journalId?: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  isEditing?: boolean;
}

export const JournalAttachments: React.FC<JournalAttachmentsProps> = ({
  journalId,
  attachments,
  onAttachmentsChange,
  isEditing = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format. Only JPG, PNG, and MP4 files are allowed.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 100MB size limit.`,
          variant: "destructive",
        });
        continue;
      }

      const newAttachment: Attachment = {
        file_name: file.name,
        file_path: '', // Will be set after upload
        file_type: file.type,
        file_size: file.size,
        file,
        url: URL.createObjectURL(file),
      };

      const updatedAttachments = [...attachments, newAttachment];
      onAttachmentsChange(updatedAttachments);
    }

    // Reset input
    event.target.value = '';
  }, [attachments, onAttachmentsChange, toast]);

  const removeAttachment = useCallback(async (index: number) => {
    const attachment = attachments[index];
    
    // If it's an existing attachment with an ID, delete from database and storage
    if (attachment.id && journalId) {
      try {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('journal-media')
          .remove([attachment.file_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('journal_attachments')
          .delete()
          .eq('id', attachment.id);

        if (dbError) {
          toast({
            title: "Error",
            description: "Failed to delete attachment.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error removing attachment:', error);
        toast({
          title: "Error",
          description: "Failed to delete attachment.",
          variant: "destructive",
        });
        return;
      }
    }

    // Clean up object URL if it exists
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }

    const updatedAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updatedAttachments);
  }, [attachments, onAttachmentsChange, journalId, toast]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Attachments</label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,video/mp4"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-muted-foreground">
                JPG, PNG, MP4 up to 100MB each
              </div>
            </label>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {isEditing ? 'Selected Files' : 'Attachments'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((attachment, index) => (
              <AttachmentPreview
                key={index}
                attachment={attachment}
                index={index}
                isEditing={isEditing}
                onRemove={removeAttachment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component to properly use hooks
const AttachmentPreview: React.FC<{
  attachment: Attachment;
  index: number;
  isEditing: boolean;
  onRemove: (index: number) => void;
}> = ({ attachment, index, isEditing, onRemove }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const isImage = attachment.file_type.startsWith('image/');
  const isVideo = attachment.file_type.startsWith('video/');

  const getAttachmentUrl = (): string => {
    if (attachment.file && attachment.url?.startsWith('blob:')) {
      return attachment.url;
    }
    if (attachment.url && !attachment.url.startsWith('blob:')) {
      return attachment.url;
    }
    if (attachment.file_path) {
      const { data } = supabase.storage
        .from('journal-media')
        .getPublicUrl(attachment.file_path);
      return data.publicUrl;
    }
    return '';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="relative group">
      <div className="p-4">
        {isEditing && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {isImage && (
          <div className="space-y-2">
            <div className="relative w-full h-32 rounded-md bg-muted overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              {imageError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Image className="h-8 w-8 mb-2" />
                  <span className="text-xs">Failed to load</span>
                </div>
              ) : (
                <img
                  src={getAttachmentUrl()}
                  alt={attachment.file_name}
                  className="w-full h-full object-cover"
                  onLoad={() => { setImageLoading(false); setImageError(false); }}
                  onError={() => { setImageLoading(false); setImageError(true); }}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getFileIcon(attachment.file_type)}
              <span className="truncate">{attachment.file_name}</span>
              <span className="text-xs">({formatFileSize(attachment.file_size)})</span>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="space-y-2">
            <div className="relative w-full h-32 rounded-md bg-muted overflow-hidden">
              <video
                src={getAttachmentUrl()}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getFileIcon(attachment.file_type)}
              <span className="truncate">{attachment.file_name}</span>
              <span className="text-xs">({formatFileSize(attachment.file_size)})</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};