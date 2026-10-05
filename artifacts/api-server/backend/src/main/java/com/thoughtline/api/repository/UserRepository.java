package com.thoughtline.api.repository;

import com.thoughtline.api.model.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    Page<UserAccount> findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(
        String email, String username, String displayName, Pageable pageable
    );
}
