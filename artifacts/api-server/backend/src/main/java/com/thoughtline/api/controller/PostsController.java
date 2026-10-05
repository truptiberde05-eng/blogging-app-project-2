package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.LikeStatus;
import com.thoughtline.api.dto.Dtos.PostInput;
import com.thoughtline.api.dto.Dtos.PostPage;
import com.thoughtline.api.dto.Dtos.PostResponse;
import com.thoughtline.api.security.BlogPrincipal;
import com.thoughtline.api.service.BlogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/posts")
public class PostsController {
    private final BlogService blogService;

    public PostsController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping
    public PostPage listPosts(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String tag,
        @RequestParam(defaultValue = "latest") String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.listPosts(search, category, tag, sort, page, size, principal);
    }

    @GetMapping("/{slug}")
    public PostResponse getPost(
        @PathVariable String slug,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.getPost(slug, principal);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
        @Valid @RequestBody PostInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.createPost(input, principal);
    }

    @PutMapping("/{slug}")
    public PostResponse updatePost(
        @PathVariable String slug,
        @Valid @RequestBody PostInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.updatePost(slug, input, principal);
    }

    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
        @PathVariable String slug,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        blogService.deletePost(slug, principal);
    }

    @PostMapping("/{postId}/likes")
    public LikeStatus likePost(
        @PathVariable Long postId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.likePost(postId, principal);
    }

    @DeleteMapping("/{postId}/likes")
    public LikeStatus unlikePost(
        @PathVariable Long postId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.unlikePost(postId, principal);
    }
}
