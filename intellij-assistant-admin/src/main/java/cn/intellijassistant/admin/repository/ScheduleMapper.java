package cn.intellijassistant.admin.repository;

import cn.intellijassistant.admin.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/24
 * @Description:
 */
public interface ScheduleMapper extends JpaRepository<Schedule, String> {
    List<Schedule> findByOpenidAndStartTimeBetweenOrderByStartTimeDesc(String openid, Long timeFrom, Long timeTo);
    Long countByOpenid(String openid);

    List<Schedule> findByTimeCreateGreaterThan(Long timeFrom);

//    @Query(value = "select openid, time_create from SCHEDULE where openid in :openids", nativeQuery = true)
    List<ScheduleProjection> findByOpenidIn(Collection<String> openids);

    interface ScheduleProjection {
        String getOpenid();
        Long getTimeCreate();


    }
}
