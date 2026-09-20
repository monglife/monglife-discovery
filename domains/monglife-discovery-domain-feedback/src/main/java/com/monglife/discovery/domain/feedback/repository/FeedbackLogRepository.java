package com.monglife.discovery.domain.feedback.repository;

import com.monglife.discovery.domain.feedback.entity.FeedbackLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedbackLogRepository extends JpaRepository<FeedbackLogEntity, Long> {

    Optional<FeedbackLogEntity> findByFeedbackId(Long feedbackId);
}
