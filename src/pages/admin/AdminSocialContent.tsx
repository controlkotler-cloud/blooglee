import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SocialGeneratorForm } from '@/components/admin/SocialGeneratorForm';
import { SocialContentCard } from '@/components/admin/SocialContentCard';
import { useAdminSocialContent } from '@/hooks/useAdminSocialContent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSocialContent() {
  const { items, isLoading, generate, isGenerating, deleteItem, scheduleToMetricool, schedulingId } = useAdminSocialContent();
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const filtered = platformFilter === 'all'
    ? items
    : items.filter(i => i.platform === platformFilter);

  const handleRegenerate = async (item: any) => {
    await generate({
      blogPostId: item.blog_post_id || undefined,
      platform: item.platform,
      contentType: item.content_type,
      language: item.language,
      customTopic: item.blog_post_id ? undefined : item.title,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            Social Media
          </h1>
          <p className="text-muted-foreground mt-1">Genera contenido adaptado para cada plataforma</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SocialGeneratorForm onGenerate={generate} isGenerating={isGenerating} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Contenido generado ({filtered.length})</h2>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hay contenido generado aún.</p>
                <p className="text-sm mt-1">Usa el formulario para crear tu primer post.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(item => (
                  <SocialContentCard
                    key={item.id}
                    item={item}
                    onDelete={deleteItem}
                    onRegenerate={handleRegenerate}
                    onSchedule={(id) => scheduleToMetricool({ socialContentId: id })}
                    isRegenerating={isGenerating}
                    isScheduling={schedulingId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
