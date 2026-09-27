package com.hangova.user.repo;

import java.util.List;
import java.util.Optional;

import com.hangova.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByRole(String role);

    List<User> findByEnabledTrue();
}
