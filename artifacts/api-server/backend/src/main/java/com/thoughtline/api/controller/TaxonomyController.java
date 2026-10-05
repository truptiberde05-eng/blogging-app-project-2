package com.thoughtline.api.controller;

import com.thoughtline.api.dto.Dtos.CategoryResponse;
import com.thoughtline.api.dto.Dtos.TagResponse;
import com.thoughtline.api.service.BlogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1")
public class TaxonomyController {
    private final BlogService blogService;

    public TaxonomyController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> categories() {
        return blogService.categories();
    }

    @GetMapping("/tags")
    public List<TagResponse> tags() {
        return blogService.tags();
    }
}
