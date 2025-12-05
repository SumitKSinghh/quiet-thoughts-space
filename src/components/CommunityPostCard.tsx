import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CommunityPostCardProps {
  post: {
    id: string;
    user_id: string;
    entry_date: string;
    title: string | null;
    content: string;
    mood: string | null;
    created_at: string;
    author_name: string | null;
    author_avatar: string | null;
    is_repost: boolean;
    original_author_name?: string | null;
    reposted_by_name?: string | null;
    repost_created_at?: string;
  };
  onUpdate: () => void;
}

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    profile_picture_url: string | null;
  };
}

const CommunityPostCard = ({ post, onUpdate }: CommunityPostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLikesAndComments();
    getCurrentUser();
  }, [post.id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchLikesAndComments = async () => {
    try {
      // Fetch likes count
      const { count: likesCountData, error: likesCountError } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("journal_id", post.id);

      if (likesCountError) throw likesCountError;
      setLikesCount(likesCountData || 0);

      // Check if current user liked
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("journal_id", post.id)
          .eq("user_id", user.id)
          .single();

        setLiked(!!userLike);
      }

      // Fetch comments with profile data
      const { data: commentsData, error: commentsError } = await supabase
        .from("post_comments")
        .select("id, user_id, comment_text, created_at")
        .eq("journal_id", post.id)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch profile data for each comment
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, profile_picture_url")
          .in("user_id", userIds);

        const profilesMap = new Map(
          (profilesData || []).map((p: any) => [p.user_id, p])
        );

        const commentsWithProfiles = commentsData.map((comment: any) => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || {
            full_name: null,
            profile_picture_url: null,
          },
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error("Error fetching likes and comments:", error);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to like posts",
          variant: "destructive",
        });
        return;
      }

      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("journal_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({ journal_id: post.id, user_id: user.id });

        if (error) throw error;
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to comment",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("post_comments")
        .insert({
          journal_id: post.id,
          user_id: user.id,
          comment_text: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      fetchLikesAndComments();
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please log in",
          description: "You need to be logged in to share posts",
          variant: "destructive",
        });
        return;
      }

      // Check if already shared
      const { data: existingRepost } = await supabase
        .from("community_posts")
        .select("id")
        .eq("original_journal_id", post.id)
        .eq("shared_by_user_id", user.id)
        .single();

      if (existingRepost) {
        toast({
          title: "Already shared",
          description: "You have already shared this post",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("community_posts")
        .insert({
          original_journal_id: post.id,
          shared_by_user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Post shared!",
        description: "This post has been added to your community feed",
      });
      onUpdate();
    } catch (error: any) {
      console.error("Error sharing post:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="ring-2 ring-primary/10 transition-all duration-300 group-hover:ring-primary/20">
            <AvatarImage src={post.author_avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
              {post.author_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-foreground">{post.author_name || "Anonymous"}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
            {post.is_repost && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                Shared by {post.reposted_by_name} · Original by {post.original_author_name}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {post.title && <h3 className="text-xl font-semibold text-foreground">{post.title}</h3>}
        {post.mood && (
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-primary/15 to-primary/5 text-primary rounded-full text-sm font-medium border border-primary/10">
            {post.mood}
          </div>
        )}
        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-3 border-t border-border/30">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`transition-all duration-200 ${liked ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "hover:text-red-500 hover:bg-red-500/10"}`}
          >
            <Heart className={`h-5 w-5 mr-2 transition-transform duration-200 ${liked ? "fill-current scale-110" : "group-hover:scale-105"}`} />
            {likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="hover:text-primary hover:bg-primary/10 transition-all duration-200"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            {comments.length}
          </Button>
          {currentUserId !== post.user_id && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="hover:text-primary hover:bg-primary/10 transition-all duration-200"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </Button>
          )}
        </div>

        {showComments && (
          <div className="w-full space-y-4">
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles?.profile_picture_url || undefined} />
                    <AvatarFallback>{comment.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="font-semibold text-sm text-foreground">
                      {comment.profiles?.full_name || "Anonymous"}
                    </div>
                    <p className="text-sm text-foreground">{comment.comment_text}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button onClick={handleComment} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default CommunityPostCard;