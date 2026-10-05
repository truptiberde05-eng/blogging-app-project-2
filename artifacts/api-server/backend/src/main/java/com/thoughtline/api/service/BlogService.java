package com.thoughtline.api.service;

import com.thoughtline.api.dto.Dtos.*;
import com.thoughtline.api.model.*;
import com.thoughtline.api.repository.*;
import com.thoughtline.api.security.BlogPrincipal;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BlogService {
    private static final Pattern NON_SLUG = Pattern.compile("[^a-z0-9]+");

    private final UserRepository users;
    private final PostRepository posts;
    private final CategoryRepository categories;
    private final TagRepository tags;
    private final CommentRepository comments;
    private final PostLikeRepository likes;

    public BlogService(
        UserRepository users,
        PostRepository posts,
        CategoryRepository categories,
        TagRepository tags,
        CommentRepository comments,
        PostLikeRepository likes
    ) {
        this.users = users;
        this.posts = posts;
        this.categories = categories;
        this.tags = tags;
        this.comments = comments;
        this.likes = likes;
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(BlogPrincipal principal) {
        return AuthService.toResponse(account(principal));
    }

    @Transactional(readOnly = true)
    public PostPage myPosts(int page, int size, BlogPrincipal principal) {
        UserAccount author = account(principal);
        return postPage(posts.findAuthorPosts(
            author.getUsername(), true, pageRequest(page, size, "createdAt")
        ), principal);
    }

    @Transactional(readOnly = true)
    public AuthorProfile authorProfile(String username) {
        UserAccount user = users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> notFound("Author not found"));
        return profile(user);
    }

    @Transactional(readOnly = true)
    public PostPage authorPosts(String username, int page, int size, BlogPrincipal principal) {
        UserAccount author = users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> notFound("Author not found"));
        boolean includeDrafts = principal != null
            && principal.id().equals(author.getId());
        Page<BlogPost> result = posts.findAuthorPosts(
            author.getUsername(), includeDrafts, pageRequest(page, size, "createdAt")
        );
        return postPage(result, principal);
    }

    @Transactional(readOnly = true)
    public PostPage listPosts(
        String search, String category, String tag, String sort, int page, int size, BlogPrincipal principal
    ) {
        Pageable pageable = pageRequest(page, size, "createdAt");
        String normalizedSearch = normalize(search);
        Page<BlogPost> result = "most-liked".equalsIgnoreCase(sort)
            ? posts.mostLiked(queryValue(normalizedSearch), queryValue(category), queryValue(tag), pageable)
            : posts.searchPublished(queryValue(normalizedSearch), queryValue(category), queryValue(tag), pageable);
        return postPage(result, principal);
    }

    @Transactional
    public PostResponse getPost(String slug, BlogPrincipal principal) {
        BlogPost post = posts.findBySlug(slug).orElseThrow(() -> notFound("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED && !canManage(post, principal)) {
            throw notFound("Post not found");
        }
        if (post.getStatus() == PostStatus.PUBLISHED) {
            post.setViewCount(post.getViewCount() + 1);
        }
        return postResponse(post, principal);
    }

    @Transactional
    public PostResponse createPost(PostInput input, BlogPrincipal principal) {
        UserAccount author = account(principal);
        BlogPost post = new BlogPost();
        post.setAuthor(author);
        applyPostInput(post, input);
        post.setSlug(uniquePostSlug(slugify(input.title()), null));
        return postResponse(posts.save(post), principal);
    }

    @Transactional
    public PostResponse updatePost(String slug, PostInput input, BlogPrincipal principal) {
        BlogPost post = posts.findBySlug(slug).orElseThrow(() -> notFound("Post not found"));
        requireCanManage(post, principal);
        applyPostInput(post, input);
        return postResponse(posts.save(post), principal);
    }

    @Transactional
    public void deletePost(String slug, BlogPrincipal principal) {
        BlogPost post = posts.findBySlug(slug).orElseThrow(() -> notFound("Post not found"));
        requireCanManage(post, principal);
        posts.delete(post);
    }

    @Transactional
    public LikeStatus likePost(Long postId, BlogPrincipal principal) {
        UserAccount user = account(principal);
        BlogPost post = posts.findById(postId).orElseThrow(() -> notFound("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw notFound("Post not found");
        }
        likes.findByPostIdAndUserId(postId, user.getId()).orElseGet(() -> {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(user);
            return likes.save(like);
        });
        return new LikeStatus(true, likes.countByPostId(postId));
    }

    @Transactional
    public LikeStatus unlikePost(Long postId, BlogPrincipal principal) {
        UserAccount user = account(principal);
        if (!posts.existsById(postId)) {
            throw notFound("Post not found");
        }
        likes.findByPostIdAndUserId(postId, user.getId()).ifPresent(likes::delete);
        return new LikeStatus(false, likes.countByPostId(postId));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(Long postId, BlogPrincipal principal) {
        BlogPost post = posts.findById(postId).orElseThrow(() -> notFound("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED && !canManage(post, principal)) {
            throw notFound("Post not found");
        }
        return comments.findByPostIdOrderByCreatedAtAsc(postId).stream()
            .map(comment -> commentResponse(comment, principal)).toList();
    }

    @Transactional
    public CommentResponse createComment(Long postId, CommentInput input, BlogPrincipal principal) {
        UserAccount author = account(principal);
        BlogPost post = posts.findById(postId).orElseThrow(() -> notFound("Post not found"));
        if (post.getStatus() != PostStatus.PUBLISHED) {
            throw notFound("Post not found");
        }
        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(input.content().trim());
        return commentResponse(comments.save(comment), principal);
    }

    @Transactional
    public void deleteComment(Long commentId, BlogPrincipal principal) {
        UserAccount user = account(principal);
        Comment comment = comments.findById(commentId).orElseThrow(() -> notFound("Comment not found"));
        if (!user.getId().equals(comment.getAuthor().getId()) && user.getRole() != Role.ADMIN) {
            throw forbidden("You can only delete your own comments");
        }
        comments.delete(comment);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> categories() {
        return categories.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
            .map(this::categoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TagResponse> tags() {
        return tags.findAll(Sort.by(Sort.Direction.ASC, "name")).stream()
            .map(this::tagResponse).toList();
    }

    @Transactional(readOnly = true)
    public AdminSummary adminSummary(BlogPrincipal principal) {
        requireAdmin(principal);
        List<PostResponse> recentPosts = posts.findAll(
                PageRequest.of(0, 4, Sort.by(Sort.Direction.DESC, "createdAt"))
            ).getContent().stream()
            .map(post -> postResponse(post, principal)).toList();
        List<CommentResponse> recentComments = comments.findAllByOrderByCreatedAtDesc(
                PageRequest.of(0, 5)
            ).stream()
            .map(comment -> commentResponse(comment, principal)).toList();
        return new AdminSummary(
            users.count(),
            posts.count(),
            posts.countByStatus(PostStatus.PUBLISHED),
            posts.countByStatus(PostStatus.DRAFT),
            comments.count(),
            categories.count(),
            recentPosts,
            recentComments
        );
    }

    @Transactional(readOnly = true)
    public PostPage adminPosts(String search, String status, int page, int size, BlogPrincipal principal) {
        requireAdmin(principal);
        PostStatus postStatus = switch (status == null ? "all" : status.toLowerCase(Locale.ROOT)) {
            case "published" -> PostStatus.PUBLISHED;
            case "draft" -> PostStatus.DRAFT;
            default -> null;
        };
        Page<BlogPost> result = posts.searchAll(
            queryValue(search), postStatus, pageRequest(page, size, "createdAt")
        );
        return postPage(result, principal);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> adminComments(int page, int size, BlogPrincipal principal) {
        requireAdmin(principal);
        return comments.findAllByOrderByCreatedAtDesc(pageRequest(page, size, "createdAt"))
            .stream().map(comment -> commentResponse(comment, principal)).toList();
    }

    @Transactional(readOnly = true)
    public UserPage adminUsers(String search, int page, int size, BlogPrincipal principal) {
        requireAdmin(principal);
        Pageable pageable = pageRequest(page, size, "createdAt");
        String value = normalize(search);
        Page<UserAccount> result = value == null
            ? users.findAll(pageable)
            : users.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
                value, value, value, pageable
            );
        return new UserPage(
            result.getContent().stream().map(AuthService::toResponse).toList(),
            result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()
        );
    }

    @Transactional
    public UserResponse updateRole(Long userId, Role role, BlogPrincipal principal) {
        UserAccount actor = requireAdmin(principal);
        UserAccount target = users.findById(userId).orElseThrow(() -> notFound("User not found"));
        if (actor.getId().equals(target.getId()) && role != Role.ADMIN
            && users.findAll().stream().filter(user -> user.getRole() == Role.ADMIN).count() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The last administrator cannot be demoted");
        }
        target.setRole(role);
        return AuthService.toResponse(users.save(target));
    }

    @Transactional
    public CategoryResponse createCategory(TaxonomyInput input, BlogPrincipal principal) {
        requireAdmin(principal);
        Category category = new Category();
        category.setName(input.name().trim());
        category.setDescription(input.description());
        category.setSlug(uniqueTaxonomySlug(slugify(input.name()), null, false));
        return categoryResponse(categories.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, TaxonomyInput input, BlogPrincipal principal) {
        requireAdmin(principal);
        Category category = categories.findById(id).orElseThrow(() -> notFound("Category not found"));
        category.setName(input.name().trim());
        category.setDescription(input.description());
        category.setSlug(uniqueTaxonomySlug(slugify(input.name()), id, false));
        return categoryResponse(categories.save(category));
    }

    @Transactional
    public void deleteCategory(Long id, BlogPrincipal principal) {
        requireAdmin(principal);
        Category category = categories.findById(id).orElseThrow(() -> notFound("Category not found"));
        categories.delete(category);
    }

    @Transactional
    public TagResponse createTag(TaxonomyInput input, BlogPrincipal principal) {
        requireAdmin(principal);
        Tag tag = new Tag();
        tag.setName(input.name().trim());
        tag.setSlug(uniqueTaxonomySlug(slugify(input.name()), null, true));
        return tagResponse(tags.save(tag));
    }

    @Transactional
    public TagResponse updateTag(Long id, TaxonomyInput input, BlogPrincipal principal) {
        requireAdmin(principal);
        Tag tag = tags.findById(id).orElseThrow(() -> notFound("Tag not found"));
        tag.setName(input.name().trim());
        tag.setSlug(uniqueTaxonomySlug(slugify(input.name()), id, true));
        return tagResponse(tags.save(tag));
    }

    @Transactional
    public void deleteTag(Long id, BlogPrincipal principal) {
        requireAdmin(principal);
        Tag tag = tags.findById(id).orElseThrow(() -> notFound("Tag not found"));
        tags.delete(tag);
    }

    private void applyPostInput(BlogPost post, PostInput input) {
        post.setTitle(input.title().trim());
        post.setExcerpt(input.excerpt() == null || input.excerpt().isBlank()
            ? excerptFrom(input.content()) : input.excerpt().trim());
        post.setContent(input.content().trim());
        post.setCoverImageUrl(input.coverImageUrl() == null || input.coverImageUrl().isBlank()
            ? null : input.coverImageUrl().trim());
        post.setStatus(input.status());
        post.setReadingTimeMinutes(readingTime(input.content()));
        if (input.categoryId() == null) {
            post.setCategory(null);
        } else {
            post.setCategory(categories.findById(input.categoryId())
                .orElseThrow(() -> notFound("Category not found")));
        }
        Set<Long> requestedTagIds = input.tagIds() == null ? Set.of() : input.tagIds();
        post.setTags(requestedTagIds.isEmpty()
            ? new HashSet<>()
            : new HashSet<>(tags.findAllById(requestedTagIds)));
        if (post.getTags().size() != requestedTagIds.size()) {
            throw notFound("One or more tags were not found");
        }
    }

    private PostPage postPage(Page<BlogPost> page, BlogPrincipal principal) {
        return new PostPage(
            page.getContent().stream().map(post -> postResponse(post, principal)).toList(),
            page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages()
        );
    }

    private PostResponse postResponse(BlogPost post, BlogPrincipal principal) {
        Set<TagResponse> tagResponses = post.getTags().stream()
            .map(this::tagResponse)
            .collect(Collectors.toCollection(LinkedHashSet::new));
        boolean liked = principal != null
            && likes.existsByPostIdAndUserId(post.getId(), principal.id());
        return new PostResponse(
            post.getId(), post.getTitle(), post.getSlug(), post.getExcerpt(), post.getContent(),
            post.getCoverImageUrl(), post.getStatus(), post.getReadingTimeMinutes(), post.getViewCount(),
            likes.countByPostId(post.getId()), comments.countByPostId(post.getId()),
            profile(post.getAuthor()),
            post.getCategory() == null ? null : categoryResponse(post.getCategory()),
            tagResponses, post.getCreatedAt(), post.getUpdatedAt(), liked
        );
    }

    private CommentResponse commentResponse(Comment comment, BlogPrincipal principal) {
        boolean canDelete = principal != null
            && (principal.id().equals(comment.getAuthor().getId()) || principal.role() == Role.ADMIN);
        return new CommentResponse(
            comment.getId(), comment.getContent(), profile(comment.getAuthor()),
            comment.getPost().getId(), comment.getPost().getTitle(), comment.getCreatedAt(), canDelete
        );
    }

    private CategoryResponse categoryResponse(Category category) {
        return new CategoryResponse(
            category.getId(), category.getName(), category.getSlug(), category.getDescription(),
            (int) posts.countByCategoryIdAndStatus(category.getId(), PostStatus.PUBLISHED)
        );
    }

    private TagResponse tagResponse(Tag tag) {
        return new TagResponse(tag.getId(), tag.getName(), tag.getSlug());
    }

    private AuthorProfile profile(UserAccount user) {
        return new AuthorProfile(
            user.getId(), user.getUsername(), user.getDisplayName(), user.getBio(),
            (int) posts.countByAuthorIdAndStatus(user.getId(), PostStatus.PUBLISHED)
        );
    }

    private UserAccount account(BlogPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        }
        return users.findById(principal.id()).orElseThrow(() -> notFound("User not found"));
    }

    private UserAccount requireAdmin(BlogPrincipal principal) {
        UserAccount user = account(principal);
        if (user.getRole() != Role.ADMIN) {
            throw forbidden("Administrator access is required");
        }
        return user;
    }

    private boolean canManage(BlogPost post, BlogPrincipal principal) {
        return principal != null
            && (principal.role() == Role.ADMIN || principal.id().equals(post.getAuthor().getId()));
    }

    private void requireCanManage(BlogPost post, BlogPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        }
        if (!canManage(post, principal)) {
            throw forbidden("You can only manage your own posts");
        }
    }

    private Pageable pageRequest(int page, int size, String field) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, field));
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String queryValue(String value) {
        return value == null ? "" : value.trim();
    }

    private String uniquePostSlug(String base, Long currentId) {
        String candidate = base;
        int suffix = 2;
        while (posts.findBySlug(candidate).filter(existing -> !Objects.equals(existing.getId(), currentId)).isPresent()) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String uniqueTaxonomySlug(String base, Long currentId, boolean tag) {
        String candidate = base;
        int suffix = 2;
        while (true) {
            String slug = candidate;
            Optional<?> existing = tag ? tags.findBySlug(slug) : categories.findBySlug(slug);
            if (existing.isEmpty()) return candidate;
            Long existingId = tag ? ((Tag) existing.get()).getId() : ((Category) existing.get()).getId();
            if (Objects.equals(existingId, currentId)) return candidate;
            candidate = base + "-" + suffix++;
        }
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT);
        String slug = NON_SLUG.matcher(normalized).replaceAll("-").replaceAll("^-|-$", "");
        return slug.isBlank() ? "post" : slug;
    }

    private String excerptFrom(String content) {
        String plain = content.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
        return plain.length() <= 180 ? plain : plain.substring(0, 177) + "...";
    }

    private int readingTime(String content) {
        int words = content.trim().isEmpty() ? 0 : content.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil(words / 220.0));
    }

    private ResponseStatusException notFound(String message) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }

    private ResponseStatusException forbidden(String message) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }
}
