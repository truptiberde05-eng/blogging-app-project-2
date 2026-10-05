package com.thoughtline.api.dto;

import com.thoughtline.api.model.PostStatus;
import com.thoughtline.api.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class Dtos {
    private Dtos() {}

    public record RegisterInput(
        @NotBlank @Size(min = 3, max = 32) String username,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 80) String displayName
    ) {}

    public record LoginInput(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(String token, UserResponse user) {}
    public record UserResponse(
        Long id, String username, String email, String displayName, String bio, Role role, Instant createdAt
    ) {}
    public record AuthorProfile(Long id, String username, String displayName, String bio, int postCount) {}
    public record CategoryResponse(Long id, String name, String slug, String description, int postCount) {}
    public record TagResponse(Long id, String name, String slug) {}

    public record PostInput(
        @NotBlank @Size(min = 3, max = 180) String title,
        @Size(max = 400) String excerpt,
        @NotBlank String content,
        @Size(max = 2048) String coverImageUrl,
        @NotNull PostStatus status,
        Long categoryId,
        Set<Long> tagIds
    ) {}

    public record PostResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String content,
        String coverImageUrl,
        PostStatus status,
        int readingTimeMinutes,
        int viewCount,
        long likeCount,
        long commentCount,
        AuthorProfile author,
        CategoryResponse category,
        Set<TagResponse> tags,
        Instant createdAt,
        Instant updatedAt,
        boolean likedByCurrentUser
    ) {}
    public record PostPage(List<PostResponse> content, int page, int size, long totalElements, int totalPages) {}
    public record CommentInput(@NotBlank @Size(max = 2000) String content) {}
    public record CommentResponse(
        Long id,
        String content,
        AuthorProfile author,
        Long postId,
        String postTitle,
        Instant createdAt,
        boolean canDelete
    ) {}
    public record LikeStatus(boolean liked, long likeCount) {}
    public record TaxonomyInput(@NotBlank @Size(max = 80) String name, @Size(max = 300) String description) {}
    public record RoleInput(@NotNull Role role) {}
    public record AdminSummary(
        long totalUsers,
        long totalPosts,
        long publishedPosts,
        long draftPosts,
        long totalComments,
        long totalCategories,
        List<PostResponse> recentPosts,
        List<CommentResponse> recentComments
    ) {}
    public record UserPage(List<UserResponse> content, int page, int size, long totalElements, int totalPages) {}
    public record ApiError(String error) {}
}
