import { supabase } from '@/integrations/supabase/client';

export interface Attachment {
  id?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  file?: File;
  url?: string;
}

export const uploadAttachments = async (
  attachments: Attachment[],
  journalId: string,
  userId: string
): Promise<Attachment[]> => {
  const uploadedAttachments: Attachment[] = [];
  
  for (const attachment of attachments) {
    if (attachment.file && !attachment.id) {
      // New file to upload
      const fileExt = attachment.file.name.split('.').pop();
      const fileName = `${userId}/${journalId}/${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('journal-media')
        .upload(fileName, attachment.file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload ${attachment.file_name}`);
      }

      // Save attachment record to database
      const { data: attachmentData, error: dbError } = await supabase
        .from('journal_attachments')
        .insert({
          journal_id: journalId,
          user_id: userId,
          file_name: attachment.file_name,
          file_path: fileName,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving attachment record:', dbError);
        // Clean up uploaded file
        await supabase.storage.from('journal-media').remove([fileName]);
        throw new Error(`Failed to save attachment record for ${attachment.file_name}`);
      }

      // Get signed URL for display
      const { data: urlData } = await supabase.storage
        .from('journal-media')
        .createSignedUrl(fileName, 60 * 60 * 24); // 24 hours

      uploadedAttachments.push({
        ...attachmentData,
        url: urlData?.signedUrl,
      });
    } else {
      // Existing attachment, just add to the list
      uploadedAttachments.push(attachment);
    }
  }
  
  return uploadedAttachments;
};

export const loadAttachments = async (journalId: string): Promise<Attachment[]> => {
  const { data: attachments, error } = await supabase
    .from('journal_attachments')
    .select('*')
    .eq('journal_id', journalId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading attachments:', error);
    return [];
  }

  // Get signed URLs for all attachments
  const attachmentsWithUrls = await Promise.all(
    attachments.map(async (attachment) => {
      const { data: urlData } = await supabase.storage
        .from('journal-media')
        .createSignedUrl(attachment.file_path, 60 * 60 * 24); // 24 hours

      return {
        ...attachment,
        url: urlData?.signedUrl,
      };
    })
  );

  return attachmentsWithUrls;
};

export const deleteAttachment = async (attachmentId: string, filePath: string): Promise<void> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('journal-media')
    .remove([filePath]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('journal_attachments')
    .delete()
    .eq('id', attachmentId);

  if (dbError) {
    throw new Error('Failed to delete attachment record');
  }
};
