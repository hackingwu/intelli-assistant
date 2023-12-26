package cn.intellijassistant.admin.conf;

import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/26
 * @Description:
 */
@Component
public class AuthInterceptor extends HandlerInterceptorAdapter {

    @Resource
    private Configuration configuration;
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod) {
            //做一个简单的鉴权
            String apiKey = request.getHeader("x-api-key");
            if (apiKey == null) {
                apiKey = request.getParameter("x-api-key");
            }
            if (apiKey == null || apiKey.length() == 0) return false;

            if (configuration.getServerApiKey().equals(apiKey)) {
                return true;
            }

            return false;
        }
        return true;
    }
}
