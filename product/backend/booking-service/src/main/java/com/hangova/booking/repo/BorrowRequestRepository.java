package com.hangova.booking.repo;

import java.util.List;

import com.hangova.booking.model.BorrowRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BorrowRequestRepository extends MongoRepository<BorrowRequest, String> {

    List<BorrowRequest> findByUserIdOrderByCreatedAtDesc(String userId);

    List<BorrowRequest> findByStatusOrderByCreatedAtAsc(String status);

    List<BorrowRequest> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    long countByStatus(String status);

    long countByUserId(String userId);
}
