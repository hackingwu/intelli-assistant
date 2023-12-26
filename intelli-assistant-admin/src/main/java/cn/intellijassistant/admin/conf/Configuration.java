package cn.intellijassistant.admin.conf;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * @Author: Jason Wu
 * @Date: 2023/12/14
 * @Description:
 */
@Component
@Getter
public class Configuration {

    @Value("${openai.azure.endpoint}")
    private String openaiAzureEndpoint;

    @Value("${openai.azure.api.key}")
    private String openaiAzureApiKey;

    @Value("${baidu.bce.ak}")
    private String baiduBceAK;

    @Value("${baidu.bce.sk}")
    private String baiduBecSK;

    @Value("${server.api.key}")
    private String serverApiKey;

}
