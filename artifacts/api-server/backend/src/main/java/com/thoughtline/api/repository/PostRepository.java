package com.thoughtline.api.repository;

import com.thoughtline.api.model.BlogPost;
import com.thoughtline.api.model.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<BlogPost, Long> {
    Optional<BlogPost> findBySlug(String slug);
    boolean existsBySlug(String slug);
    long countByStatus(PostStatus status);
    long countByAuthorIdAndStatus(Long authorId, PostStatus status);
    long countByCategoryIdAndStatus(Long categoryId, PostStatus status);

    @Query(value = """
        select distinct p from BlogPost p
        left join p.category c
        left join p.tags t
        where p.status = com.thoughtline.api.model.PostStatus.PUBLISHED
          and (:search = '' or lower(p.title) like lower(concat('%', :search, '%'))
               or lower(p.excerpt) like lower(concat('%', :search, '%'))
               or lower(p.content) like lower(concat('%', :search, '%')))
          and (:category = '' or c.slug = :category)
          and (:tag = '' or t.slug = :tag)
        """,
        countQuery = """
        select count(distinct p.id) from BlogPost p
        left join p.category c
        left join p.tags t
        where p.status = com.thoughtline.api.model.PostStatus.PUBLISHED
          and (:search = '' or lower(p.title) like lower(concat('%', :search, '%'))
               or lower(p.excerpt) like lower(concat('%', :search, '%'))
               or lower(p.content) like lower(concat('%', :search, '%')))
          and (:category = '' or c.slug = :category)
          and (:tag = '' or t.slug = :tag)
        """)
    Page<BlogPost> searchPublished(
        @Param("search") String search,
        @Param("category") String category,
        @Param("tag") String tag,
        Pageable pageable
    );

    @Query(value = """
        select p from BlogPost p
        left join p.category c
        left join p.tags t
        left join p.likes postLike
        where p.status = com.thoughtline.api.model.PostStatus.PUBLISHED
          and (:search = '' or lower(p.title) like lower(concat('%', :search, '%'))
               or lower(p.excerpt) like lower(concat('%', :search, '%'))
               or lower(p.content) like lower(concat('%', :search, '%')))
          and (:category = '' or c.slug = :category)
          and (:tag = '' or t.slug = :tag)
        group by p
        order by count(distinct postLike.id) desc, p.createdAt desc
        """,
        countQuery = """
        select count(distinct p.id) from BlogPost p
        left join p.category c
        left join p.tags t
        where p.status = com.thoughtline.api.model.PostStatus.PUBLISHED
          and (:search = '' or lower(p.title) like lower(concat('%', :search, '%'))
               or lower(p.excerpt) like lower(concat('%', :search, '%'))
               or lower(p.content) like lower(concat('%', :search, '%')))
          and (:category = '' or c.slug = :category)
          and (:tag = '' or t.slug = :tag)
        """)
    Page<BlogPost> mostLiked(
        @Param("search") String search,
        @Param("category") String category,
        @Param("tag") String tag,
        Pageable pageable
    );

    @Query("""
        select p from BlogPost p
        where p.author.username = :username
          and (:includeDrafts = true or p.status = com.thoughtline.api.model.PostStatus.PUBLISHED)
        """)
    Page<BlogPost> findAuthorPosts(
        @Param("username") String username,
        @Param("includeDrafts") boolean includeDrafts,
        Pageable pageable
    );

    @Query("""
        select distinct p from BlogPost p
        left join p.category c
        where (:search = '' or lower(p.title) like lower(concat('%', :search, '%'))
               or lower(p.slug) like lower(concat('%', :search, '%')))
          and (:status is null or p.status = :status)
        """)
    Page<BlogPost> searchAll(
        @Param("search") String search,
        @Param("status") PostStatus status,
        Pageable pageable
    );
}
