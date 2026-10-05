package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.*;
import com.thoughtline.api.security.BlogPrincipal;
import com.thoughtline.api.service.BlogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/admin")
public class AdminController {
    private final BlogService blogService;

    public AdminController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/dashboard")
    public AdminSummary dashboard(@AuthenticationPrincipal BlogPrincipal principal) {
        return blogService.adminSummary(principal);
    }

    @GetMapping("/posts")
    public PostPage posts(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "all") String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.adminPosts(search, status, page, size, principal);
    }

    @GetMapping("/comments")
    public List<CommentResponse> comments(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.adminComments(page, size, principal);
    }

    @GetMapping("/users")
    public UserPage users(
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.adminUsers(search, page, size, principal);
    }

    @PutMapping("/users/{userId}/role")
    public UserResponse updateRole(
        @PathVariable Long userId,
        @Valid @RequestBody RoleInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.updateRole(userId, input.role(), principal);
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(
        @Valid @RequestBody TaxonomyInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.createCategory(input, principal);
    }

    @PutMapping("/categories/{categoryId}")
    public CategoryResponse updateCategory(
        @PathVariable Long categoryId,
        @Valid @RequestBody TaxonomyInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.updateCategory(categoryId, input, principal);
    }

    @DeleteMapping("/categories/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(
        @PathVariable Long categoryId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        blogService.deleteCategory(categoryId, principal);
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(
        @Valid @RequestBody TaxonomyInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.createTag(input, principal);
    }

    @PutMapping("/tags/{tagId}")
    public TagResponse updateTag(
        @PathVariable Long tagId,
        @Valid @RequestBody TaxonomyInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.updateTag(tagId, input, principal);
    }

    @DeleteMapping("/tags/{tagId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(
        @PathVariable Long tagId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        blogService.deleteTag(tagId, principal);
    }
}
