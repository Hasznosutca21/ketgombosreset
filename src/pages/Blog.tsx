import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import teslandLogo from "@/assets/tesland-logo.png";
import teslaOwnersLogo from "@/assets/tesla-owners-hungary.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
}

const Blog = () => {
  const { language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, content, cover_image_url, published_at, created_at")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "yyyy. MMMM d.", { locale: language === "hu" ? hu : undefined });
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 md:px-12 border-b border-border bg-background/80 backdrop-blur-md">
          <Link to="/" className="flex flex-col items-center gap-0.5">
            <img src={teslandLogo} alt="TESLAND" className="h-10 md:h-12 w-auto" />
            <img src={teslaOwnersLogo} alt="Tesla Owners Hungary" className="h-5 md:h-6 w-auto opacity-60" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <Button variant="ghost" className="mb-6" onClick={() => setSelectedPost(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "hu" ? "Vissza a hírekhez" : "Back to news"}
          </Button>

          {selectedPost.cover_image_url && (
            <img
              src={selectedPost.cover_image_url}
              alt={selectedPost.title}
              className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
            />
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{selectedPost.title}</h1>
          <p className="text-muted-foreground text-sm mb-8 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(selectedPost.published_at || selectedPost.created_at)}
          </p>

          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 md:px-12 border-b border-border bg-background/80 backdrop-blur-md">
        <Link to="/" className="flex flex-col items-center gap-0.5">
          <img src={teslandLogo} alt="TESLAND" className="h-10 md:h-12 w-auto" />
          <img src={teslaOwnersLogo} alt="Tesla Owners Hungary" className="h-5 md:h-6 w-auto opacity-60" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "hu" ? "Főoldal" : "Home"}
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {language === "hu" ? "Hírek" : "News"}
        </h1>
        <p className="text-muted-foreground mb-10">
          {language === "hu" ? "Legfrissebb híreink és közleményeink" : "Our latest news and announcements"}
        </p>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-t-lg" />
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {language === "hu" ? "Még nincsenek hírek." : "No news yet."}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                onClick={() => setSelectedPost(post)}
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.published_at || post.created_at)}
                  </CardDescription>
                </CardHeader>
                {post.excerpt && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
