package cn.intellijassistant.admin.repository;

import cn.intellijassistant.admin.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/1
 * @Description:
 */
public interface AccountMapper extends JpaRepository<Account, String> {
    @Modifying
    @Transactional
    @Query("update Account u set u.commentInvited = true where u.id = :id")
    void commentInvited(@Param("id") String id);
}
