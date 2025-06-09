
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  full_name: string;
  age: number | null;
  sex: string;
  profession: string;
  goal_in_life: string;
  profile_picture_url: string | null;
}

interface ProfileFormProps {
  user: any;
}

const ProfileForm = ({ user }: ProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileData>({
    defaultValues: {
      full_name: '',
      age: null,
      sex: '',
      profession: '',
      goal_in_life: '',
      profile_picture_url: null,
    },
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfileData(data);
        form.reset({
          full_name: data.full_name || '',
          age: data.age,
          sex: data.sex || '',
          profession: data.profession || '',
          goal_in_life: data.goal_in_life || '',
          profile_picture_url: data.profile_picture_url,
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      form.setValue('profile_picture_url', data.publicUrl);
      
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };

  const onSubmit = async (data: ProfileData) => {
    try {
      setLoading(true);

      const profileData = {
        user_id: user.id,
        full_name: data.full_name,
        age: data.age,
        sex: data.sex,
        profession: data.profession,
        goal_in_life: data.goal_in_life,
        profile_picture_url: data.profile_picture_url,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const profilePictureUrl = form.watch('profile_picture_url');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-slate-200 shadow-lg">
              <AvatarImage src={profilePictureUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-gray-100 text-slate-600 text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {uploading && (
            <div className="flex items-center space-x-2 text-slate-600">
              <Upload className="h-4 w-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter your age" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer not to say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profession"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profession</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your profession" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="goal_in_life"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal in Life</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your life goals and aspirations..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;
