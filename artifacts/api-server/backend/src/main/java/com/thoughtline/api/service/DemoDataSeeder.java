package com.thoughtline.api.service;

import com.thoughtline.api.model.*;
import com.thoughtline.api.repository.CategoryRepository;
import com.thoughtline.api.repository.PostRepository;
import com.thoughtline.api.repository.TagRepository;
import com.thoughtline.api.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class DemoDataSeeder implements ApplicationRunner {
    private final UserRepository users;
    private final CategoryRepository categories;
    private final TagRepository tags;
    private final PostRepository posts;
    private final PasswordEncoder passwords;

    public DemoDataSeeder(
        UserRepository users,
        CategoryRepository categories,
        TagRepository tags,
        PostRepository posts,
        PasswordEncoder passwords
    ) {
        this.users = users;
        this.categories = categories;
        this.tags = tags;
        this.posts = posts;
        this.passwords = passwords;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        UserAccount admin = ensureUser(
            "admin", "admin@blog.com", "Thoughtline Editor", "Admin@123", Role.ADMIN
        );
        UserAccount writer = ensureUser(
            "writer", "user@blog.com", "Alex Morgan", "User@123", Role.USER
        );

        Category craft = ensureCategory("Craft & Process", "craft-process", "Notes on the practice of making.");
        Category ideas = ensureCategory("Culture & Ideas", "culture-ideas", "Writing about the ideas shaping our lives.");
        Tag writing = ensureTag("Writing", "writing");
        Tag creativity = ensureTag("Creativity", "creativity");
        Tag culture = ensureTag("Culture", "culture");

        ensurePost(
            writer,
            craft,
            Set.of(writing, creativity),
            "A small ritual for starting well",
            "a-small-ritual-for-starting-well",
            "The first five minutes of a creative practice can shape the rest of the day.",
            "A blank page can feel like a demand. A small ritual turns it into an invitation. Make a cup of tea, close the tabs that do not matter, and write one imperfect sentence. The point is not to make something worth keeping. The point is to begin while the work is still allowed to be curious.\n\nA practice becomes sustainable when it asks for attention instead of performance. Ten honest minutes, repeated often, will take you further than a perfect plan you never start.",
            "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=85"
        );
        ensurePost(
            writer,
            ideas,
            Set.of(culture, writing),
            "What a neighborhood remembers",
            "what-a-neighborhood-remembers",
            "The stories attached to ordinary places make a city feel like somewhere we belong.",
            "A street is more than a line on a map. It is the bakery that knows what you will order, a tree that has outlasted three renovations, and the corner where a friend once stopped to tell you difficult news.\n\nPlaces gather meaning slowly. When we listen to the people who live among them, a neighborhood becomes legible through the details that rarely make a guidebook: how the light moves across a courtyard, which shopkeepers lend a hand, and what has changed without being lost.",
            "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1200&q=85"
        );
        ensurePost(
            admin,
            craft,
            Set.of(writing),
            "Revision is a form of attention",
            "revision-is-a-form-of-attention",
            "Good editing is not a search for mistakes. It is a way of noticing what the piece wants to become.",
            "Revision asks us to return without expecting the first draft to have already solved everything. We look for the sentence that is carrying too much, the detail that opens a door, and the quiet idea we almost cut because it did not arrive loudly.\n\nThe best edits often make a piece feel more itself. They clear away what distracts, protect what is alive, and leave enough room for the reader to take part.",
            "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=85"
        );
    }

    private UserAccount ensureUser(
        String username,
        String email,
        String displayName,
        String password,
        Role role
    ) {
        return users.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserAccount user = new UserAccount();
            user.setUsername(username);
            user.setEmail(email);
            user.setDisplayName(displayName);
            user.setPasswordHash(passwords.encode(password));
            user.setRole(role);
            return users.save(user);
        });
    }

    private Category ensureCategory(String name, String slug, String description) {
        return categories.findBySlug(slug).orElseGet(() -> {
            Category category = new Category();
            category.setName(name);
            category.setSlug(slug);
            category.setDescription(description);
            return categories.save(category);
        });
    }

    private Tag ensureTag(String name, String slug) {
        return tags.findBySlug(slug).orElseGet(() -> {
            Tag tag = new Tag();
            tag.setName(name);
            tag.setSlug(slug);
            return tags.save(tag);
        });
    }

    private void ensurePost(
        UserAccount author,
        Category category,
        Set<Tag> postTags,
        String title,
        String slug,
        String excerpt,
        String content,
        String coverImageUrl
    ) {
        if (posts.existsBySlug(slug)) return;
        BlogPost post = new BlogPost();
        post.setAuthor(author);
        post.setCategory(category);
        post.setTags(postTags);
        post.setTitle(title);
        post.setSlug(slug);
        post.setExcerpt(excerpt);
        post.setContent(content);
        post.setCoverImageUrl(coverImageUrl);
        post.setStatus(PostStatus.PUBLISHED);
        post.setReadingTimeMinutes(Math.max(1, (int) Math.ceil(content.split("\\s+").length / 220.0)));
        post.setViewCount(0);
        posts.save(post);
    }
}
