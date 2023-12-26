package cn.intellijassistant.admin.repository;

import cn.intellijassistant.admin.domain.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/31
 * @Description:
 */
public interface OperationLogMapper extends JpaRepository<OperationLog, String> {

    public List<OperationLog> findByTimeCreateGreaterThan(Long timeFrom);
}
