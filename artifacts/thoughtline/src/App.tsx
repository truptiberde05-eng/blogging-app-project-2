import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router } from 'wouter';
import {
  ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp,
  Clock3, Feather, Heart, LogIn, LogOut, Menu, MessageCircle, PenLine,
  Plus, Search, Settings2, ShieldCheck, Sparkles, Tag as TagIcon, Trash2,
  Users, X,
} from 'lucide-react';
import {
  getGetCurrentUserQueryKey, getGetPostQueryKey, getGetAuthorPostsQueryKey, getListCommentsQueryKey, getGetAuthorProfileQueryKey,
  getListPostsQueryKey, getListCategoriesQueryKey, getListTagsQueryKey,
  getListAdminPostsQueryKey, getListAdminUsersQueryKey, getListAdminCommentsQueryKey,
  getGetAdminDashboardQueryKey, getGetMyPostsQueryKey, useGetMyPosts,
  useGetCurrentUser, useListPosts, useListCategories,
  useListTags, useGetPost, useListComments, useCreateComment, useLikePost, useUnlikePost,
  useCreatePost, useUpdatePost, useDeletePost, useGetAuthorProfile, useGetAuthorPosts,
  useGetAdminDashboard, useListAdminPosts, useListAdminComments, useListAdminUsers,
  useUpdateUserRole, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateTag,
  useUpdateTag, useDeleteTag,
  useLogin, useRegister, useDeleteComment,
  type Post, type Category, type Tag, type User, type Comment,
} from '@workspace/api-client-react';
import { TOKEN_KEY } from '@/lib/api';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false } },
});

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');
const dateLabel = (value?: string) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '';
const initials = (name?: string) => (name || 'T').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

function Avatar({ name, small = false }: { name?: string; small?: boolean }) {
  return <span className={cx('grid shrink-0 place-items-center rounded-full bg-[#e7d7bc] font-semibold text-[#315c50]', small ? 'h-8 w-8 text-[11px]' : 'h-12 w-12 text-sm')} aria-label={`${name || 'Author'} avatar`}>{initials(name)}</span>;
}

function Button({ children, variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'outline' | 'danger' }) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-[#244d43]',
    quiet: 'bg-transparent text-foreground hover:bg-secondary',
    outline: 'border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/60',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-95',
  };
  return <button className={cx('focus-ring inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)} {...props}>{children}</button>;
}

function Shell({ children }: { children: ReactNode }) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const { data: user } = useGetCurrentUser({ query: { enabled: !!token, queryKey: getGetCurrentUserQueryKey() } });
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    queryClient.setQueryData(getGetCurrentUserQueryKey(), undefined);
    queryClient.clear();
    navigate('/');
  };
  const navLink = (to: string, label: string, icon?: ReactNode) => (
    <Link href={to} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} onClick={() => setMobileOpen(false)}
      className={cx('focus-ring flex items-center gap-2 rounded-full px-3 py-2 text-sm transition hover:bg-secondary/80', location === to && 'bg-secondary font-semibold text-primary')}>
      {icon}{label}
    </Link>
  );
  return <div className="grain min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-9">
          <Link href="/" className="focus-ring flex items-center gap-2.5" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-primary text-primary-foreground"><Feather size={19} strokeWidth={1.8}/></span>
            <span className="serif text-[25px] font-semibold tracking-[-.04em]">thoughtline<span className="text-accent">.</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLink('/', 'Discover', <BookOpen size={15}/>)}
            {user && navLink('/dashboard', 'My writing')}
            {user?.role === 'ADMIN' && navLink('/admin', 'Studio', <ShieldCheck size={15}/>)}
          </nav>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {user ? <>
            <Link href="/write" className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#244d43]" data-testid="link-write"><PenLine size={15}/> Write a story</Link>
            <Link href={`/authors/${user.username}`} className="focus-ring ml-2 flex items-center gap-2 rounded-full p-1.5 pr-2.5 transition hover:bg-secondary" data-testid="link-my-profile"><Avatar name={user.displayName} small/><span className="max-w-28 truncate text-sm font-medium">{user.displayName}</span></Link>
            <button className="focus-ring rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Sign out" onClick={logout} data-testid="button-sign-out"><LogOut size={17}/></button>
          </> : <>
            <Link href="/login" className="focus-ring rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-secondary" data-testid="link-login">Log in</Link>
            <Link href="/register" className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#244d43]" data-testid="link-join">Join Thoughtline <ArrowRight size={15}/></Link>
          </>}
        </div>
        <button className="focus-ring rounded-full p-2 sm:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-nav">{mobileOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      </div>
      {mobileOpen && <div className="grid gap-1 border-t border-border px-5 py-3 sm:hidden">
        {navLink('/', 'Discover', <BookOpen size={15}/>)}
        {user ? <>{navLink('/dashboard', 'My writing', <PenLine size={15}/>)}{user.role === 'ADMIN' && navLink('/admin', 'Studio', <ShieldCheck size={15}/>)}{navLink('/write', 'Write a story', <Plus size={15}/>)}
          <button onClick={logout} className="flex items-center gap-2 rounded-full px-3 py-2 text-left text-sm"><LogOut size={15}/> Sign out</button></> :
          <>{navLink('/login', 'Log in', <LogIn size={15}/>)}{navLink('/register', 'Join Thoughtline', <ArrowRight size={15}/>)}</>}
      </div>}
    </header>
    <main>{children}</main>
    <footer className="mt-24 border-t border-border/80">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <span className="serif text-lg text-foreground">A little more thoughtful, together.</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Link href="/" className="hover:text-primary">Discover</Link><Link href="/register" className="hover:text-primary">Become a writer</Link><span>© Thoughtline · Made for the curious</span></div>
      </div>
    </footer>
  </div>;
}

function LoadingRows() {
  return <div className="space-y-5" aria-label="Loading stories">{[1,2,3].map(item => <div key={item} className="animate-pulse border-b border-border pb-6"><div className="mb-4 h-3 w-28 rounded bg-secondary"/><div className="mb-3 h-6 w-3/4 rounded bg-secondary"/><div className="h-3 w-full max-w-2xl rounded bg-secondary"/><div className="mt-3 h-3 w-2/3 rounded bg-secondary"/></div>)}</div>;
}

function ErrorState({ retry, title = 'We lost the thread.', message = 'Something interrupted this page. Give it another try.' }: { retry: () => void; title?: string; message?: string }) {
  return <div className="rounded-2xl border border-border bg-card px-7 py-10 text-center" role="alert"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary"><CircleHelp size={21}/></span><h3 className="serif text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{message}</p><Button variant="outline" className="mt-5" onClick={retry}>Try again</Button></div>;
}

