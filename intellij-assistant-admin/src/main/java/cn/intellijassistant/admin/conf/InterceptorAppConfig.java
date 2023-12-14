package cn.intellijassistant.admin.conf;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

import javax.annotation.Resource;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/26
 * @Description:
 */
@Component
public class InterceptorAppConfig extends WebMvcConfigurationSupport {

    @Resource
    private AuthInterceptor authInterceptor;
    @Override
    protected void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor);
    }
}
