import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

const AdminBlogManager = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [published, setPublished] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[áàâä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôö]/g, "o")
      .replace(/[őó]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/[űú]/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImageUrl("");
    setPublished(false);
    setEditingPost(null);
  };

  const openNewPost = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt || "");
    setContent(post.content);
    setCoverImageUrl(post.cover_image_url || "");
    setPublished(post.published);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !content || !user) return;
    setSaving(true);

    const postSlug = slug || generateSlug(title);
    const postData = {
      title,
      slug: postSlug,
      excerpt: excerpt || null,
      content,
      cover_image_url: coverImageUrl || null,
      published,
      published_at: published ? new Date().toISOString() : null,
      author_id: String(user.id),
    };

    if (editingPost) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", editingPost.id);

      if (error) {
        toast.error(language === "hu" ? "Mentés sikertelen" : "Failed to save");
      } else {
        toast.success(language === "hu" ? "Bejegyzés frissítve" : "Post updated");
        setDialogOpen(false);
        resetForm();
        fetchPosts();
      }
    } else {
      const { error } = await supabase.from("blog_posts").insert(postData);

      if (error) {
        toast.error(language === "hu" ? "Mentés sikertelen" : "Failed to save");
      } else {
        toast.success(language === "hu" ? "Bejegyzés létrehozva" : "Post created");
        setDialogOpen(false);
        resetForm();
        fetchPosts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (!error) {
      toast.success(language === "hu" ? "Bejegyzés törölve" : "Post deleted");
      fetchPosts();
    }
  };

  const togglePublished = async (post: BlogPost) => {
    const newPublished = !post.published;
    const { error } = await supabase
      .from("blog_posts")
      .update({
        published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (!error) {
      toast.success(
        newPublished
          ? language === "hu" ? "Bejegyzés publikálva" : "Post published"
          : language === "hu" ? "Bejegyzés elrejtve" : "Post unpublished"
      );
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {language === "hu" ? "Blog bejegyzések" : "Blog Posts"}
        </h2>
        <Button onClick={openNewPost}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "hu" ? "Új bejegyzés" : "New Post"}
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {language === "hu" ? "Még nincsenek bejegyzések." : "No posts yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {post.published ? (
                      <span className="text-primary flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {language === "hu" ? "Publikált" : "Published"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> {language === "hu" ? "Piszkozat" : "Draft"}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => togglePublished(post)}>
                    {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditPost(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost
                ? language === "hu" ? "Bejegyzés szerkesztése" : "Edit Post"
                : language === "hu" ? "Új bejegyzés" : "New Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === "hu" ? "Cím" : "Title"}</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingPost) setSlug(generateSlug(e.target.value));
                }}
                placeholder={language === "hu" ? "Bejegyzés címe" : "Post title"}
              />
            </div>

            <div>
              <Label>Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-slug"
              />
            </div>

            <div>
              <Label>{language === "hu" ? "Kivonat" : "Excerpt"}</Label>
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={language === "hu" ? "Rövid leírás a listához" : "Short description for listing"}
                rows={2}
              />
            </div>

            <div>
              <Label>{language === "hu" ? "Tartalom (Markdown)" : "Content (Markdown)"}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={language === "hu" ? "Írja meg a bejegyzés tartalmát..." : "Write your post content..."}
                rows={12}
              />
            </div>

            <div>
              <Label>{language === "hu" ? "Borítókép URL" : "Cover Image URL"}</Label>
              <Input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label>{language === "hu" ? "Publikálás" : "Publish"}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {language === "hu" ? "Mégse" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving || !title || !content}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "hu" ? "Mentés" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlogManager;
