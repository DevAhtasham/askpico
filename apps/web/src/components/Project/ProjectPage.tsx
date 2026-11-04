import { useEffect, useState } from 'react';
import useStore from '@store/store';
import { StudioItemInterface } from '@store/image-slice';
import { getImage } from '@utils/imageStore';

const CodeIcon = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
    <path d='m16 18 6-6-6-6M8 6l-6 6 6 6' />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
    <path d='m12 19-7-7 7-7M19 12H5' />
  </svg>
);

const SparkleGlyph = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' className={className} aria-hidden='true'>
    <path d='M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8' />
  </svg>
);

const StudioThumb = ({ item }: { item: StudioItemInterface }) => {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!item.imageId) return;
    let objectUrl: string | undefined;
    let cancelled = false;
    getImage(item.imageId).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl('');
    };
  }, [item.imageId]);

  return url ? (
    <img src={url} alt={item.prompt} className='aspect-square w-full object-cover' />
  ) : (
    <div className='aspect-square w-full animate-pulse bg-surface-muted' />
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div className='mb-4 flex items-center gap-2'>
    <h2 className='text-sm font-semibold text-ink'>{title}</h2>
    <span className='rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-soft'>
      {count}
    </span>
  </div>
);

const ProjectPage = () => {
  const chats = useStore((state) => state.chats) ?? [];
  const artifacts = useStore((state) => state.artifacts);
  const studioItems = useStore((state) => state.studioItems);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);
  const setImageMode = useStore((state) => state.setImageMode);
  const openArtifactPanel = useStore((state) => state.openArtifactPanel);
  const setProjectMode = useStore((state) => state.setProjectMode);

  const webProjects = chats
    .map((chat, index) => ({
      chat,
      index,
      artifactList: artifacts.filter((artifact) => artifact.chatId === chat.id),
    }))
    .filter((entry) => entry.artifactList.length > 0);

  const studioImages = studioItems.filter((item) => item.status === 'done' && item.imageId);

  const openWebProject = (index: number, artifactId: string) => {
    setImageMode(false);
    setCurrentChatIndex(index);
    openArtifactPanel(artifactId);
    setProjectMode(false);
  };

  const openStudio = () => {
    setImageMode(true);
  };

  const isEmpty = webProjects.length === 0 && studioImages.length === 0;

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col bg-white text-ink'>
      <header className='flex items-center justify-between gap-4 border-b border-surface-line px-6 py-4'>
        <div className='min-w-0'>
          <h1 className='text-base font-semibold text-ink'>Projects</h1>
          <p className='text-xs text-ink-muted'>Web apps you built in chat and images you generated in Studio</p>
        </div>
        <button
          type='button'
          onClick={() => setProjectMode(false)}
          className='inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-line bg-white px-3 py-1.5 text-xs font-medium text-ink-soft shadow-card transition-colors hover:bg-surface-muted'
        >
          <ArrowLeftIcon className='h-3.5 w-3.5' />
          Back to chat
        </button>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto bg-surface-muted/40'>
        <div className='mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-8'>
          {isEmpty && (
            <div className='flex flex-col items-center gap-3 rounded-2xl border border-dashed border-surface-line bg-white px-6 py-16 text-center'>
              <span className='flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600'>
                <SparkleGlyph className='h-5 w-5' />
              </span>
              <p className='text-sm font-semibold text-ink'>No projects yet</p>
              <p className='max-w-sm text-xs text-ink-muted'>
                Web apps you build in chat and images you generate in Studio will show up here.
              </p>
            </div>
          )}

          {webProjects.length > 0 && (
            <section>
              <SectionHeader title='Web projects' count={webProjects.length} />
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {webProjects.map(({ chat, index, artifactList }) => (
                  <button
                    key={chat.id}
                    type='button'
                    onClick={() => openWebProject(index, artifactList[0].id)}
                    className='group flex flex-col gap-4 rounded-2xl border border-surface-line bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft'
                  >
                    <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600'>
                      <CodeIcon className='h-4 w-4' />
                    </span>
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-semibold text-ink'>{chat.title}</p>
                      <p className='mt-1 text-xs text-ink-muted'>
                        {artifactList.length} {artifactList.length === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                    <span className='mt-auto text-xs font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100'>
                      Open project
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {studioImages.length > 0 && (
            <section>
              <SectionHeader title='Studio' count={studioImages.length} />
              <div className='grid gap-4 sm:grid-cols-3 lg:grid-cols-4'>
                {studioImages.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={openStudio}
                    className='group flex flex-col overflow-hidden rounded-2xl border border-surface-line bg-white text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft'
                  >
                    <StudioThumb item={item} />
                    <div className='flex flex-col gap-1 p-3'>
                      <span className='line-clamp-2 text-xs text-ink-soft'>{item.prompt}</span>
                      <span className='text-[11px] text-ink-muted'>{item.provider}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
