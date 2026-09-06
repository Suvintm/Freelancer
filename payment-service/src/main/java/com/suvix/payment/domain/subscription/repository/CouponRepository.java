package com.suvix.payment.domain.subscription.repository;

import com.suvix.payment.domain.subscription.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);
    Optional<Coupon> findByCodeIgnoreCase(String code);
}
