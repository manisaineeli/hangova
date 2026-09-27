package com.hangova.info.repo;

import java.util.List;

import com.hangova.info.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExpenseRepository extends MongoRepository<Expense, String> {

    List<Expense> findByUserIdOrderByDateDesc(String userId);

    List<Expense> findByUserIdAndTripIdOrderByDateDesc(String userId, String tripId);

    List<Expense> findByTripId(String tripId);

    long countByUserId(String userId);
}
