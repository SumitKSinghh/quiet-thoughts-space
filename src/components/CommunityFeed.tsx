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
        .select("id, user_id, entry_date, title, content, mood, created_at, is_public")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (journalsError) throw journalsError;

      // Fetch user profiles for journal authors
      const journalUserIds = [...new Set((publicJournals || []).map(j => j.user_id))];
      const { data: journalProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, profile_picture_url")
        .in("user_id", journalUserIds);

      const journalProfilesMap = new Map(
        (journalProfiles || []).map((p: any) => [p.user_id, p])
      );

      // Fetch reposts
      const { data: reposts, error: repostsError } = await supabase
        .from("community_posts")
        .select("id, created_at, shared_by_user_id, original_journal_id")
        .order("created_at", { ascending: false });

      if (repostsError) throw repostsError;

      // Fetch journals for reposts
      const repostJournalIds = (reposts || []).map(r => r.original_journal_id);
      const { data: repostJournals } = await supabase
        .from("journals")
        .select("id, user_id, entry_date, title, content, mood, created_at")
        .in("id", repostJournalIds);

      // Fetch profiles for repost authors and original authors
      const repostUserIds = (reposts || []).map(r => r.shared_by_user_id);
      const originalUserIds = (repostJournals || []).map(j => j.user_id);
      const allRepostUserIds = [...new Set([...repostUserIds, ...originalUserIds])];
      
      const { data: repostProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, profile_picture_url")
        .in("user_id", allRepostUserIds);

      const repostProfilesMap = new Map(
        (repostProfiles || []).map((p: any) => [p.user_id, p])
      );

      const repostJournalsMap = new Map(
        (repostJournals || []).map((j: any) => [j.id, j])
      );

      // Format public journals
      const formattedJournals: CommunityPost[] = (publicJournals || []).map((journal: any) => {
        const profile = journalProfilesMap.get(journal.user_id);
        return {
          id: journal.id,
          user_id: journal.user_id,
          entry_date: journal.entry_date,
          title: journal.title,
          content: journal.content,
          mood: journal.mood,
          created_at: journal.created_at,
          is_public: journal.is_public,
          author_name: profile?.full_name || "Anonymous",
          author_avatar: profile?.profile_picture_url,
          is_repost: false,
        };
      });

      // Format reposts
      const formattedReposts: CommunityPost[] = (reposts || []).map((repost: any) => {
        const journal = repostJournalsMap.get(repost.original_journal_id);
        if (!journal) return null;

        const originalProfile = repostProfilesMap.get(journal.user_id);
        const repostProfile = repostProfilesMap.get(repost.shared_by_user_id);

        return {
          id: journal.id,
          user_id: journal.user_id,
          entry_date: journal.entry_date,
          title: journal.title,
          content: journal.content,
          mood: journal.mood,
          created_at: journal.created_at,
          is_public: true,
          author_name: originalProfile?.full_name || "Anonymous",
          author_avatar: originalProfile?.profile_picture_url,
          is_repost: true,
          original_author_name: originalProfile?.full_name || "Anonymous",
          original_author_id: journal.user_id,
          reposted_by_name: repostProfile?.full_name || "Anonymous",
          repost_created_at: repost.created_at,
        };
      }).filter(Boolean) as CommunityPost[];

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