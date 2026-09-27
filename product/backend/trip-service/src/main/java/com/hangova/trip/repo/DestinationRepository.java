package com.hangova.trip.repo;

import java.util.List;
import java.util.Optional;

import com.hangova.trip.model.Destination;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DestinationRepository extends MongoRepository<Destination, String> {

    Optional<Destination> findBySlugIgnoreCase(String slug);

    Optional<Destination> findByNameIgnoreCase(String name);

    List<Destination> findByActiveTrue();

    List<Destination> findByActiveTrueOrderByNameAsc();
}
