package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.AuthorProfile;
import com.thoughtline.api.dto.Dtos.PostPage;
import com.thoughtline.api.dto.Dtos.UserResponse;
import com.thoughtline.api.security.BlogPrincipal;
import com.thoughtline.api.service.BlogService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/users")
public class UserController {
    private final BlogService blogService;

    public UserController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/me")
    public UserResponse currentUser(@AuthenticationPrincipal BlogPrincipal principal) {
        return blogService.currentUser(principal);
    }

    @GetMapping("/me/posts")
    public PostPage myPosts(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.myPosts(page, size, principal);
    }

    @GetMapping("/{username}")
    public AuthorProfile authorProfile(@PathVariable String username) {
        return blogService.authorProfile(username);
    }

    @GetMapping("/{username}/posts")
    public PostPage authorPosts(
        @PathVariable String username,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @AuthenticationPrincipal BlogPrincipal principal
    ) {
        return blogService.authorPosts(username, page, size, principal);
    }
}
