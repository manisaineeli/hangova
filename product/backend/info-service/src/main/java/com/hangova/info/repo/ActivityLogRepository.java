package com.hangova.info.repo;

import java.util.List;

import com.hangova.info.model.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ActivityLogRepository extends MongoRepository<ActivityLog, String> {

    List<ActivityLog> findByCategoryOrderByCreatedAtDesc(String category, Pageable pageable);

    List<ActivityLog> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByCategory(String category);
}
