package com.hangova.trip.repo;

import java.util.List;
import java.util.Optional;

import com.hangova.trip.model.Trip;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TripRepository extends MongoRepository<Trip, String> {

    List<Trip> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Trip> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    Optional<Trip> findByIdAndUserId(String id, String userId);

    long countByUserId(String userId);

    List<Trip> findByDestinationIgnoreCaseContaining(String destination, Pageable pageable);
}
