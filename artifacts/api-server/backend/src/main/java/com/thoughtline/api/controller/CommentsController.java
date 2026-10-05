package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.CommentInput;
import com.thoughtline.api.dto.Dtos.CommentResponse;
import com.thoughtline.api.security.BlogPrincipal;
import com.thoughtline.api.service.BlogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CommentsController {
    private final BlogService blogService;

    public CommentsController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/v1/posts/{postId}/comments")
    public List<CommentResponse> comments(
        @PathVariable Long postId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.listComments(postId, principal);
    }

    @PostMapping("/v1/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse createComment(
        @PathVariable Long postId,
        @Valid @RequestBody CommentInput input,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.createComment(postId, input, principal);
    }

    @DeleteMapping("/v1/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
        @PathVariable Long commentId,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        blogService.deleteComment(commentId, principal);
    }
}