function EmptyState({ icon = <BookOpen size={22}/>, title, description, action }: { icon?: ReactNode; title: string; description: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/60 px-7 py-12 text-center"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">{icon}</span><h3 className="serif text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

function StoryCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  return <article className={cx('story-card group rounded-2xl border border-border/80 bg-card p-5 md:p-6', compact && 'p-4')}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link href={`/authors/${post.author.username}`} className="focus-ring flex items-center gap-2.5 rounded-full" data-testid={`link-author-${post.id}`}><Avatar name={post.author.displayName} small/><span className="text-sm font-semibold">{post.author.displayName}</span></Link>
      {post.category && <Link href={`/?category=${encodeURIComponent(post.category.slug)}`} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary hover:bg-secondary/70">{post.category.name}</Link>}
    </div>
    <Link href={`/posts/${post.slug}`} className="focus-ring block rounded-md" data-testid={`link-story-${post.slug}`}>
      <h2 className="serif text-[25px] leading-[1.1] tracking-[-.025em] transition-colors group-hover:text-primary md:text-[30px]">{post.title}</h2>
      <p className="mt-2 line-clamp-2 max-w-3xl text-[14px] leading-6 text-muted-foreground">{post.excerpt}</p>
    </Link>
    {post.coverImageUrl && <Link href={`/posts/${post.slug}`} className="mt-4 block overflow-hidden rounded-xl bg-secondary"><img src={post.coverImageUrl} alt="" loading="lazy" className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.02]"/></Link>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4"><span>{dateLabel(post.createdAt)}</span><span className="flex items-center gap-1"><Clock3 size={13}/>{post.readingTimeMinutes} min read</span></div>
      <div className="flex items-center gap-4"><span className="flex items-center gap-1"><Heart size={14}/>{post.likeCount}</span><span className="flex items-center gap-1"><MessageCircle size={14}/>{post.commentCount}</span></div>
    </div>
    {post.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{post.tags.slice(0,3).map(tag => <Link href={`/?tag=${encodeURIComponent(tag.slug)}`} key={tag.id} className="text-xs text-primary/80 hover:text-primary">#{tag.name}</Link>)}</div>}
  </article>;
}

function HomePage() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState<'latest' | 'most-liked'>('latest');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [page, setPage] = useState(0);
  const params = useMemo(() => ({ search: search.trim() || undefined, sort, category: category || undefined, tag: tag || undefined, page, size: 8 }), [search, sort, category, tag, page]);
  const postsQuery = useListPosts(params);
  const categoriesQuery = useListCategories();
  const tagsQuery = useListTags();
  const data = postsQuery.data;
  const resetFilters = () => { setSearch(''); setCategory(''); setTag(''); setPage(0); };
  return <div className="page-enter mx-auto max-w-[1320px] px-5 md:px-10">
    <section className="relative mt-8 overflow-hidden rounded-[30px] bg-[#e9e1d1] px-6 py-9 md:mt-11 md:px-12 md:py-12">
      <div className="pointer-events-none absolute -right-16 -top-32 h-[390px] w-[390px] rounded-full border border-[#b5c8b7]/70 md:right-[9%] md:top-[-175px] md:h-[570px] md:w-[570px]"/>
      <div className="pointer-events-none absolute -right-4 top-9 h-[280px] w-[280px] rounded-full border border-[#b5c8b7]/70 md:right-[13%] md:top-[-105px] md:h-[430px] md:w-[430px]"/>
      <div className="relative max-w-[750px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#a6b9a9] bg-[#f3ede3]/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-[#315c50]"><Sparkles size={13}/> A home for good ideas</div>
        <h1 className="serif max-w-[730px] text-[45px] leading-[.99] tracking-[-.045em] text-[#203f37] md:text-[68px]">Writing worth<br className="hidden md:block"/> <em className="font-normal">staying with.</em></h1>
        <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#50635b] md:text-base">Meet writers who notice the small things. Read a little deeper, and add your own voice to the conversation.</p>
        <div className="mt-7 flex flex-wrap gap-3"><a href="#stories" className="focus-ring inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[#244d43]">Explore stories <ArrowDown size={15}/></a><Link href="/register" className="focus-ring inline-flex items-center gap-2 rounded-full border border-[#b2b9aa] bg-[#f6f0e5]/60 px-5 py-3 text-sm font-semibold text-[#315c50] transition hover:bg-[#f6f0e5]">Find your voice <PenLine size={15}/></Link></div>
      </div>
      <div className="relative mt-9 flex items-center gap-3 md:absolute md:bottom-10 md:right-12 md:mt-0"><div className="flex -space-x-2">{['Mira Chen','Isaac Moore','Leila Nasser'].map(name => <Avatar key={name} name={name} small/>)}</div><p className="max-w-[165px] text-xs leading-5 text-[#53675f]">Independent voices, finding each other.</p></div>
    </section>
    <section id="stories" className="grid gap-10 pb-12 pt-12 lg:grid-cols-[minmax(0,1fr)_286px] lg:gap-14 lg:pt-[68px]">
      <div>
        <div className="mb-6 flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mono mb-2 text-[10px] uppercase tracking-[.2em] text-primary">THE READING ROOM</div><h2 className="serif text-4xl tracking-[-.035em]">Stories with a pulse.</h2></div>
          <div className="flex items-center gap-1 rounded-full bg-secondary p-1 text-sm">
            <button onClick={() => { setSort('latest'); setPage(0); }} className={cx('rounded-full px-4 py-2 transition', sort === 'latest' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground')} data-testid="button-sort-latest">Latest</button>
            <button onClick={() => { setSort('most-liked'); setPage(0); }} className={cx('rounded-full px-4 py-2 transition', sort === 'most-liked' ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground')} data-testid="button-sort-liked">Most loved</button>
          </div>
        </div>
        <label className="mb-5 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 focus-within:border-primary/50" htmlFor="story-search"><Search size={18} className="text-muted-foreground"/><input id="story-search" type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search ideas, writers, or subjects..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70" data-testid="input-search-stories"/></label>
        {(category || tag) && <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground"><span>Filtered by</span>{category && <span className="rounded-full bg-secondary px-3 py-1 text-primary">{categoriesQuery.data?.find(item => item.slug === category)?.name || category}</span>}{tag && <span className="rounded-full bg-secondary px-3 py-1 text-primary">#{tagsQuery.data?.find(item => item.slug === tag)?.name || tag}</span>}<button className="ml-auto underline underline-offset-4 hover:text-primary" onClick={resetFilters}>Clear</button></div>}
        <div className="space-y-4">
          {postsQuery.isLoading ? <LoadingRows/> : postsQuery.isError ? <ErrorState retry={() => postsQuery.refetch()}/> : data?.content.length ? data.content.map(post => <StoryCard key={post.id} post={post}/>) :
            <EmptyState title="Nothing on this page yet." description="Try a different search or topic. The next story is always just around the corner." action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>}/>}
        </div>
        {!!data && data.totalPages > 1 && <div className="mt-7 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"><span className="text-xs text-muted-foreground">Page {data.page + 1} of {data.totalPages} · {data.totalElements} stories</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ArrowLeft size={15}/> Previous</Button><Button variant="outline" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">Next <ArrowRight size={15}/></Button></div></div>}
      </div>
      <aside className="space-y-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mono mb-4 text-[10px] uppercase tracking-[.18em] text-muted-foreground">WANDER BY SUBJECT</div>
          {categoriesQuery.isLoading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 animate-pulse rounded bg-secondary"/>)}</div> : categoriesQuery.isError ? <button onClick={() => categoriesQuery.refetch()} className="text-sm text-accent underline">Topics didn’t load. Retry</button> : categoriesQuery.data?.length ? <div className="flex flex-wrap gap-2">{categoriesQuery.data.map(item => <button key={item.id} onClick={() => { setCategory(category === item.slug ? '' : item.slug); setPage(0); }} className={cx('rounded-full border px-3 py-2 text-xs transition hover:border-primary/50', category === item.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')} data-testid={`filter-category-${item.slug}`}>{item.name}<span className={cx('ml-1.5', category === item.slug ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{item.postCount}</span></button>)}</div> : <p className="text-sm text-muted-foreground">Topics will find their way here soon.</p>}
        </div>
        <div className="rounded-2xl border border-border bg-[#dce7de] p-5">
          <span className="mono text-[10px] uppercase tracking-[.18em] text-[#315c50]">A NOTE TO WRITERS</span><h3 className="serif mt-3 text-[26px] leading-tight text-[#203f37]">Your next paragraph might find its people.</h3><p className="mt-2 text-sm leading-6 text-[#53675f]">Publish your point of view in a space built around the people who write it.</p><Link href="/write" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315c50] hover:gap-3">Start writing <ArrowRight size={15}/></Link>
        </div>
        <div className="px-1"><div className="mono mb-3 text-[10px] uppercase tracking-[.18em] text-muted-foreground">A FEW THREADS TO FOLLOW</div>{tagsQuery.isLoading ? <div className="h-16 animate-pulse rounded bg-secondary"/> : tagsQuery.isError ? <button onClick={() => tagsQuery.refetch()} className="text-sm text-accent underline">Tags aren’t available. Retry</button> : <div className="flex flex-wrap gap-x-3 gap-y-2">{tagsQuery.data?.map(item => <button key={item.id} onClick={() => { setTag(tag === item.slug ? '' : item.slug); setPage(0); }} className={cx('text-sm transition hover:text-primary', tag === item.slug ? 'font-semibold text-primary' : 'text-muted-foreground')}>#{item.name}</button>)}</div>}</div>
      </aside>
    </section>
  </div>;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [, navigate] = useLocation();
  const [error, setError] = useState('');
  const login = useLogin();
  const register = useRegister();
  const isRegister = mode === 'register';
  const pending = isRegister ? register.isPending : login.isPending;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    if (isRegister) {
      register.mutate({ data: { username: String(form.get('username')), displayName: String(form.get('displayName')), email: String(form.get('email')), password: String(form.get('password')) } }, { onSuccess: response => finishAuth(response.token, navigate), onError: err => setError(getErrorMessage(err)) });
    } else {
      login.mutate({ data: { email: String(form.get('email')), password: String(form.get('password')) } }, { onSuccess: response => finishAuth(response.token, navigate), onError: err => setError(getErrorMessage(err)) });
    }
  };
  return <div className="page-enter mx-auto grid min-h-[calc(100dvh-150px)] max-w-[1180px] items-center gap-10 px-5 py-10 md:grid-cols-[1fr_410px] md:px-10">
    <div className="hidden md:block"><div className="mono mb-5 text-[10px] uppercase tracking-[.2em] text-primary">{isRegister ? 'A ROOM OF YOUR OWN' : 'GOOD TO HAVE YOU BACK'}</div><h1 className="serif max-w-xl text-[64px] leading-[.98] tracking-[-.045em]">{isRegister ? <>A quieter corner<br/>of the internet.</> : <>Pick up where<br/><em>you left off.</em></>}</h1><p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">{isRegister ? 'Follow the ideas that stay with you. Share the ones you cannot keep to yourself.' : 'Your reading room is right where you left it. Come on in.'}</p><div className="mt-9 flex items-center gap-3"><span className="h-px w-10 bg-accent"/><span className="serif text-lg italic text-primary">Stories are better when shared.</span></div></div>
    <div className="rounded-[26px] border border-border bg-card p-6 shadow-[0_18px_60px_-40px_rgba(40,54,43,.35)] md:p-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={15}/> Back to reading</Link>
      <div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">{isRegister ? 'JOIN THE CONVERSATION' : 'WELCOME BACK'}</div><h2 className="serif text-[34px] tracking-[-.03em]">{isRegister ? 'Make room for your voice.' : 'Let’s pick up the thread.'}</h2><p className="mt-2 text-sm text-muted-foreground">{isRegister ? 'A thoughtful community starts with you.' : 'Sign in to keep reading and writing.'}</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {isRegister && <><Field label="Your name" name="displayName" placeholder="How readers will know you" required maxLength={80}/><Field label="Username" name="username" placeholder="A short handle" required minLength={3} maxLength={32}/></>}
        <Field label="Email address" name="email" type="email" placeholder="you@example.com" required/>
        <Field label="Password" name="password" type="password" placeholder={isRegister ? 'At least 8 characters' : 'Your password'} required minLength={isRegister ? 8 : 1}/>
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive" role="alert" data-testid="status-auth-error">{error}</div>}
        <Button className="w-full justify-center py-3" disabled={pending} type="submit">{pending ? 'One moment…' : isRegister ? 'Create your account' : 'Sign in'} <ArrowRight size={16}/></Button>
      </form>
      <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">{isRegister ? 'Already have a place here?' : 'New to Thoughtline?'} <Link href={isRegister ? '/login' : '/register'} className="font-semibold text-primary hover:underline">{isRegister ? 'Log in' : 'Create an account'}</Link></div>
    </div>
  </div>;
}

function Field({ label, name, type = 'text', placeholder, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold">{label}</span><input {...props} name={name} type={type} placeholder={placeholder} className="focus-ring w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/70"/></label>;
}

function getErrorMessage(error: unknown) {
  const typed = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return typed.response?.data?.error || typed.response?.data?.message || typed.message || 'That did not work. Please try again.';
}

function finishAuth(token: string, navigate: (path: string) => void) {
  localStorage.setItem(TOKEN_KEY, token);
  queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
  navigate('/');
}

function NeedAccount({ intent }: { intent: string }) {
  return <div className="rounded-2xl border border-border bg-card p-7 text-center"><Avatar name="Thoughtline" small/><h2 className="serif mt-4 text-2xl">Your words belong here.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Sign in to {intent}, and keep your writing connected to the people who read it.</p><Link href="/login" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Sign in to continue</Link></div>;
}

function RequireUser({ children }: { children: ReactNode }) {
  const token = localStorage.getItem(TOKEN_KEY);
  const query = useGetCurrentUser({ query: { enabled: !!token, queryKey: getGetCurrentUserQueryKey() } });
  if (!token) return <div className="mx-auto max-w-2xl px-5 py-16"><NeedAccount intent="write and manage your stories"/></div>;
  if (query.isLoading) return <div className="mx-auto max-w-2xl px-5 py-16"><LoadingRows/></div>;
  if (query.isError || !query.data) return <div className="mx-auto max-w-2xl px-5 py-16"><ErrorState retry={() => query.refetch()} title="We couldn’t confirm your account." message="Your session may have expired. Sign in again to continue."/></div>;
  return <>{children}</>;
}

function PostPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const postQuery = useGetPost(slug, { query: { queryKey: getGetPostQueryKey(slug), enabled: !!slug } });
  const post = postQuery.data;
  const commentsQuery = useListComments(post?.id || 0, { query: { queryKey: getListCommentsQueryKey(post?.id || 0), enabled: !!post?.id } });
  const userQuery = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), enabled: !!localStorage.getItem(TOKEN_KEY) } });
  const like = useLikePost();
  const unlike = useUnlikePost();
  const addComment = useCreateComment();
  const removeComment = useDeleteComment();
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const client = useQueryClient();
  if (postQuery.isLoading) return <div className="mx-auto max-w-3xl px-5 py-16"><LoadingRows/></div>;
  if (postQuery.isError || !post) return <div className="mx-auto max-w-3xl px-5 py-16"><ErrorState retry={() => postQuery.refetch()} title="This story isn’t in reach." message="It may have moved, or the address may have a typo."/></div>;
  const toggleLike = () => {
    if (!userQuery.data) { navigate('/login'); return; }
    const mutation = post.likedByCurrentUser ? unlike : like;
    mutation.mutate({ postId: post.id }, { onSuccess: result => client.setQueryData(getGetPostQueryKey(slug), old => old ? { ...old, likedByCurrentUser: result.liked, likeCount: result.likeCount } : old) });
  };
  const submitComment = (event: FormEvent) => {
    event.preventDefault(); setCommentError('');
    if (!userQuery.data) { navigate('/login'); return; }
    if (!commentText.trim()) return;
    addComment.mutate({ postId: post.id, data: { content: commentText.trim() } }, { onSuccess: comment => { client.setQueryData<Comment[]>(getListCommentsQueryKey(post.id), old => [...(old || []), comment]); setCommentText(''); client.invalidateQueries({ queryKey: getGetPostQueryKey(slug) }); }, onError: err => setCommentError(getErrorMessage(err)) });
  };
  return <article className="page-enter mx-auto max-w-[940px] px-5 pb-14 pt-9 md:px-10 md:pt-14">
    <Link href="/" className="focus-ring inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={15}/> Back to the reading room</Link>
    <div className="mx-auto mt-9 max-w-[760px]">
      {post.category && <Link href={`/?category=${post.category.slug}`} className="mono text-[10px] uppercase tracking-[.2em] text-primary">{post.category.name}</Link>}
      <h1 className="serif mt-4 text-[43px] leading-[1.04] tracking-[-.04em] md:text-[62px]" data-testid="text-post-title">{post.title}</h1>
      <p className="serif mt-5 text-[21px] leading-8 text-muted-foreground md:text-[24px]">{post.excerpt}</p>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
        <Link href={`/authors/${post.author.username}`} className="focus-ring flex items-center gap-3"><Avatar name={post.author.displayName}/><div><div className="font-semibold">{post.author.displayName}</div><div className="mt-0.5 text-xs text-muted-foreground">{dateLabel(post.createdAt)} <span className="px-1">·</span> {post.readingTimeMinutes} min read</div></div></Link>
        <div className="flex items-center gap-2"><Button variant={post.likedByCurrentUser ? 'primary' : 'outline'} onClick={toggleLike} disabled={like.isPending || unlike.isPending} data-testid="button-like-post"><Heart size={16} fill={post.likedByCurrentUser ? 'currentColor' : 'none'}/>{post.likeCount} {post.likedByCurrentUser ? 'Loved' : 'Love'}</Button><Button variant="outline" onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}><MessageCircle size={16}/>{post.commentCount}</Button></div>
      </div>
      {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="mt-8 max-h-[460px] w-full rounded-2xl object-cover"/>}
      <div className="prose prose-stone mt-9 max-w-none whitespace-pre-wrap text-[17px] leading-[1.9] text-foreground prose-p:my-5">{post.content}</div>
      {!!post.tags.length && <div className="mt-9 flex flex-wrap gap-2">{post.tags.map(item => <Link href={`/?tag=${item.slug}`} key={item.id} className="rounded-full bg-secondary px-3 py-1.5 text-xs text-primary">#{item.name}</Link>)}</div>}
      <div className="mt-12 rounded-2xl bg-[#e9e1d1] p-5 md:flex md:items-center md:justify-between md:p-6"><div className="flex items-center gap-3"><Avatar name={post.author.displayName}/><div><div className="serif text-xl">Written by {post.author.displayName}</div><p className="mt-1 text-sm text-muted-foreground">More thoughtful writing from this author.</p></div></div><Link href={`/authors/${post.author.username}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 md:mt-0">Visit profile <ArrowRight size={15}/></Link></div>
      <section id="comments" className="mt-14 scroll-mt-24">
        <div className="mb-5 flex items-end justify-between border-b border-border pb-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">THE CONVERSATION</div><h2 className="serif text-3xl">Notes in the margins <span className="text-muted-foreground">({commentsQuery.data?.length ?? post.commentCount})</span></h2></div></div>
        <form onSubmit={submitComment} className="rounded-2xl border border-border bg-card p-4 md:p-5"><label htmlFor="new-comment" className="mb-2 block text-sm font-semibold">Leave a considered thought</label><textarea id="new-comment" value={commentText} onChange={event => setCommentText(event.target.value)} maxLength={2000} rows={3} placeholder={userQuery.data ? 'What stayed with you?' : 'Sign in to join the conversation'} className="focus-ring w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-6 placeholder:text-muted-foreground/70"/>{commentError && <p className="mt-2 text-sm text-destructive">{commentError}</p>}<div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{commentText.length}/2000</span><Button type="submit" disabled={addComment.isPending || !commentText.trim()}>{addComment.isPending ? 'Sending…' : 'Post comment'} <ArrowRight size={15}/></Button></div></form>
        <div className="mt-6 space-y-3">
          {commentsQuery.isLoading
            ? <LoadingRows/>
            : commentsQuery.isError
              ? <ErrorState retry={() => commentsQuery.refetch()} title="Comments are taking a pause."/>
              : commentsQuery.data?.length
                ? commentsQuery.data.map(comment => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      onDelete={() => {
                        removeComment.mutate(
                          { commentId: comment.id },
                          { onSuccess: () => client.invalidateQueries({ queryKey: getListCommentsQueryKey(post.id) }) },
                        );
                      }}
                    />
                  ))
                : <EmptyState icon={<MessageCircle size={22}/>} title="A fresh margin." description="No comments yet. Leave the first note for the next reader."/>}
        </div>
      </section>
    </div>
  </article>;
}

function CommentRow({ comment, onDelete }: { comment: Comment; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return <div className="flex gap-3 rounded-xl border border-border/80 bg-card p-4"><Avatar name={comment.author.displayName} small/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><Link href={`/authors/${comment.author.username}`} className="text-sm font-semibold hover:text-primary">{comment.author.displayName}</Link><span className="text-xs text-muted-foreground">{dateLabel(comment.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{comment.content}</p></div>{comment.canDelete && <div className="flex items-start gap-1">{confirm ? <><button onClick={onDelete} className="rounded-lg px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/5">Remove</button><button onClick={() => setConfirm(false)} aria-label="Cancel remove" className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X size={14}/></button></> : <button onClick={() => setConfirm(true)} aria-label="Delete comment" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 size={14}/></button>}</div>}</div>;
}

function ProfilePage() {
  const { username = '' } = useParams<{ username: string }>();
  const profile = useGetAuthorProfile(username, { query: { queryKey: getGetAuthorProfileQueryKey(username), enabled: !!username } });
  const [page, setPage] = useState(0);
  const posts = useGetAuthorPosts(username, { page, size: 8 }, { query: { queryKey: getGetAuthorPostsQueryKey(username, { page, size: 8 }), enabled: !!username } });
  if (profile.isLoading) return <div className="mx-auto max-w-4xl px-5 py-16"><LoadingRows/></div>;
  if (profile.isError || !profile.data) return <div className="mx-auto max-w-4xl px-5 py-16"><ErrorState retry={() => profile.refetch()} title="Author not found." message="This profile may have moved or the username may be mistyped."/></div>;
  const author = profile.data;
  return <div className="page-enter mx-auto max-w-[1120px] px-5 pb-12 pt-9 md:px-10 md:pt-14">
    <div className="rounded-[28px] bg-[#e9e1d1] p-6 md:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-[#d1dfd4] text-[#315c50]"><span className="serif text-3xl">{initials(author.displayName)}</span></span><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-[#315c50]">A THOUGHTLINE WRITER</div><h1 className="serif text-[42px] leading-none tracking-[-.035em] text-[#203f37] md:text-[52px]">{author.displayName}</h1><p className="mt-2 text-sm text-[#58665f]">@{author.username}</p></div><div className="sm:ml-auto sm:text-right"><div className="serif text-3xl text-[#203f37]">{author.postCount}</div><div className="text-xs uppercase tracking-[.12em] text-[#58665f]">published stories</div></div></div>{author.bio && <p className="mt-7 max-w-2xl text-[16px] leading-7 text-[#435d51]">{author.bio}</p>}</div>
    <div className="mb-5 mt-10 flex items-end justify-between border-b border-border pb-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">FROM THE DESK OF {author.displayName.toUpperCase()}</div><h2 className="serif text-3xl">Published work</h2></div></div>
    {posts.isLoading ? <LoadingRows/> : posts.isError ? <ErrorState retry={() => posts.refetch()} title="Stories are out of reach."/> : posts.data?.content.length ? <div className="grid gap-4 md:grid-cols-2">{posts.data.content.map(post => <StoryCard key={post.id} post={post}/>)}</div> : <EmptyState title="The page is still turning." description="There are no published stories to show yet."/>}
    {!!posts.data && posts.data.totalPages > 1 && <div className="mt-6 flex justify-end gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page + 1 >= posts.data.totalPages} onClick={() => setPage(page + 1)}>Next <ArrowRight size={15}/></Button></div>}
  </div>;
}

function PostEditor({ editing = false }: { editing?: boolean }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const client = useQueryClient();
  const postQuery = useGetPost(slug, { query: { queryKey: getGetPostQueryKey(slug), enabled: editing && !!slug } });
  const post = postQuery.data;
  const categories = useListCategories();
  const tags = useListTags();
  const create = useCreatePost();
  const update = useUpdatePost();
  const [initialized, setInitialized] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (editing && post && initialized !== post.id) {
      setTitle(post.title); setExcerpt(post.excerpt); setContent(post.content); setCover(post.coverImageUrl || '');
      setCategoryId(post.category ? String(post.category.id) : ''); setTagIds(post.tags.map(item => item.id)); setInitialized(post.id);
    }
  }, [editing, post, initialized]);

  if (editing && postQuery.isLoading) return <div className="mx-auto max-w-3xl px-5 py-16"><LoadingRows/></div>;
  if (editing && (postQuery.isError || !postQuery.data)) return <div className="mx-auto max-w-3xl px-5 py-16"><ErrorState retry={() => postQuery.refetch()} title="Draft not found." message="It may have been removed or you may not have permission to edit it."/></div>;
  const submitting = create.isPending || update.isPending;
  const save = (status: 'DRAFT' | 'PUBLISHED') => {
    setError('');
    const input = { title: title.trim(), excerpt: excerpt.trim(), content: content.trim(), coverImageUrl: cover.trim() || null, status, categoryId: categoryId ? Number(categoryId) : null, tagIds };
    const onSuccess = (saved: Post) => {
      client.invalidateQueries({ queryKey: getListPostsQueryKey() });
      client.invalidateQueries({ queryKey: getGetAuthorPostsQueryKey(saved.author.username) });
      client.invalidateQueries({ queryKey: getGetMyPostsQueryKey({ page: 0, size: 50 }) });
      client.invalidateQueries({ queryKey: getGetPostQueryKey(saved.slug) });
      navigate(status === 'PUBLISHED' ? `/posts/${saved.slug}` : `/write/${saved.slug}`);
    };
    if (editing && slug) update.mutate({ slug, data: input }, { onSuccess, onError: err => setError(getErrorMessage(err)) });
    else create.mutate({ data: input }, { onSuccess, onError: err => setError(getErrorMessage(err)) });
  };
  const ready = title.trim().length >= 3 && content.trim().length > 0;
  return <div className="page-enter mx-auto max-w-[1000px] px-5 pb-16 pt-8 md:px-10 md:pt-12">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={15}/> My writing</Link><div className="flex items-center gap-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-accent"/>{post?.status === 'PUBLISHED' ? 'Published story' : editing ? 'Draft editor' : 'New draft'}</span>{editing && post?.status === 'PUBLISHED' && <Button variant="outline" onClick={() => navigate(`/posts/${post.slug}`)}>View story <ArrowRight size={15}/></Button>}</div></div>
    <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_250px]">
      <section>
        <div className="mono mb-3 text-[10px] uppercase tracking-[.19em] text-primary">{editing ? 'RETURN TO YOUR THOUGHT' : 'A BLANK PAGE, A FRESH START'}</div><h1 className="serif mb-8 text-4xl tracking-[-.035em] md:text-5xl">{editing ? 'Keep shaping it.' : 'Begin with a thought.'}</h1>
        <label className="mb-5 block"><span className="sr-only">Story title</span><input value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={180} placeholder="Give your story a title" className="serif focus-ring w-full border-b border-border bg-transparent pb-4 text-[34px] leading-tight tracking-[-.03em] outline-none placeholder:text-muted-foreground/50 md:text-[42px]" data-testid="input-post-title"/></label>
        <label className="mb-5 block"><span className="sr-only">Short introduction</span><textarea value={excerpt} onChange={event => setExcerpt(event.target.value)} maxLength={400} rows={2} placeholder="A short introduction for readers…" className="focus-ring w-full resize-y border-b border-border bg-transparent pb-4 text-base leading-7 outline-none placeholder:text-muted-foreground/70" data-testid="input-post-excerpt"/></label>
        <label className="mb-5 block"><span className="sr-only">Story content</span><textarea value={content} onChange={event => setContent(event.target.value)} minLength={1} rows={16} placeholder="Start wherever the idea begins…" className="focus-ring w-full resize-y rounded-xl border border-border bg-card px-5 py-4 text-[16px] leading-8 outline-none placeholder:text-muted-foreground/65" data-testid="input-post-content"/></label>
        {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={!ready || submitting} onClick={() => save('DRAFT')} data-testid="button-save-draft">{submitting && update.isPending ? 'Saving…' : 'Save draft'}</Button><Button disabled={!ready || submitting} onClick={() => save('PUBLISHED')} data-testid="button-publish">{submitting ? 'Saving…' : post?.status === 'PUBLISHED' ? 'Update story' : 'Publish story'} <ArrowRight size={15}/></Button></div>
      </section>
      <aside className="space-y-5 lg:pt-[54px]">
        <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Settings2 size={16} className="text-primary"/>Story details</div>
          <label className="mb-4 block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">TOPIC</span><select value={categoryId} onChange={event => setCategoryId(event.target.value)} className="focus-ring w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"><option value="">No topic</option>{categories.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label className="mb-2 block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">COVER IMAGE URL</span><input type="url" value={cover} onChange={event => setCover(event.target.value)} placeholder="https://…" className="focus-ring w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"/></label>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><TagIcon size={16} className="text-primary"/>Choose a few threads</div><div className="flex flex-wrap gap-2">{tags.isLoading ? <span className="text-xs text-muted-foreground">Loading tags…</span> : tags.isError ? <button onClick={() => tags.refetch()} className="text-xs text-accent underline">Couldn’t load tags · retry</button> : tags.data?.length ? tags.data.map(item => <button key={item.id} onClick={() => setTagIds(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} className={cx('rounded-full border px-2.5 py-1.5 text-xs transition', tagIds.includes(item.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/40')}>{item.name}</button>) : <span className="text-xs text-muted-foreground">No tags have been added yet.</span>}</div></div>
        <div className="rounded-2xl bg-[#e9e1d1] p-5 text-sm leading-6 text-[#53675f]"><span className="serif text-lg text-[#203f37]">Make it yours.</span><p className="mt-1">An honest detail goes further than a perfect first sentence. You can always come back to this.</p></div>
      </aside>
    </div>
  </div>;
}

function DashboardPage() {
  const userQuery = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), enabled: !!localStorage.getItem(TOKEN_KEY) } });
  const user = userQuery.data;
  const posts = useGetMyPosts({ page: 0, size: 50 }, { query: { queryKey: getGetMyPostsQueryKey({ page: 0, size: 50 }), enabled: !!user?.id } });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const remove = useDeletePost();
  const client = useQueryClient();
  if (userQuery.isLoading) return <div className="mx-auto max-w-4xl px-5 py-16"><LoadingRows/></div>;
  if (userQuery.isError || !user) return <div className="mx-auto max-w-4xl px-5 py-16"><NeedAccount intent="manage your writing"/></div>;
  const stories = posts.data?.content || [];
  const publishedStories = stories.filter(story => story.status === 'PUBLISHED');
  const draftStories = stories.filter(story => story.status === 'DRAFT');
  const renderStories = (items: Post[]) => <div className="space-y-4">{items.map(story => <div key={story.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"><StoryCard post={story} compact/><div className="flex items-start justify-end gap-2 md:pt-2">{confirmId === story.id ? <><Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate({ slug: story.slug }, { onSuccess: () => { client.invalidateQueries({ queryKey: getGetMyPostsQueryKey({ page: 0, size: 50 }) }); setConfirmId(null); } })}>Confirm delete</Button><Button variant="outline" onClick={() => setConfirmId(null)}>Keep</Button></> : <><Link href={`/write/${story.slug}`} className="focus-ring inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary"><PenLine size={15}/> Edit</Link><Button variant="outline" aria-label={`Delete ${story.title}`} onClick={() => setConfirmId(story.id)}><Trash2 size={15}/></Button></>}</div></div>)}</div>;
  return <div className="page-enter mx-auto max-w-[1120px] px-5 pb-14 pt-9 md:px-10 md:pt-14">
    <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">YOUR WRITING DESK</div><h1 className="serif text-[44px] leading-none tracking-[-.04em]">Hello, {user.displayName.split(' ')[0]}.</h1><p className="mt-3 text-sm text-muted-foreground">A place to gather the things you’ve put into words.</p></div><Link href="/write" className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-[#244d43]"><Plus size={16}/> New story</Link></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><div className="mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">PUBLISHED</div><div className="serif mt-3 text-4xl">{posts.isLoading ? '—' : publishedStories.length}</div><p className="mt-1 text-xs text-muted-foreground">stories in the reading room</p></div><div className="rounded-2xl border border-border bg-card p-5"><div className="mono text-[10px] uppercase tracking-[.15em] text-muted-foreground">DRAFTS</div><div className="serif mt-3 text-4xl">{posts.isLoading ? '—' : draftStories.length}</div><p className="mt-1 text-xs text-muted-foreground">private pieces in progress</p></div><div className="rounded-2xl border border-border bg-[#dce7de] p-5"><div className="mono text-[10px] uppercase tracking-[.15em] text-[#315c50]">YOUR PROFILE</div><div className="serif mt-3 truncate text-2xl text-[#203f37]">@{user.username}</div><Link href={`/authors/${user.username}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#315c50]">See your public page <ArrowRight size={13}/></Link></div></div>
    {posts.isLoading ? <div className="mt-10"><LoadingRows/></div> : posts.isError ? <div className="mt-10"><ErrorState retry={() => posts.refetch()} title="Your writing is out of reach."/></div> : <>
      <section className="mt-10"><div className="mb-5 flex items-end justify-between border-b border-border pb-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">PRIVATE WORKSPACE</div><h2 className="serif text-3xl">Drafts</h2></div><span className="text-xs text-muted-foreground">Only you can see these</span></div>{draftStories.length ? renderStories(draftStories) : <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">No drafts yet. Start a new story and save it privately while you work.</div>}</section>
      <section className="mt-10"><div className="mb-5 flex items-end justify-between border-b border-border pb-4"><div><div className="mono mb-2 text-[10px] uppercase tracking-[.18em] text-primary">THE BODY OF WORK</div><h2 className="serif text-3xl">Published stories</h2></div><span className="text-xs text-muted-foreground">{publishedStories.reduce((sum, story) => sum + story.readingTimeMinutes, 0)} minutes of reading</span></div>{publishedStories.length ? renderStories(publishedStories) : <EmptyState icon={<PenLine size={22}/>} title="Your desk is waiting." description="Every writer starts somewhere. Begin with the thought you keep coming back to." action={<Link href="/write" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Write your first story <ArrowRight size={15}/></Link>}/>}</section>
    </>}
  </div>;
}

function AdminPage() {
  const [tab, setTab] = useState<'overview' | 'posts' | 'people' | 'conversation' | 'topics'>('overview');
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const summary = useGetAdminDashboard();
  const postsQuery = useListAdminPosts({ search: search || undefined, status: 'all', page: 0, size: 50 });
  const commentsQuery = useListAdminComments({ page: 0, size: 50 });
  const usersQuery = useListAdminUsers({ search: search || undefined, page: 0, size: 50 });
  const categoriesQuery = useListCategories();
  const tagsQuery = useListTags();
  const roleMutation = useUpdateUserRole();
  const deletePost = useDeletePost();
  const deleteComment = useDeleteComment();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const [taxonomyName, setTaxonomyName] = useState('');
  const [taxonomyDescription, setTaxonomyDescription] = useState('');
  const [taxonomyType, setTaxonomyType] = useState<'category' | 'tag'>('category');
  const [confirmTarget, setConfirmTarget] = useState('');
  const [error, setError] = useState('');
  const refreshTaxonomy = () => {
    client.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    client.invalidateQueries({ queryKey: getListTagsQueryKey() });
    client.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };
  const createTaxonomy = (event: FormEvent) => {
    event.preventDefault(); setError('');
    const data = { name: taxonomyName.trim(), description: taxonomyDescription.trim() || null };
    if (!data.name) return;
    const options = { onSuccess: () => { refreshTaxonomy(); setTaxonomyName(''); setTaxonomyDescription(''); }, onError: (err: unknown) => setError(getErrorMessage(err)) };
    if (taxonomyType === 'category') createCategory.mutate({ data }, options);
    else createTag.mutate({ data }, options);
  };
  const adminTabs: Array<{ id: typeof tab; label: string; icon: ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <Sparkles size={15}/> },
    { id: 'posts', label: 'Posts', icon: <BookOpen size={15}/> },
    { id: 'people', label: 'People', icon: <Users size={15}/> },
    { id: 'conversation', label: 'Comments', icon: <MessageCircle size={15}/> },
    { id: 'topics', label: 'Topics', icon: <TagIcon size={15}/> },
  ];
  const Metric = ({ label, value, detail }: { label: string; value?: number; detail: string }) => <div className="rounded-2xl border border-border bg-card p-5"><div className="mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</div>{summary.isLoading ? <div className="mt-4 h-9 w-16 animate-pulse rounded bg-secondary"/> : <div className="serif mt-2 text-4xl">{value ?? '—'}</div>}<div className="mt-1 text-xs text-muted-foreground">{detail}</div></div>;
  return <div className="page-enter mx-auto max-w-[1320px] px-5 pb-16 pt-9 md:px-10 md:pt-12">
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mono mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-primary"><ShieldCheck size={13}/> EDITORIAL STUDIO</div><h1 className="serif text-[42px] leading-none tracking-[-.04em]">A thoughtful place takes tending.</h1><p className="mt-3 text-sm text-muted-foreground">Keep the community and its writing in good shape.</p></div><div className="rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">Administrator workspace</div></div>
    {summary.isError && <div className="mb-5"><ErrorState retry={() => summary.refetch()} title="The studio view couldn’t load."/></div>}
    <div className="mb-7 flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">{adminTabs.map(item => <button key={item.id} onClick={() => { setTab(item.id); setSearch(''); }} className={cx('flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm transition', tab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')} data-testid={`button-admin-${item.id}`}>{item.icon}{item.label}</button>)}</div>
    {tab === 'overview' && <div className="space-y-7">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Metric label="MEMBERS" value={summary.data?.totalUsers} detail="people writing and reading"/><Metric label="ALL STORIES" value={summary.data?.totalPosts} detail={`${summary.data?.publishedPosts ?? 0} published · ${summary.data?.draftPosts ?? 0} drafts`}/><Metric label="COMMENTS" value={summary.data?.totalComments} detail="notes left in the margins"/><Metric label="PUBLISHED" value={summary.data?.publishedPosts} detail="stories in public view"/><Metric label="DRAFTS" value={summary.data?.draftPosts} detail="stories still in progress"/><Metric label="TOPICS" value={summary.data?.totalCategories} detail="ways into the reading room"/></div>
      <div className="grid gap-7 lg:grid-cols-2"><section><div className="mb-3 flex items-center justify-between"><h2 className="serif text-2xl">Freshly published</h2><button className="text-xs font-semibold text-primary" onClick={() => setTab('posts')}>All posts <ArrowRight size={13} className="inline"/></button></div>{summary.data?.recentPosts?.length ? <div className="space-y-3">{summary.data.recentPosts.slice(0,4).map(item => <Link key={item.id} href={`/posts/${item.slug}`} className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"><div className="serif text-lg leading-tight">{item.title}</div><div className="mt-2 text-xs text-muted-foreground">{item.author.displayName} · {dateLabel(item.createdAt)}</div></Link>)}</div> : <EmptyState title="Nothing new just yet." description="Recently published stories will appear here."/ >}</section><section><div className="mb-3 flex items-center justify-between"><h2 className="serif text-2xl">Recent notes</h2><button className="text-xs font-semibold text-primary" onClick={() => setTab('conversation')}>Moderate comments <ArrowRight size={13} className="inline"/></button></div>{summary.data?.recentComments?.length ? <div className="space-y-3">{summary.data.recentComments.slice(0,4).map(item => <div key={item.id} className="rounded-xl border border-border bg-card p-4"><div className="line-clamp-2 text-sm leading-6">{item.content}</div><div className="mt-2 text-xs text-muted-foreground">{item.author.displayName} · on “{item.postTitle}”</div></div>)}</div> : <EmptyState icon={<MessageCircle size={22}/>} title="A quiet conversation." description="Recent comments will collect here."/ >}</section></div>
    </div>}
    {tab === 'posts' && <section><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-primary">THE LIBRARY</div><h2 className="serif text-3xl">Every story, in view.</h2></div><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a title or author" className="focus-ring rounded-full border border-input bg-card px-4 py-2.5 text-sm sm:w-64" data-testid="input-admin-post-search"/></div>{postsQuery.isLoading ? <LoadingRows/> : postsQuery.isError ? <ErrorState retry={() => postsQuery.refetch()}/> : postsQuery.data?.content.length ? <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="hidden grid-cols-[minmax(0,1fr)_130px_130px_100px] gap-4 border-b border-border bg-secondary/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground md:grid"><span>Story</span><span>Author</span><span>Status</span><span/></div>{postsQuery.data.content.map(post => <div key={post.id} className="grid gap-3 border-b border-border px-4 py-4 last:border-0 md:grid-cols-[minmax(0,1fr)_130px_130px_100px] md:items-center md:gap-4 md:px-5"><div><Link href={`/posts/${post.slug}`} className="serif text-lg leading-tight hover:text-primary">{post.title}</Link><div className="mt-1 text-xs text-muted-foreground">{dateLabel(post.createdAt)} · {post.likeCount} appreciations</div></div><Link href={`/authors/${post.author.username}`} className="text-sm hover:text-primary">{post.author.displayName}</Link><span className={cx('w-fit rounded-full px-3 py-1 text-xs font-semibold', post.status === 'PUBLISHED' ? 'bg-[#dce7de] text-[#315c50]' : 'bg-secondary text-muted-foreground')}>{post.status.toLowerCase()}</span>{confirmTarget === `post-${post.id}` ? <div className="flex gap-2"><button onClick={() => deletePost.mutate({ slug: post.slug }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListAdminPostsQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); setConfirmTarget(''); } })} className="text-xs font-semibold text-destructive">Confirm</button><button onClick={() => setConfirmTarget('')} className="text-xs text-muted-foreground">Cancel</button></div> : <button onClick={() => setConfirmTarget(`post-${post.id}`)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 size={14}/> Remove</button>}</div>)}</div> : <EmptyState title="No stories match that." description="Try another search term or clear the filter." action={<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>}/>}</section>}
    {tab === 'people' && <section><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-primary">THE COMMUNITY</div><h2 className="serif text-3xl">People behind the words.</h2></div><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, handle, email" className="focus-ring rounded-full border border-input bg-card px-4 py-2.5 text-sm sm:w-72" data-testid="input-admin-user-search"/></div>{usersQuery.isLoading ? <LoadingRows/> : usersQuery.isError ? <ErrorState retry={() => usersQuery.refetch()}/> : usersQuery.data?.content.length ? <div className="overflow-hidden rounded-2xl border border-border bg-card">{usersQuery.data.content.map(user => <UserRow key={user.id} user={user} busy={roleMutation.isPending} onRole={() => roleMutation.mutate({ userId: user.id, data: { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' } }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListAdminUsersQueryKey() }); client.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() }); } })}/>)}</div> : <EmptyState icon={<Users size={22}/>} title="No matching members." description="Try searching by another name or handle." action={<Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>}/>}</section>}
    {tab === 'conversation' && <section><div className="mb-5"><div className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-primary">THE MARGINS</div><h2 className="serif text-3xl">Keep the conversation kind.</h2></div>{commentsQuery.isLoading ? <LoadingRows/> : commentsQuery.isError ? <ErrorState retry={() => commentsQuery.refetch()}/> : commentsQuery.data?.length ? <div className="space-y-3">{commentsQuery.data.map(comment => <div key={comment.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4"><Avatar name={comment.author.displayName} small/><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-x-2"><span className="text-sm font-semibold">{comment.author.displayName}</span><span className="text-xs text-muted-foreground">{dateLabel(comment.createdAt)} · on {comment.postTitle}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{comment.content}</p></div>{confirmTarget === `comment-${comment.id}` ? <div className="flex items-start gap-2"><button className="text-xs font-semibold text-destructive" onClick={() => deleteComment.mutate({ commentId: comment.id }, { onSuccess: () => { client.invalidateQueries({ queryKey: getListAdminCommentsQueryKey() }); setConfirmTarget(''); } })}>Confirm</button><button className="text-xs text-muted-foreground" onClick={() => setConfirmTarget('')}>Cancel</button></div> : <button aria-label="Delete comment" onClick={() => setConfirmTarget(`comment-${comment.id}`)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 size={15}/></button>}</div>)}</div> : <EmptyState icon={<MessageCircle size={22}/>} title="No notes to tend." description="Comments from readers will appear here."/ >}</section>}
    {tab === 'topics' && <section><div className="mb-5"><div className="mono mb-1 text-[10px] uppercase tracking-[.18em] text-primary">THE INDEX</div><h2 className="serif text-3xl">Shape how stories are found.</h2></div><div className="grid gap-7 lg:grid-cols-[.85fr_1.15fr]"><form onSubmit={createTaxonomy} className="h-fit rounded-2xl border border-border bg-card p-5"><h3 className="serif text-2xl">Add to the index</h3><div className="mt-4 flex gap-2"><button type="button" onClick={() => setTaxonomyType('category')} className={cx('rounded-full px-3 py-1.5 text-xs', taxonomyType === 'category' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>Category</button><button type="button" onClick={() => setTaxonomyType('tag')} className={cx('rounded-full px-3 py-1.5 text-xs', taxonomyType === 'tag' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>Tag</button></div><Field label="Name" name="taxonomy" value={taxonomyName} onChange={event => setTaxonomyName(event.target.value)} required maxLength={80} placeholder={taxonomyType === 'category' ? 'e.g. The natural world' : 'e.g. slow living'} className="mt-4"/>{taxonomyType === 'category' && <label className="mt-4 block space-y-1.5"><span className="text-sm font-semibold">Short description</span><textarea value={taxonomyDescription} onChange={event => setTaxonomyDescription(event.target.value)} maxLength={300} rows={3} className="focus-ring w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"/></label>}{error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}<Button className="mt-4" disabled={createCategory.isPending || createTag.isPending}><Plus size={15}/>Add {taxonomyType}</Button></form><div className="space-y-6"><TaxonomyList title="Categories" items={categoriesQuery.data || []} isLoading={categoriesQuery.isLoading} isError={categoriesQuery.isError} onRetry={() => categoriesQuery.refetch()} onUpdate={(id, name, description) => updateCategory.mutate({ categoryId: id, data: { name, description: description || null } }, { onSuccess: refreshTaxonomy, onError: err => setError(getErrorMessage(err)) })} onDelete={id => deleteCategory.mutate({ categoryId: id }, { onSuccess: refreshTaxonomy })}/><TaxonomyList title="Tags" items={tagsQuery.data || []} isLoading={tagsQuery.isLoading} isError={tagsQuery.isError} onRetry={() => tagsQuery.refetch()} onUpdate={(id, name) => updateTag.mutate({ tagId: id, data: { name } }, { onSuccess: refreshTaxonomy, onError: err => setError(getErrorMessage(err)) })} onDelete={id => deleteTag.mutate({ tagId: id }, { onSuccess: refreshTaxonomy })}/></div></div></section>}
  </div>;
}

function UserRow({ user, busy, onRole }: { user: User; busy: boolean; onRole: () => void }) {
  return <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 last:border-0 md:px-5"><Avatar name={user.displayName} small/><div className="min-w-[150px] flex-1"><Link href={`/authors/${user.username}`} className="text-sm font-semibold hover:text-primary">{user.displayName}</Link><div className="text-xs text-muted-foreground">@{user.username} · {user.email}</div></div><span className={cx('rounded-full px-3 py-1 text-xs font-semibold', user.role === 'ADMIN' ? 'bg-[#dce7de] text-[#315c50]' : 'bg-secondary text-muted-foreground')}>{user.role}</span><button disabled={busy} onClick={onRole} className="rounded-full border border-border px-3 py-2 text-xs font-semibold transition hover:border-primary/50 hover:text-primary disabled:opacity-50">{user.role === 'ADMIN' ? 'Make member' : 'Make admin'}</button></div>;
}

function TaxonomyList({ title, items, isLoading, isError, onRetry, onUpdate, onDelete }: { title: string; items: Array<Category | Tag>; isLoading: boolean; isError: boolean; onRetry: () => void; onUpdate: (id: number, name: string, description?: string) => void; onDelete: (id: number) => void }) {
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [removeId, setRemoveId] = useState<number | null>(null);
  return <section><h3 className="serif mb-3 text-2xl">{title}</h3>{isLoading ? <div className="h-24 animate-pulse rounded-2xl bg-secondary"/> : isError ? <ErrorState retry={onRetry} title={`${title} aren’t available.`}/> : items.length ? <div className="overflow-hidden rounded-2xl border border-border bg-card">{items.map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 last:border-0">{editing === item.id ? <><input value={name} onChange={event => setName(event.target.value)} className="focus-ring min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"/>{'description' in item && <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Description" className="focus-ring min-w-[140px] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"/>}<button onClick={() => { onUpdate(item.id, name.trim(), description.trim()); setEditing(null); }} className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Check size={14}/></button><button onClick={() => setEditing(null)} aria-label="Cancel edit" className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><X size={14}/></button></> : <><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{item.name}</div>{'description' in item && item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}</div><span className="text-xs text-muted-foreground">{'postCount' in item ? item.postCount : ''}</span>{removeId === item.id ? <><button onClick={() => { onDelete(item.id); setRemoveId(null); }} className="text-xs font-semibold text-destructive">Confirm</button><button onClick={() => setRemoveId(null)} className="text-xs text-muted-foreground">Cancel</button></> : <><button aria-label={`Edit ${item.name}`} onClick={() => { setEditing(item.id); setName(item.name); setDescription('description' in item ? item.description || '' : ''); }} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-primary"><PenLine size={14}/></button><button aria-label={`Delete ${item.name}`} onClick={() => setRemoveId(item.id)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 size={14}/></button></>}</>}</div>)}</div> : <EmptyState title={`No ${title.toLowerCase()} yet.`} description="Add the first one to help readers find their way."/ >}</section>;
}

function RequireAdmin() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), enabled: !!token } });
  if (!token) return <div className="mx-auto max-w-2xl px-5 py-16"><NeedAccount intent="manage Thoughtline"/></div>;
  if (user.isLoading) return <div className="mx-auto max-w-3xl px-5 py-16"><LoadingRows/></div>;
  if (user.isError) return <div className="mx-auto max-w-3xl px-5 py-16"><ErrorState retry={() => user.refetch()} title="We couldn’t confirm your access."/></div>;
  if (user.data?.role !== 'ADMIN') return <div className="mx-auto max-w-3xl px-5 py-16"><EmptyState icon={<ShieldCheck size={22}/>} title="This room is for the editors." description="Your account doesn’t have administrator access. The rest of Thoughtline is waiting for you." action={<Link href="/" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Return to the reading room</Link>}/></div>;
  return <AdminPage/>;
}

function NotFoundPage() {
  return <div className="mx-auto max-w-xl px-5 py-20 text-center"><div className="mono text-[10px] uppercase tracking-[.2em] text-primary">404 · LOST IN THE MARGINS</div><h1 className="serif mt-4 text-5xl">This page wandered off.</h1><p className="mt-3 text-muted-foreground">There’s plenty more to read where that came from.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Back to Thoughtline <ArrowRight size={15}/></Link></div>;
}

function RouterView() {
  return <Switch>
    <Route path="/" component={HomePage}/>
    <Route path="/login"><AuthPage mode="login"/></Route>
    <Route path="/register"><AuthPage mode="register"/></Route>
    <Route path="/posts/:slug" component={PostPage}/>
    <Route path="/write"><RequireUser><PostEditor/></RequireUser></Route>
    <Route path="/write/:slug"><RequireUser><PostEditor editing/></RequireUser></Route>
    <Route path="/dashboard"><RequireUser><DashboardPage/></RequireUser></Route>
    <Route path="/authors/:username" component={ProfilePage}/>
    <Route path="/admin" component={RequireAdmin}/>
    <Route component={NotFoundPage}/>
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><RouterView/></Shell></Router></QueryClientProvider>;
}

export default App;

