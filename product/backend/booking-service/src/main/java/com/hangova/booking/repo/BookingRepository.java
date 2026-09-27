package com.hangova.booking.repo;

import java.util.List;

import com.hangova.booking.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    List<Booking> findByTypeAndStatusOrderByCreatedAtDesc(String type, String status);

    List<Booking> findByBorrowRequestId(String borrowRequestId);

    long countByStatus(String status);

    long countByType(String type);
}
