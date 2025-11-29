import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CommunityPostCard from "./CommunityPostCard";
import { Loader2 } from "lucide-react";

interface CommunityPost {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
  is_public: boolean;
  author_name: string | null;
  author_avatar: string | null;
  is_repost: boolean;
  original_author_name?: string | null;
  original_author_id?: string;
  reposted_by_name?: string | null;
  repost_created_at?: string;
}

const CommunityFeed = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const fetchCommunityPosts = async () => {
    try {
      // Fetch public journals
      const { data: publicJournals, error: journalsError } = await supabase
        .from("journals")
        .select(`
          id,
          user_id,
          entry_date,
          title,
          content,
          mood,
          created_at,
          is_public,
          profiles!journals_user_id_fkey (
            full_name,
            profile_picture_url
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (journalsError) throw journalsError;

      // Fetch reposts
      const { data: reposts, error: repostsError } = await supabase
        .from("community_posts")
        .select(`
          id,
          created_at,
          shared_by_user_id,
          original_journal_id,
          journals!community_posts_original_journal_id_fkey (
            id,
            user_id,
            entry_date,
            title,
            content,
            mood,
            created_at,
            profiles!journals_user_id_fkey (
              full_name,
              profile_picture_url
            )
          ),
          profiles!community_posts_shared_by_user_id_fkey (
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (repostsError) throw repostsError;

      // Combine and format posts
      const formattedJournals: CommunityPost[] = (publicJournals || []).map((journal: any) => ({
        id: journal.id,
        user_id: journal.user_id,
        entry_date: journal.entry_date,
        title: journal.title,
        content: journal.content,
        mood: journal.mood,
        created_at: journal.created_at,
        is_public: journal.is_public,
        author_name: journal.profiles?.full_name || "Anonymous",
        author_avatar: journal.profiles?.profile_picture_url,
        is_repost: false,
      }));

      const formattedReposts: CommunityPost[] = (reposts || []).map((repost: any) => ({
        id: repost.journals.id,
        user_id: repost.journals.user_id,
        entry_date: repost.journals.entry_date,
        title: repost.journals.title,
        content: repost.journals.content,
        mood: repost.journals.mood,
        created_at: repost.journals.created_at,
        is_public: true,
        author_name: repost.journals.profiles?.full_name || "Anonymous",
        author_avatar: repost.journals.profiles?.profile_picture_url,
        is_repost: true,
        original_author_name: repost.journals.profiles?.full_name || "Anonymous",
        original_author_id: repost.journals.user_id,
        reposted_by_name: repost.profiles?.full_name || "Anonymous",
        repost_created_at: repost.created_at,
      }));

      // Combine and sort by most recent
      const allPosts = [...formattedJournals, ...formattedReposts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPosts(allPosts);
    } catch (error: any) {
      console.error("Error fetching community posts:", error);
      toast({
        title: "Error loading community feed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No posts yet. Share your first journal to the community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <CommunityPostCard key={`${post.id}-${post.is_repost ? "repost" : "original"}`} post={post} onUpdate={fetchCommunityPosts} />
      ))}
    </div>
  );
};

export default CommunityFeed;